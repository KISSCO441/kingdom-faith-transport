import { NextRequest, NextResponse } from "next/server"
import { getMarketAccount } from "@/lib/market-account-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const { account, supabase } = await getMarketAccount(request)
  if (!account || !supabase) return NextResponse.json({ error: "Please sign in to your seller account." }, { status: 401 })
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: "Payment verification is not configured." }, { status: 503 })

  try {
    const body = await request.json()
    const reference = typeof body?.reference === "string" ? body.reference.trim() : ""
    if (!/^KFM-CLS-[A-F0-9]{24}$/.test(reference)) return NextResponse.json({ error: "Invalid classified payment reference." }, { status: 400 })

    const { data: payment, error: paymentError } = await supabase
      .from("classified_ad_payments")
      .select("id, advert_id, amount, currency, payment_status, classified_ads!inner(seller_account_id)")
      .eq("payment_reference", reference)
      .maybeSingle()
    if (paymentError || !payment) return NextResponse.json({ error: "Listing payment record not found." }, { status: 404 })
    const advertRelation = payment.classified_ads as unknown as { seller_account_id: string }
    if (advertRelation.seller_account_id !== account.id) return NextResponse.json({ error: "This payment does not belong to your account." }, { status: 403 })
    if (payment.payment_status === "paid") return NextResponse.json({ success: true, message: "Listing payment was already verified. Your advert is awaiting KFM review." })

    const response = await fetch("https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference), {
      headers: { Authorization: "Bearer " + secretKey, "Content-Type": "application/json" },
      cache: "no-store",
    })
    const result = await response.json()
    const transaction = result?.data
    const expectedPesewas = Math.round(Number(payment.amount) * 100)
    if (!response.ok || !result?.status || transaction?.status !== "success" ||
      transaction?.reference !== reference || transaction?.currency !== "GHS" ||
      Number(transaction?.amount) !== expectedPesewas) {
      return NextResponse.json({ error: "Paystack has not confirmed the exact listing fee. Your advert remains unpublished." }, { status: 409 })
    }

    const { error: updatePaymentError } = await supabase.from("classified_ad_payments")
      .update({ payment_status: "paid", provider_transaction_id: String(transaction.id), paid_at: transaction.paid_at || new Date().toISOString(), provider_payload: transaction, updated_at: new Date().toISOString() })
      .eq("id", payment.id).eq("payment_status", "pending")
    if (updatePaymentError) return NextResponse.json({ error: "Payment was verified but could not be recorded. Please contact KFM before retrying." }, { status: 503 })

    const { error: advertError } = await supabase.from("classified_ads")
      .update({ advert_status: "pending_review", updated_at: new Date().toISOString() })
      .eq("id", payment.advert_id).eq("seller_account_id", account.id).eq("advert_status", "pending_payment")
    if (advertError) return NextResponse.json({ error: "Payment is recorded. Your advert status needs administrator attention." }, { status: 503 })
    return NextResponse.json({ success: true, message: "Listing fee verified. Your advert is now waiting for KFM approval." })
  } catch {
    return NextResponse.json({ error: "Unable to verify this listing payment." }, { status: 400 })
  }
}
