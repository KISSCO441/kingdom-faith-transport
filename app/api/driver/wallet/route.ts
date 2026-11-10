import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

async function getDriverContext(request: NextRequest) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!url || !serviceKey || !publishableKey) {
    return { error: NextResponse.json({ error: "Driver wallet service is not configured." }, { status: 500 }) }
  }
  if (!token) return { error: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) }
  const authClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) return { error: NextResponse.json({ error: "Your session is invalid or expired." }, { status: 401 }) }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: driver, error: driverError } = await supabase
    .from("drivers").select("id,full_name,phone,user_id").eq("user_id", data.user.id).maybeSingle()
  if (driverError || !driver) return { error: NextResponse.json({ error: "Your KFM driver profile could not be found." }, { status: 404 }) }
  return { supabase, driver, user: data.user }
}

export async function GET(request: NextRequest) {
  const context = await getDriverContext(request)
  if ("error" in context) return context.error
  const { supabase, driver } = context

  const { data: account, error: accountError } = await supabase
    .from("kfm_wallet_accounts").select("id").eq("account_type", "driver").eq("driver_id", driver.id).maybeSingle()
  if (accountError) return NextResponse.json({ error: "Unable to load your wallet. The Preview wallet migration may not yet be applied." }, { status: 503 })

  const accountId = account?.id
  const [transactionsResult, payoutsResult, profileResult] = await Promise.all([
    accountId
      ? supabase.from("kfm_wallet_transactions").select("id,transaction_type,direction,amount,currency,reference,description,created_at,ride_id,payout_id").eq("wallet_account_id", accountId).order("created_at", { ascending: false }).limit(100)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("kfm_driver_payouts").select("id,amount,payout_status,payout_reference,paid_at,created_at,batch_id").eq("driver_id", driver.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("kfm_driver_payout_profiles").select("id,payout_method,account_name,mobile_money_number,mobile_money_network,bank_name,bank_branch,bank_account_number,verification_status,admin_note,verified_at").eq("driver_id", driver.id).maybeSingle(),
  ])
  if (transactionsResult.error || payoutsResult.error || profileResult.error) {
    return NextResponse.json({ error: "Unable to load wallet details. Please contact KFM." }, { status: 500 })
  }
  const transactions = transactionsResult.data ?? []
  const ledgerBalance = transactions.reduce((sum, row) => sum + (row.direction === "credit" ? 1 : -1) * Number(row.amount), 0)
  const { data: reservations, error: reservationsError } = await supabase
    .from("kfm_driver_payouts").select("amount").eq("driver_id", driver.id).in("payout_status", ["pending", "approved"])
  if (reservationsError) return NextResponse.json({ error: "Unable to calculate available wallet balance." }, { status: 500 })
  const reserved = (reservations ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
  return NextResponse.json({
    success: true,
    driver: { id: driver.id, full_name: driver.full_name, phone: driver.phone },
    wallet: { currency: "GHS", ledger_balance: Number(ledgerBalance.toFixed(2)), reserved_for_payout: Number(reserved.toFixed(2)), available_balance: Number((ledgerBalance - reserved).toFixed(2)) },
    transactions,
    payouts: payoutsResult.data ?? [],
    payout_profile: profileResult.data ?? null,
  })
}

export async function POST(request: NextRequest) {
  const context = await getDriverContext(request)
  if ("error" in context) return context.error
  const { supabase, driver } = context
  try {
    const body = await request.json()
    const method = body.payout_method === "bank" ? "bank" : body.payout_method === "mobile_money" ? "mobile_money" : ""
    const accountName = typeof body.account_name === "string" ? body.account_name.trim() : ""
    if (!method || !accountName) return NextResponse.json({ error: "Choose a payout method and enter the account holder's name." }, { status: 400 })

    const values: Record<string, unknown> = {
      driver_id: driver.id,
      payout_method: method,
      account_name: accountName,
      verification_status: "pending",
      verified_by: null,
      verified_at: null,
      admin_note: null,
      updated_at: new Date().toISOString(),
    }
    if (method === "mobile_money") {
      const number = String(body.mobile_money_number ?? "").replace(/[\s-]/g, "")
      const network = String(body.mobile_money_network ?? "")
      if (!/^(0\d{9}|233\d{9})$/.test(number) || !["MTN", "Telecel", "AirtelTigo"].includes(network)) {
        return NextResponse.json({ error: "Enter a valid Ghana mobile money number and select its network." }, { status: 400 })
      }
      values.mobile_money_number = number
      values.mobile_money_network = network
      values.bank_name = null
      values.bank_branch = null
      values.bank_account_number = null
    } else {
      const bankName = typeof body.bank_name === "string" ? body.bank_name.trim() : ""
      const bankAccount = typeof body.bank_account_number === "string" ? body.bank_account_number.trim() : ""
      if (!bankName || !bankAccount) return NextResponse.json({ error: "Enter the bank name and account number." }, { status: 400 })
      values.bank_name = bankName
      values.bank_branch = typeof body.bank_branch === "string" ? body.bank_branch.trim() : null
      values.bank_account_number = bankAccount
      values.mobile_money_number = null
      values.mobile_money_network = null
    }

    const { data, error } = await supabase.from("kfm_driver_payout_profiles")
      .upsert(values, { onConflict: "driver_id" })
      .select("id,payout_method,account_name,mobile_money_number,mobile_money_network,bank_name,bank_branch,bank_account_number,verification_status,admin_note,verified_at")
      .single()
    if (error) {
      console.error("KFM driver payout profile save failed:", error)
      return NextResponse.json({ error: "Unable to save payout details. Please try again." }, { status: 500 })
    }
    return NextResponse.json({ success: true, payout_profile: data, message: "Payout details submitted. KFM must verify them before a payout can be approved." })
  } catch (error) {
    console.error("KFM driver payout profile error:", error)
    return NextResponse.json({ error: "Unable to save payout details." }, { status: 500 })
  }
}
