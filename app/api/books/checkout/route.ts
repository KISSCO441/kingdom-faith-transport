import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const body=await request.json();
  const bookId=typeof body.bookId==="string"?body.bookId:"";
  const customerName=typeof body.customerName==="string"?body.customerName.trim():"";
  const customerEmail=typeof body.customerEmail==="string"?body.customerEmail.trim().toLowerCase():"";
  if(!bookId||!customerName||customerName.length>160||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
   return NextResponse.json({error:"Enter your name and a valid email address."},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret=process.env.PAYSTACK_SECRET_KEY;
  if(!url||!key||!secret) return NextResponse.json({error:"Digital book checkout is not configured yet."},{status:503});
  const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:book,error}=await supabase.from("kfm_books").select("id,title,price,is_published").eq("id",bookId).eq("is_published",true).maybeSingle();
  if(error||!book) return NextResponse.json({error:"This book is not available for purchase."},{status:404});
  const amount=Math.round(Number(book.price)*100);
  if(!Number.isSafeInteger(amount)||amount<1) return NextResponse.json({error:"The book price is invalid."},{status:400});
  const reference=`KFM-BOOK-${randomUUID().replace(/-/g,"").slice(0,18).toUpperCase()}`;
  const {error:insertError}=await supabase.from("kfm_book_orders").insert({reference,book_id:book.id,customer_name:customerName,customer_email:customerEmail,amount:Number(book.price),currency:"GHS",payment_status:"PENDING"});
  if(insertError) throw insertError;
  const origin=new URL(request.url).origin;
  const paystack=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/json"},body:JSON.stringify({email:customerEmail,amount,currency:"GHS",reference,callback_url:`${origin}/payment/callback`,metadata:{kfm_type:"digital_book",book_id:book.id,book_title:book.title,customer_name:customerName}})});
  const result=await paystack.json();
  if(!paystack.ok||!result.status||!result.data?.authorization_url){
   await supabase.from("kfm_book_orders").update({payment_status:"FAILED"}).eq("reference",reference);
   return NextResponse.json({error:result.message||"Unable to start Paystack payment."},{status:502});
  }
  return NextResponse.json({paymentUrl:result.data.authorization_url,reference});
 }catch(error){console.error("KFM book checkout error:",error);return NextResponse.json({error:"Could not start book checkout. Please try again."},{status:500});}
}
