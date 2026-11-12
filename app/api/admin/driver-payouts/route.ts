import { NextRequest, NextResponse } from "next/server"
import { requireKfmAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const [balances, batches, payouts, kfmCommission, cashCommissionDue, drivers] = await Promise.all([
      auth.supabase.rpc("kfm_list_driver_wallet_balances"),
      auth.supabase.from("kfm_driver_payout_batches").select("id,period_start,period_end,scheduled_for,batch_status,total_amount,payout_count,created_at,approved_at").order("created_at",{ascending:false}).limit(30),
      auth.supabase.from("kfm_driver_payouts").select("id,batch_id,driver_id,amount,payout_status,payout_reference,paid_at,admin_note,created_at,payout_method,payout_account_name,payout_mobile_money_number,payout_mobile_money_network").order("created_at",{ascending:false}).limit(200),
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

