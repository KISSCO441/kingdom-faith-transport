import { NextRequest, NextResponse } from "next/server"
import { requireKfmAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const [balances, batches, payouts, kfmCommission, cashCommissionDue, drivers] = await Promise.all([
      auth.supabase.rpc("kfm_list_driver_wallet_balances"),
      auth.supabase.from("kfm_driver_payout_batches").select("id,period_start,period_end,scheduled_for,batch_status,total_amount,payout_count,created_at,approved_at").order("created_at",{ascending:false}).limit(30),
      auth.supabase.from("kfm_driver_payouts").select("id,batch_id,driver_id,amount,payout_status,payout_reference,paid_at,admin_note,created_at,payout_method,payout_account_name,payout_mobile_money_number,payout_mobile_money_network,paystack_transfer_status,paystack_transfer_reference,paystack_transfer_message,paystack_transfer_mode").order("created_at",{ascending:false}).limit(200),
      auth.supabase.rpc("kfm_get_kfm_commission_balance"),
      auth.supabase.rpc("kfm_get_cash_commission_due_balance"),
      auth.supabase.from("drivers").select("id,full_name,phone,momo_number,momo_network,status").order("full_name"),
    ])
    const failed = [balances.error,batches.error,payouts.error,kfmCommission.error,cashCommissionDue.error,drivers.error].find(Boolean)
    if (failed) {
      console.error("KFM admin wallet load failed:", failed)
      return NextResponse.json({ error: "Wallet tables or RPC are not ready. Apply the wallet migration to KFM-PREVIEW first." }, { status: 503 })
    }
    return NextResponse.json({ success:true, balances:balances.data ?? [], batches:batches.data ?? [], payouts:payouts.data ?? [], kfm_commission_balance:kfmCommission.data ?? 0, cash_commission_due_balance:cashCommissionDue.data ?? 0, drivers:drivers.data ?? [] })
  } catch (error) {
    console.error("KFM admin wallet GET error:",error)
    return NextResponse.json({ error:"Unable to load driver wallet administration." },{status:500})
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireKfmAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const body = await request.json()
    const action = String(body.action ?? "")
    if (action === "create-batch") {
      const periodStart = String(body.period_start ?? "")
      const periodEnd = String(body.period_end ?? "")
      const scheduledFor = String(body.scheduled_for ?? "")
      if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart) || !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd) || !/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor)) {
        return NextResponse.json({ error:"Choose a valid statement period and Friday payout date." },{status:400})
      }
      const { data,error } = await auth.supabase.rpc("kfm_create_driver_payout_batch",{
        p_period_start:periodStart,p_period_end:periodEnd,p_scheduled_for:scheduledFor,p_created_by:auth.user.id,
      })
      if (error) {
        console.error("KFM payout batch creation failed:",error)
        return NextResponse.json({ error:error.message.includes("Friday") ? error.message : "Unable to prepare the payout batch. Check the period and available verified balances." },{status:400})
      }
      return NextResponse.json({ success:true,batch:data })
    }
    if (action === "create-selected-batch") {
      const periodStart=String(body.period_start ?? "")
      const periodEnd=String(body.period_end ?? "")
      const scheduledFor=String(body.scheduled_for ?? "")
      const driverIds=Array.isArray(body.driver_ids)?body.driver_ids.filter((id: unknown):id is string=>typeof id==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)):[]
      if(!/^\d{4}-\d{2}-\d{2}$/.test(periodStart)||!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)||!/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor)||driverIds.length===0)
        return NextResponse.json({error:"Choose valid dates and at least one driver."},{status:400})
      const {data,error}=await auth.supabase.rpc("kfm_create_selected_driver_payout_batch",{
        p_period_start:periodStart,p_period_end:periodEnd,p_scheduled_for:scheduledFor,p_created_by:auth.user.id,p_driver_ids:[...new Set(driverIds)],
      })
      if(error){
        console.error("KFM selected payout batch creation failed:",error)
        return NextResponse.json({error:error.message.includes("eligible")||error.message.includes("Select")||error.message.includes("Friday")?error.message:"Unable to prepare selected payouts. Refresh and check driver eligibility."},{status:409})
      }
      return NextResponse.json({success:true,batch:data})
    }
    if (action === "send-paystack-transfer") {
      const payoutId = String(body.payout_id ?? "")
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payoutId)) {
        return NextResponse.json({ error: "A valid payout is required." }, { status: 400 })
      }

      const secretKey = process.env.PAYSTACK_SECRET_KEY
      const transfersEnabled = process.env.KFM_PAYSTACK_TRANSFERS_ENABLED === "true"
      const mode = process.env.KFM_PAYSTACK_TRANSFER_MODE || (process.env.VERCEL_ENV === "production" ? "live" : "test")
      const isProduction = process.env.VERCEL_ENV === "production"
      if (!transfersEnabled) return NextResponse.json({ error: "Paystack driver transfers are not enabled for this deployment." }, { status: 403 })
      if (!secretKey) return NextResponse.json({ error: "Paystack secret key is not configured." }, { status: 503 })
      if ((!isProduction && mode !== "test") || (mode === "test" && !secretKey.startsWith("sk_test_"))) {
        return NextResponse.json({ error: "Preview transfers are restricted to a Paystack test secret key. No live money can be sent from Preview." }, { status: 403 })
      }
      if ((isProduction && mode !== "live") || (mode === "live" && (!isProduction || !secretKey.startsWith("sk_live_")))) {
        return NextResponse.json({ error: "Live Paystack transfers are not permitted from this deployment." }, { status: 403 })
      }

      const { data: payout, error: payoutError } = await auth.supabase
        .from("kfm_driver_payouts")
        .select("id,batch_id,driver_id,amount,payout_status,payout_account_name,payout_mobile_money_number,payout_mobile_money_network,paystack_recipient_code,paystack_transfer_status,paystack_transfer_reference")
        .eq("id", payoutId)
        .maybeSingle()
      if (payoutError || !payout) return NextResponse.json({ error: "Payout not found. Confirm the Paystack payout migration is installed." }, { status: 404 })
      if (payout.payout_status !== "approved") return NextResponse.json({ error: "Only approved payouts can be sent through Paystack." }, { status: 409 })
      if (payout.paystack_transfer_status !== "not_started") return NextResponse.json({ error: "A Paystack transfer has already been attempted or is awaiting a final result. Do not send it again." }, { status: 409 })

      const { data: batch, error: batchError } = await auth.supabase
        .from("kfm_driver_payout_batches")
        .select("batch_status")
        .eq("id", payout.batch_id)
        .maybeSingle()
      if (batchError || batch?.batch_status !== "approved") return NextResponse.json({ error: "The payout batch must be approved before sending." }, { status: 409 })

      const { data: driver, error: driverError } = await auth.supabase
        .from("drivers")
        .select("id,full_name,momo_number,momo_network,status")
        .eq("id", payout.driver_id)
        .maybeSingle()
      if (driverError || !driver || String(driver.status || "").toUpperCase() !== "VERIFIED") {
        return NextResponse.json({ error: "The driver is no longer verified. Review the payout destination before proceeding." }, { status: 409 })
      }
      if (String(driver.momo_number || "").trim() !== String(payout.payout_mobile_money_number || "").trim()
        || driver.momo_network !== payout.payout_mobile_money_network) {
        return NextResponse.json({ error: "The driver's registered MoMo details have changed since this payout was prepared. Do not send; prepare a new reviewed payout." }, { status: 409 })
      }

      const bankCode: Record<string, string> = { MTN: "MTN", AirtelTigo: "ATL", Telecel: "VOD" }
      const bank_code = bankCode[String(driver.momo_network)]
      if (!bank_code) return NextResponse.json({ error: "This Mobile Money network is not supported for Paystack transfers." }, { status: 400 })

      const amountPesewas = Math.round(Number(payout.amount) * 100)
      if (!Number.isSafeInteger(amountPesewas) || amountPesewas <= 0) return NextResponse.json({ error: "The approved payout amount is invalid." }, { status: 400 })

      const reference = `kfm_payout_${payout.id.replace(/-/g, "")}`
      const { data: claimed, error: claimError } = await auth.supabase
        .from("kfm_driver_payouts")
        .update({
          paystack_transfer_status: "initiating",
          paystack_transfer_reference: reference,
          paystack_transfer_mode: mode,
          paystack_transfer_attempted_at: new Date().toISOString(),
          paystack_transfer_message: "KFM is preparing the Paystack transfer.",
        })
        .eq("id", payout.id)
        .eq("payout_status", "approved")
        .eq("paystack_transfer_status", "not_started")
        .select("id")
        .maybeSingle()
      if (claimError || !claimed) return NextResponse.json({ error: "This payout was already claimed for transfer. Refresh before taking any further action." }, { status: 409 })

      try {
        let recipientCode = payout.paystack_recipient_code
        if (!recipientCode) {
          const recipientResponse = await fetch("https://api.paystack.co/transferrecipient", {
            method: "POST",
            headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "mobile_money",
              name: payout.payout_account_name || driver.full_name || "KFM Driver",
              account_number: payout.payout_mobile_money_number,
              bank_code,
              currency: "GHS",
            }),
            cache: "no-store",
          })
          const recipientResult = await recipientResponse.json()
          if (!recipientResponse.ok || recipientResult?.status !== true || !recipientResult?.data?.recipient_code) {
            await auth.supabase.from("kfm_driver_payouts").update({
              paystack_transfer_status: "failed",
              paystack_transfer_message: String(recipientResult?.message || "Paystack could not create the Mobile Money recipient.").slice(0, 500),
            }).eq("id", payout.id).eq("paystack_transfer_status", "initiating")
            return NextResponse.json({ error: recipientResult?.message || "Paystack could not create the Mobile Money recipient." }, { status: 502 })
          }
          recipientCode = recipientResult.data.recipient_code
          await auth.supabase.from("kfm_driver_payouts").update({ paystack_recipient_code: recipientCode })
            .eq("id", payout.id).eq("paystack_transfer_status", "initiating")
        }

        const transferResponse = await fetch("https://api.paystack.co/transfer", {
          method: "POST",
          headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "balance",
            amount: amountPesewas,
            recipient: recipientCode,
            reference,
            reason: `KFM Friday driver payout ${payout.id}`,
            currency: "GHS",
          }),
          cache: "no-store",
        })
        const transferResult = await transferResponse.json()
        if (!transferResponse.ok || transferResult?.status !== true) {
          await auth.supabase.from("kfm_driver_payouts").update({
            paystack_transfer_status: "failed",
            paystack_transfer_message: String(transferResult?.message || "Paystack rejected the transfer request.").slice(0, 500),
          }).eq("id", payout.id).eq("paystack_transfer_status", "initiating")
          return NextResponse.json({ error: transferResult?.message || "Paystack rejected the transfer request." }, { status: 502 })
        }

        const transferStatus = String(transferResult?.data?.status || "pending").toLowerCase()
        const safeStatus = ["pending", "otp", "success", "failed"].includes(transferStatus) ? transferStatus : "pending"
        const storedStatus = mode === "test" && safeStatus === "success" ? "test_success" : safeStatus
        await auth.supabase.from("kfm_driver_payouts").update({
          paystack_transfer_status: storedStatus,
          paystack_transfer_code: transferResult?.data?.transfer_code || null,
          paystack_transfer_message: mode === "test" && storedStatus === "test_success"
            ? "Paystack test transfer succeeded; no real funds were sent."
            : String(transferResult?.message || "Paystack accepted the transfer request. Awaiting final confirmation.").slice(0, 500),
          ...(storedStatus === "test_success" ? { paystack_transfer_completed_at: new Date().toISOString() } : {}),
        }).eq("id", payout.id).eq("paystack_transfer_status", "initiating")

        return NextResponse.json({
          success: true,
          transfer_status: storedStatus,
          reference,
          message: storedStatus === "test_success"
            ? "Paystack test transfer succeeded. No money was sent and the payout remains unpaid."
            : "Paystack accepted the transfer request. KFM will mark the payout paid only after Paystack confirms success.",
        })
      } catch (transferError) {
        console.error("KFM Paystack transfer request outcome is uncertain:", transferError)
        await auth.supabase.from("kfm_driver_payouts").update({
          paystack_transfer_status: "unknown",
          paystack_transfer_message: "The transfer request outcome could not be confirmed. Check Paystack before any retry.",
        }).eq("id", payout.id).eq("paystack_transfer_status", "initiating")
        return NextResponse.json({ error: "Paystack's response could not be confirmed. This payout is locked against duplicate sending; check Paystack before retrying." }, { status: 502 })
      }
    }
    if (action === "approve-batch") {
      const batchId = String(body.batch_id ?? "")
      if (!batchId) return NextResponse.json({error:"Payout batch is required."},{status:400})
      const {data,error}=await auth.supabase.rpc("kfm_approve_driver_payout_batch",{p_batch_id:batchId,p_admin_id:auth.user.id})
      if(error) return NextResponse.json({error:error.message},{status:409})
      return NextResponse.json({success:true,result:data})
    }
    if (action === "mark-paid") {
      const payoutId=String(body.payout_id ?? "")
      const reference=String(body.reference ?? "").trim()
      if(!payoutId || !reference) return NextResponse.json({error:"Payout and external transfer reference are required."},{status:400})
      const {data,error}=await auth.supabase.rpc("kfm_mark_driver_payout_paid",{p_payout_id:payoutId,p_reference:reference,p_admin_id:auth.user.id})
      if(error) return NextResponse.json({error:error.message},{status:409})
      return NextResponse.json({success:true,result:data})
    }
    if (action === "hold-payout") {
      const payoutId=String(body.payout_id ?? "")
      const note=String(body.note ?? "").trim()
      if(!payoutId || !note) return NextResponse.json({error:"Payout and a reason for the hold are required."},{status:400})
      const {data,error}=await auth.supabase.rpc("kfm_hold_driver_payout",{p_payout_id:payoutId,p_admin_id:auth.user.id,p_note:note})
      if(error) return NextResponse.json({error:error.message},{status:409})
      return NextResponse.json({success:true,result:data})
    }
    if (action === "release-payout") {
      const payoutId=String(body.payout_id ?? "")
      const releaseNote=String(body.note ?? "").trim()
      if(!payoutId || !releaseNote) return NextResponse.json({error:"Payout and a reason for releasing the hold are required."},{status:400})
      const {data,error}=await auth.supabase.rpc("kfm_release_driver_payout",{p_payout_id:payoutId,p_admin_id:auth.user.id,p_release_note:releaseNote})
      if(error) return NextResponse.json({error:error.message},{status:409})
      return NextResponse.json({success:true,result:data})
    }
    return NextResponse.json({error:"Unsupported wallet administration action."},{status:400})
  } catch (error) {
    console.error("KFM admin wallet POST error:",error)
    return NextResponse.json({error:"Unable to process the wallet administration request."},{status:500})
  }
}

