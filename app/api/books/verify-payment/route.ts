import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const {reference}=await request.json();
  if(typeof reference!=="string"||!reference.startsWith("KFM-BOOK-")) return NextResponse.json({error:"Invalid book payment reference."},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!url||!key||!secret) return NextResponse.json({error:"Payment verification is not configured."},{status:503});
  const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:order,error:orderError}=await supabase.from("kfm_book_orders").select("id,reference,book_id,customer_name,customer_email,amount,payment_status,download_token,email_sent_at").eq("reference",reference).maybeSingle();
  if(orderError||!order) return NextResponse.json({error:"Book order was not found."},{status:404});
  if(order.payment_status!=="PAID"){
   const verify=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`},cache:"no-store"});
   const data=await verify.json();
   const expected=Math.round(Number(order.amount)*100);
   if(!verify.ok||!data.status||data.data?.status!=="success"||data.data?.currency!=="GHS"||Number(data.data?.amount)!==expected)
    return NextResponse.json({error:"Paystack has not confirmed the full payment for this book."},{status:402});
   const {error:updateError}=await supabase.from("kfm_book_orders").update({payment_status:"PAID",paid_at:new Date().toISOString(),download_token:order.download_token||randomUUID(),download_expires_at:new Date(Date.now()+7*24*60*60*1000).toISOString()}).eq("id",order.id).neq("payment_status","PAID");
   if(updateError) throw updateError;
  }
  const {data:paidOrder,error:paidError}=await supabase.from("kfm_book_orders").select("download_token,download_expires_at,email_sent_at").eq("id",order.id).single();
  if(paidError||!paidOrder?.download_token) throw new Error("Paid order download token could not be prepared.");
  // Customer email links must use the public production domain, never a protected Preview hostname.
  const origin="https://www.kingdomfaithmarketplace.com";
  const downloadUrl=`${origin}/api/books/download?token=${encodeURIComponent(paidOrder.download_token)}`;
  let emailSent=Boolean(paidOrder.email_sent_at);
  if(!emailSent){
   const resendKey=process.env.RESEND_API_KEY;
   if(resendKey){
    const from=process.env.KFM_BOOKS_FROM_EMAIL||"KFM Books <kisseh@kingdomfaithmarketplace.com>";
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${resendKey}`,"Content-Type":"application/json"},body:JSON.stringify({from,to:[order.customer_email],subject:"Your KFM digital book is ready",html:`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033"><h2>Thank you for your purchase, ${escapeHtml(order.customer_name)}.</h2><p>Your payment has been confirmed. Your digital book is ready to download.</p><p><a href="${downloadUrl}" style="display:inline-block;background:#ea580c;color:#fff;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Download your eBook</a></p><p>This secure link expires in 7 days and allows up to 5 downloads. Keep this email for your records.</p><p>KFM Books &amp; Publications</p></div>`})});
    if(response.ok){await supabase.from("kfm_book_orders").update({email_sent_at:new Date().toISOString()}).eq("id",order.id).is("email_sent_at",null);emailSent=true;}
    else console.error("KFM book delivery email failed:",await response.text());
   }else console.error("RESEND_API_KEY is not configured; book email delivery is pending.");
  }
  return NextResponse.json({success:true,downloadUrl,emailSent,message:emailSent?"Payment confirmed. Your download link has been emailed.":"Payment confirmed. Your download is ready below; email delivery is awaiting configuration."});
 }catch(error){console.error("KFM book payment verification error:",error);return NextResponse.json({error:"We could not complete book delivery. Please contact KFM before paying again."},{status:500});}
}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]||char));}
