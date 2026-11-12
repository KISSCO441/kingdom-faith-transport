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
    .from("drivers").select("id,full_name,phone,user_id,momo_number,momo_network,status").eq("user_id", data.user.id).maybeSingle()
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
  const [transactionsResult, payoutsResult] = await Promise.all([
    accountId
      ? supabase.from("kfm_wallet_transactions").select("id,transaction_type,direction,amount,currency,reference,description,created_at,ride_id,payout_id").eq("wallet_account_id", accountId).order("created_at", { ascending: false }).limit(100)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("kfm_driver_payouts").select("id,amount,payout_status,payout_reference,paid_at,created_at,batch_id").eq("driver_id", driver.id).order("created_at", { ascending: false }).limit(30),
  ])
  if (transactionsResult.error || payoutsResult.error) {
    return NextResponse.json({ error: "Unable to load wallet details. Please contact KFM." }, { status: 500 })
  }
  const transactions = transactionsResult.data ?? []
  const { data: balanceRows, error: balanceError } = await supabase
    .rpc("kfm_get_driver_wallet_balance", { p_driver_id: driver.id })
  if (balanceError) return NextResponse.json({ error: "Unable to calculate your complete wallet balance." }, { status: 500 })
  const balance = Array.isArray(balanceRows) ? balanceRows[0] : null
  const ledgerBalance = Number(balance?.ledger_balance ?? 0)
  const reserved = Number(balance?.reserved_amount ?? 0)
  const available = Number(balance?.available_balance ?? (ledgerBalance - reserved))
  return NextResponse.json({
    success: true,
    driver: { id: driver.id, full_name: driver.full_name, phone: driver.phone, momo_number: driver.momo_number, momo_network: driver.momo_network, registration_status: driver.status },
    wallet: { currency: "GHS", ledger_balance: Number(ledgerBalance.toFixed(2)), reserved_for_payout: Number(reserved.toFixed(2)), available_balance: Number(available.toFixed(2)) },
    transactions,
    payouts: payoutsResult.data ?? [],
    payout_destination: { method: "mobile_money", number: driver.momo_number, network: driver.momo_network, verified: String(driver.status ?? "").toUpperCase() === "VERIFIED" && Boolean(driver.momo_number && driver.momo_network) },
  })
}

