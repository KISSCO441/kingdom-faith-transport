"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase as supabaseClient } from "@/lib/supabase"

type Balance = { driver_id:string; full_name:string|null; phone:string|null; wallet_account_id:string; ledger_balance:number; reserved_amount:number; available_balance:number }
type Batch = { id:string; period_start:string; period_end:string; scheduled_for:string; batch_status:string; total_amount:number; payout_count:number; created_at:string }
type Payout = { id:string; batch_id:string; driver_id:string; amount:number; payout_status:string; payout_reference:string|null; paid_at:string|null; admin_note:string|null; created_at:string; payout_method:string; payout_account_name:string; payout_mobile_money_number:string; payout_mobile_money_network:string }
type Data = { balances:Balance[]; batches:Batch[]; payouts:Payout[]; kfm_commission_balance:number; drivers:Array<{id:string;full_name:string|null;phone:string|null;momo_number:string|null;momo_network:string|null;status:string|null}> }

const money=(v:number)=>`GH₵ ${Number(v||0).toFixed(2)}`
const dateValue=(d:Date)=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10)}
function nextFriday(){const d=new Date();const days=(5-d.getDay()+7)%7;d.setDate(d.getDate()+(days===0?7:days));return dateValue(d)}

export default function AdminDriverPayoutsPage(){
 const [data,setData]=useState<Data|null>(null)
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState("")
 const [error,setError]=useState("")
 const [notice,setNotice]=useState("")
 const [periodStart,setPeriodStart]=useState(()=>{const d=new Date();d.setDate(d.getDate()-7);return dateValue(d)})
 const [periodEnd,setPeriodEnd]=useState(()=>dateValue(new Date()))
 const [scheduledFor,setScheduledFor]=useState(nextFriday)

 const request=useCallback(async(method:"GET"|"POST",body?:Record<string,unknown>)=>{
   const {data:session,error:sessionError}=await supabaseClient!.auth.getSession()
   const token=session.session?.access_token
   if(sessionError||!token)throw new Error("Please sign in again to access KFM administration.")
   const response=await fetch("/api/admin/driver-payouts",{method,headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},...(body?{body:JSON.stringify(body)}:{}),cache:"no-store"})
   const result=await response.json()
   if(!response.ok||!result.success)throw new Error(result.error||"KFM payout request failed.")
   return result
 },[])

 const load=useCallback(async()=>{
   try{setError("");const result=await request("GET");setData(result)}catch(e){setError(e instanceof Error?e.message:"Unable to load payouts.")}finally{setLoading(false)}
 },[request])
 useEffect(()=>{load()},[load])

 async function act(key:string,body:Record<string,unknown>,message:string){
   try{setBusy(key);setError("");setNotice("");await request("POST",body);setNotice(message);await load()}catch(e){setError(e instanceof Error?e.message:"Unable to complete action.")}finally{setBusy("")}
 }

 const balanceByDriver=new Map((data?.balances||[]).map(x=>[x.driver_id,x]))

 if(loading)return <main className="min-h-screen bg-gray-50 p-6"><div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 text-center">Loading KFM driver wallets…</div></main>

 return <main className="min-h-screen bg-gray-50 px-4 py-8"><div className="mx-auto max-w-6xl space-y-6">
  <header className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-gray-500">Kingdom Faith Marketplace Transport · Administration</p><h1 className="mt-1 text-3xl font-bold">Driver Wallets & Friday Payouts</h1><p className="mt-1 text-sm text-gray-600">Review driver earnings, existing verified Mobile Money details and weekly payout batches.</p></header>
  {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
  {notice&&<div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</div>}
  <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
   <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Drivers with wallet accounts</p><p className="mt-2 text-2xl font-bold">{data?.balances.length||0}</p></div>
   <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Available for payout</p><p className="mt-2 text-2xl font-bold text-green-700">{money((data?.balances||[]).reduce((s,x)=>s+Math.max(0,Number(x.available_balance)),0))}</p></div>
   <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Verified drivers with MoMo details</p><p className="mt-2 text-2xl font-bold text-green-700">{(data?.drivers||[]).filter(x=>String(x.status||"").toUpperCase()==="VERIFIED"&&x.momo_number&&x.momo_network).length}</p></div>
   <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">KFM commission ledger</p><p className="mt-2 text-2xl font-bold">{money(data?.kfm_commission_balance||0)}</p><p className="mt-1 text-xs text-gray-500">Recorded KFM 20% commission, including cash commission due from drivers</p></div>
  </section>
  <section className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Driver wallet balances</h2><p className="text-sm text-gray-500">Online ride shares are credited; cash commission is deducted from the driver wallet. Negative balances must be cleared before payout.</p></div><Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</Button></div>
   <div className="mt-4 space-y-3">{!data?.balances.length?<p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No wallet accounts have been created by confirmed completed rides yet.</p>:data.balances.map(b=><article key={b.driver_id} className="rounded-xl border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{b.full_name||"Driver"}</p><p className="text-xs text-gray-500">{b.phone||"No phone recorded"}</p></div><div className="grid grid-cols-3 gap-3 text-right text-sm"><div><p className="text-xs text-gray-500">Ledger</p><p className="font-semibold">{money(b.ledger_balance)}</p></div><div><p className="text-xs text-gray-500">Reserved</p><p className="font-semibold text-amber-700">{money(b.reserved_amount)}</p></div><div><p className="text-xs text-gray-500">Available</p><p className={`font-bold ${Number(b.available_balance)<0?"text-red-700":"text-green-700"}`}>{money(b.available_balance)}</p></div></div></div></article>)}</div>
  </section>

  <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Prepare Friday payout batch</h2><p className="text-sm text-gray-500">This reserves positive available balances for verified drivers with an existing Mobile Money number and network in their KFM registration. It does not transfer money.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-sm">Period start<input type="date" value={periodStart} onChange={e=>setPeriodStart(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"/></label><label className="text-sm">Period end<input type="date" value={periodEnd} onChange={e=>setPeriodEnd(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"/></label><label className="text-sm">Payout Friday<input type="date" value={scheduledFor} onChange={e=>setScheduledFor(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"/></label></div><Button className="mt-4" disabled={!!busy} onClick={()=>act("create",{action:"create-batch",period_start:periodStart,period_end:periodEnd,scheduled_for:scheduledFor},"Friday payout batch prepared. Review and approve it before making any transfers.")}>Prepare payout batch</Button></section>
  <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Payout batches</h2><div className="mt-4 space-y-3">{!data?.batches.length?<p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No payout batches created yet.</p>:data.batches.map(batch=><article key={batch.id} className="rounded-xl border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{batch.period_start} to {batch.period_end} · Friday {batch.scheduled_for}</p><p className="mt-1 text-sm text-gray-500">{batch.payout_count} driver payout(s) · {money(batch.total_amount)} · {batch.batch_status.toUpperCase()}</p></div>{batch.batch_status==="draft"&&<Button size="sm" disabled={!!busy} onClick={()=>act(batch.id,{action:"approve-batch",batch_id:batch.id},"Payout batch approved. KFM may now make and record each external transfer.")}>Approve batch</Button>}</div></article>)}</div></section>
  <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Individual payouts</h2><p className="text-sm text-gray-500">Mark a payout as paid only after the Mobile Money transfer to the registered driver number has succeeded.</p><div className="mt-4 space-y-3">{!data?.payouts.length?<p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No driver payouts have been prepared.</p>:data.payouts.map(p=>{const b=balanceByDriver.get(p.driver_id);return <article key={p.id} className="rounded-xl border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{p.payout_account_name} · {money(p.amount)}</p><p className="mt-1 text-sm text-gray-600">Pay to: {p.payout_mobile_money_network} · {p.payout_mobile_money_number}</p><p className="text-xs text-gray-500">{p.payout_status.toUpperCase()}{p.payout_reference?` · ${p.payout_reference}`:""}{p.admin_note?` · ${p.admin_note}`:""}</p></div><div className="flex flex-wrap gap-2">{p.payout_status==="approved"&&<Button size="sm" disabled={!!busy} onClick={()=>{const ref=window.prompt("Enter the successful external transfer reference:");if(ref?.trim())void act(p.id,{action:"mark-paid",payout_id:p.id,reference:ref},"External payout recorded as paid.")}}>Record transfer paid</Button>}{["pending","approved"].includes(p.payout_status)&&<Button size="sm" variant="outline" disabled={!!busy} onClick={()=>{const note=window.prompt("Reason for placing this payout on hold:");if(note?.trim())void act(p.id,"POST",{action:"hold-payout",payout_id:p.id,note},"Payout placed on hold.")}}>Hold payout</Button>}</div></div></article>})}</div></section>
  <p className="text-xs text-gray-500">KFM internal wallet entries are accounting records, not bank transfers. Cash commission recorded as due is not cash received by KFM. All Friday Mobile Money payments remain under KFM Admin control and require a real transfer reference.</p>
 </div></main>
}
