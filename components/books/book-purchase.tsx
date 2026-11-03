"use client";

import { useState, type FormEvent } from "react";

export function BookPurchase({bookId}:{bookId:string}){
 const [name,setName]=useState(""); const [email,setEmail]=useState("");
 const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");
  try{
   const response=await fetch("/api/books/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bookId,customerName:name,customerEmail:email})});
   const result=await response.json();
   if(!response.ok||!result.paymentUrl)throw new Error(result.error||"Could not start payment.");
   window.location.href=result.paymentUrl;
  }catch(e){setError(e instanceof Error?e.message:"Could not start payment. Please try again.");setBusy(false);}
 }
 return <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border bg-card p-5"><h2 className="text-lg font-bold">Buy the digital book</h2><label className="block text-sm font-semibold">Your name<input required maxLength={160} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border bg-background px-3 font-normal"/></label><label className="block text-sm font-semibold">Email address<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border bg-background px-3 font-normal"/></label>{error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="min-h-12 w-full rounded-lg bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700 disabled:opacity-60">{busy?"Connecting to Paystack...":"Buy eBook securely with Paystack"}</button><p className="text-xs leading-5 text-muted-foreground">After payment is verified, we'll email your secure PDF download link.</p></form>;
}
