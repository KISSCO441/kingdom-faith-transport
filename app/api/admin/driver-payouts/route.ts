import { NextRequest, NextResponse } from "next/server"
import { requireKfmAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const [balances, profiles, batches, payouts, kfmCommission, drivers] = await Promise.all([
      auth.supabase.rpc("kfm_list_driver_wallet_balances"),
      auth.supabase.from("kfm_driver_payout_profiles").select("id,driver_id,payout_method,account_name,mobile_money_number,mobile_money_network,bank_name,bank_branch,bank_account_number,verification_status,admin_note,verified_at,updated_at"),
      auth.supabase.from("kfm_driver_payout_batches").select("id,period_start,period_end,scheduled_for,batch_status,total_amount,payout_count,created_at,approved_at").order("created_at",{ascending:false}).limit(30),
      auth.supabase.from("kfm_driver_payouts").select("id,batch_id,driver_id,amount,payout_status,payout_reference,paid_at,admin_note,created_at").order("created_at",{ascending:false}).limit(200),
      auth.supabase.rpc("kfm_get_kfm_commission_balance"),
      auth.supabase.from("drivers").select("id,full_name,phone").order("full_name"),
    ])
    const failed = [balances.error,profiles.error,batches.error,payouts.error,kfmCommission.error,drivers.error].find(Boolean)
    if (failed) {
      console.error("KFM admin wallet load failed:", failed)
      return NextResponse.json({ error: "Wallet tables or RPC are not ready. Apply the wallet migration to KFM-PREVIEW first." }, { status: 503 })
    }
    return NextResponse.json({ success:true, balances:balances.data ?? [], profiles:profiles.data ?? [], batches:batches.data ?? [], payouts:payouts.data ?? [], kfm_commission_balance:kfmCommission.data ?? 0, drivers:drivers.data ?? [] })
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
    return NextResponse.json({error:"Unsupported wallet administration action."},{status:400})
  } catch (error) {
    console.error("KFM admin wallet POST error:",error)
    return NextResponse.json({error:"Unable to process the wallet administration request."},{status:500})
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireKfmAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const body = await request.json()
    const profileId=String(body.profile_id ?? "")
    const status=String(body.status ?? "")
    const note=String(body.note ?? "").trim()
    if(!profileId || !["verified","rejected"].includes(status)) return NextResponse.json({error:"Choose a valid payout profile and verification decision."},{status:400})
    const {data,error}=await auth.supabase.from("kfm_driver_payout_profiles").update({
      verification_status:status,admin_note:note || null,verified_by:status==="verified"?auth.user.id:null,
      verified_at:status==="verified"?new Date().toISOString():null,updated_at:new Date().toISOString(),
    }).eq("id",profileId).select("id,driver_id,verification_status,admin_note,verified_at").maybeSingle()
    if(error || !data) return NextResponse.json({error:"Unable to update payout profile verification."},{status:500})
    return NextResponse.json({success:true,profile:data})
  } catch(error) {
    console.error("KFM admin payout profile review failed:",error)
    return NextResponse.json({error:"Unable to review payout profile."},{status:500})
  }
}
