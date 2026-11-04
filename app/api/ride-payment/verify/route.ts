import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ token: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    const reference = typeof body.reference === "string" ? body.reference.trim() : "";
    if (!/^[a-f0-9]{64}$/i.test(token) || !reference) {
      return NextResponse.json({ error: "A valid payment link and reference are required." }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!supabaseUrl || !serviceKey || !secretKey) {
      return NextResponse.json({ error: "Payment verification is not configured." }, { status: 503 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
    const requestResponse = await fetch(
      `${supabaseUrl}/rest/v1/ride_payment_requests?token_hash=eq.${tokenHash}&payment_reference=eq.${encodeURIComponent(reference)}&select=id,ride_id,booking_code,amount,status,expires_at`,
      { headers, cache: "no-store" },
    );
    if (!requestResponse.ok) return NextResponse.json({ error: "Unable to verify this payment request." }, { status: 500 });
    const rows = await requestResponse.json();
    const paymentRequest = Array.isArray(rows) ? rows[0] : null;
    if (!paymentRequest) return NextResponse.json({ error: "Payment reference does not match this secure link." }, { status: 403 });
    if (paymentRequest.status === "paid") return NextResponse.json({ success: true, paid: true, booking_code: paymentRequest.booking_code });
    if (paymentRequest.status !== "pending" || new Date(paymentRequest.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "This payment request has expired." }, { status: 410 });
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
    const verifyData = await verifyResponse.json().catch(() => null);
    const transaction = verifyData?.data;
    if (!verifyResponse.ok || !verifyData?.status || transaction?.status !== "success") {
      return NextResponse.json({ error: "Paystack has not confirmed a successful payment yet." }, { status: 402 });
    }

    const expectedAmount = Math.round(Number(paymentRequest.amount) * 100);
    if (
      transaction.currency !== "GHS" ||
      Number(transaction.amount) !== expectedAmount ||
      transaction.reference !== reference ||
      transaction.metadata?.payment_type !== "kfm_ride" ||
      transaction.metadata?.payment_request_id !== paymentRequest.id ||
      transaction.metadata?.ride_id !== paymentRequest.ride_id
    ) {
      return NextResponse.json({ error: "Payment details did not match this KFM ride. Please contact support." }, { status: 400 });
    }

    const settleResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/kfm_record_ride_payment`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        p_ride_id: paymentRequest.ride_id,
        p_payment_method: "paystack",
        p_payment_reference: reference,
      }),
      cache: "no-store",
    });
    const settlement = await settleResponse.json().catch(() => null);
    if (!settleResponse.ok || !settlement?.success) {
      console.error("KFM Paystack ride settlement failed:", settlement);
      return NextResponse.json({ error: settlement?.error || "Payment was verified but KFM could not record it. Please contact support with your reference." }, { status: 500 });
    }

    const markPaid = await fetch(
      `${supabaseUrl}/rest/v1/ride_payment_requests?id=eq.${paymentRequest.id}&status=eq.pending`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ status: "paid", paid_at: new Date().toISOString() }),
      },
    );
    if (!markPaid.ok) console.error("KFM payment request status update failed:", await markPaid.text());

    return NextResponse.json({
      success: true,
      paid: true,
      booking_code: paymentRequest.booking_code,
      fare_amount: settlement.fare_amount ?? Number(paymentRequest.amount),
      driver_share: settlement.driver_share ?? null,
      kfm_commission: settlement.kfm_commission ?? null,
    });
  } catch (error) {
    console.error("KFM ride payment verification error:", error);
    return NextResponse.json({ error: "An unexpected payment verification error occurred." }, { status: 500 });
  }
}
