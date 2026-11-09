"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, XCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

type PaymentState = "verifying" | "success" | "failed"

export default function PaymentCallbackPage() {
  const [paymentState,setPaymentState]=useState<PaymentState>("verifying")
  const [message,setMessage]=useState("Please wait while we confirm your payment.")
  const [reference,setReference]=useState("")
  const [downloadUrl,setDownloadUrl]=useState("")

  useEffect(()=>{
    const verifyPayment=async()=>{
      try{
        const params=new URLSearchParams(window.location.search)
        const paymentReference=params.get("reference")
        if(!paymentReference){setPaymentState("failed");setMessage("No payment reference was found.");return}
        setReference(paymentReference)
        const isClassifiedPayment=paymentReference.startsWith("KFM-CLS-")
        const isBookPayment=paymentReference.startsWith("KFM-BOOK-")
        const isRidePayment=paymentReference.startsWith("KFM-RIDE-")
        const response=isRidePayment
          ? await fetch("/api/rides/pay/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference:paymentReference}),cache:"no-store"})
          : isClassifiedPayment
          ? await fetch("/api/classifieds/verify-payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference:paymentReference}),cache:"no-store"})
          : isBookPayment
          ? await fetch("/api/books/verify-payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference:paymentReference}),cache:"no-store"})
          : await fetch("/api/paystack/verify?reference="+encodeURIComponent(paymentReference),{method:"GET",cache:"no-store"})
        const data=await response.json()
        const verified=isRidePayment||isClassifiedPayment||isBookPayment?data?.success:data?.status
        if(!response.ok||!verified){setPaymentState("failed");setMessage(data?.error||data?.message||"We could not confirm your payment. Please contact KFM if money was deducted.");return}
        setPaymentState("success")
        if(isRidePayment)setMessage(data?.message||"Your KFM ride payment has been confirmed.")
        else if(isClassifiedPayment)setMessage("Your KFM advert listing fee is confirmed. Your advert is now waiting for KFM approval.")
        else if(isBookPayment){setMessage(data?.message||"Your digital book payment is confirmed.");if(typeof data?.downloadUrl==="string")setDownloadUrl(data.downloadUrl)}
        else setMessage("Your payment has been confirmed successfully.")

        const pendingOrder=sessionStorage.getItem("kfm_pending_order")
        if(pendingOrder){try{const order=JSON.parse(pendingOrder);sessionStorage.setItem("kfm_completed_order",JSON.stringify({...order,paymentStatus:"PAID",paymentReference,paymentChannel:data.data?.channel||"",paidAt:data.data?.paidAt||""}));sessionStorage.removeItem("kfm_pending_order")}catch(storageError){console.error("Unable to save completed order:",storageError)}}
      }catch(error){console.error("Payment verification error:",error);setPaymentState("failed");setMessage("We could not confirm the payment at this time. Please contact KFM before making another payment.")}
    }
    verifyPayment()
  },[])

  const isClassifiedPayment=reference.startsWith("KFM-CLS-")
  const isBookPayment=reference.startsWith("KFM-BOOK-")
  const isRidePayment=reference.startsWith("KFM-RIDE-")
  const continueToMarket=()=>{window.location.href=isRidePayment?"/":isClassifiedPayment?"/market/account/my-adverts":isBookPayment?"/books":"/#nsawam-market"}
  const contactKfm=()=>{const text=reference?"Hello KFM, I completed a payment and need help confirming my order. Paystack reference: "+reference:"Hello KFM, I completed a payment and need help confirming my order.";window.open("https://wa.me/233240555688?text="+encodeURIComponent(text),"_blank")}

  if(paymentState==="verifying")return <main className="flex min-h-screen items-center justify-center bg-background px-4"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div><h1 className="text-2xl font-bold">Confirming Your Payment</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p><p className="mt-6 text-xs text-muted-foreground">Please do not close this page.</p></div></main>

  if(paymentState==="success")return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-9 w-9 text-green-600"/></div><h1 className="text-2xl font-bold">Payment Successful</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>{reference&&<div className="mt-6 rounded-lg bg-muted p-4 text-left"><p className="text-xs font-medium text-muted-foreground">Payment Reference</p><p className="mt-1 break-all text-sm font-semibold">{reference}</p></div>}
    {isBookPayment?<div className="mt-6 rounded-lg border border-border p-4 text-left"><p className="text-sm font-semibold">Your digital book</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Your PDF is available below. We have also sent a secure download link to your email when email delivery is configured.</p>{downloadUrl&&<a href={downloadUrl} className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 font-bold text-white"><Download className="h-4 w-4"/>Download your eBook</a>}</div>:<div className="mt-6 rounded-lg border border-border p-4 text-left"><p className="text-sm font-semibold">What happens next?</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{isRidePayment?"Your ride payment has been received successfully. Thank you for choosing Kingdom Faith Transport! Keep your payment reference for your records.":isClassifiedPayment?"Your advert is now in KFM’s review queue. It will appear publicly only after approval.":"KFM can now prepare your market order for delivery. Keep your payment reference for your records."}</p></div>}
    <div className="mt-6 flex flex-col gap-3"><Button onClick={continueToMarket}>{isRidePayment?"Back to KFM":isClassifiedPayment?"View My Adverts":isBookPayment?"Back to Books":"Continue Shopping"}</Button><Button variant="outline" onClick={contactKfm}>Contact KFM on WhatsApp</Button></div>
  </div></main>

  return <main className="flex min-h-screen items-center justify-center bg-background px-4"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"><XCircle className="h-9 w-9 text-destructive"/></div><h1 className="text-2xl font-bold">Payment Not Confirmed</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>{reference&&<div className="mt-6 rounded-lg bg-muted p-4 text-left"><p className="text-xs font-medium text-muted-foreground">Payment Reference</p><p className="mt-1 break-all text-sm font-semibold">{reference}</p></div>}<div className="mt-6 flex flex-col gap-3"><Button onClick={continueToMarket}>Return to Market</Button><Button variant="outline" onClick={contactKfm}>Contact KFM on WhatsApp</Button></div></div></main>
}
