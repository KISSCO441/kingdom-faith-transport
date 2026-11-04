import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function getPaymentRequest(token: string) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase server configuration is missing.");
  const response = await fetch(
    `${supabaseUrl}/rest/v1/ride_payment_requests?token_hash=eq.${hashToken(token)}&select=id,ride_id,booking_code,amount,customer_email,payment_reference,status,expires_at`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Unable to retrieve payment request.");
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

type Context = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { token } = await context.params;
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json({ error: "This payment link is invalid." }, { status: 404 });
    }
    const payment = await getPaymentRequest(token);
    if (!payment) return NextResponse.json({ error: "This payment link could not be found." }, { status: 404 });
    if (payment.status === "paid") return NextResponse.json({ success: true, paid: true, booking_code: payment.booking_code, amount: Number(payment.amount), currency: "GHS" });
    if (payment.status !== "pending" || new Date(payment.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "This payment link has expired. Please contact KFM." }, { status: 410 });
    }
    return NextResponse.json({
      success: true,
      paid: false,
      booking_code: payment.booking_code,
      amount: Number(payment.amount),
      currency: "GHS",
    });
  } catch (error) {
    console.error("KFM ride payment lookup error:", error);
    return NextResponse.json({ error: "Unable to load this payment request." }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { token } = await context.params;
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json({ error: "This payment link is invalid." }, { status: 404 });
    }
    const payment = await getPaymentRequest(token);
    if (!payment) return NextResponse.json({ error: "This payment link could not be found." }, { status: 404 });
    if (payment.status === "paid") return NextResponse.json({ error: "This ride has already been paid." }, { status: 409 });
    if (payment.status !== "pending" || new Date(payment.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "This payment link has expired. Please contact KFM." }, { status: 410 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) return NextResponse.json({ error: "Online payment is not configured." }, { status: 503 });

    const reference = `KFM-RIDE-${randomUUID()}`;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const update = await fetch(
      `${supabaseUrl}/rest/v1/ride_payment_requests?id=eq.${payment.id}&status=eq.pending`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ payment_reference: reference }),
      },
    );
    const updated = await update.json().catch(() => []);
    if (!update.ok || !Array.isArray(updated) || updated.length === 0) {
      return NextResponse.json({ error: "Unable to prepare this payment. Please try again." }, { status: 409 });
    }

    const origin = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL\n      ? `https://${process.env.VERCEL_URL}`\n      : process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : new URL(request.url).origin);
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: payment.customer_email,
        amount: Math.round(Number(payment.amount) * 100),
        currency: "GHS",
        reference,
        callback_url: `${origin}/ride-payment/${token}?reference=${encodeURIComponent(reference)}`,
        metadata: {
          payment_type: "kfm_ride",
          payment_request_id: payment.id,
          ride_id: payment.ride_id,
          booking_code: payment.booking_code,
        },
      }),
      cache: "no-store",
    });
    const paystackData = await paystackResponse.json().catch(() => null);
    if (!paystackResponse.ok || !paystackData?.status || !paystackData?.data?.authorization_url) {
      await fetch(`${supabaseUrl}/rest/v1/ride_payment_requests?id=eq.${payment.id}&payment_reference=eq.${encodeURIComponent(reference)}`, {
        method: "PATCH",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ payment_reference: null }),
      });
      console.error("KFM ride Paystack initialization failed:", paystackData?.message);
      return NextResponse.json({ error: paystackData?.message || "Paystack could not start this payment." }, { status: 502 });
    }

    return NextResponse.json({ success: true, authorization_url: paystackData.data.authorization_url, reference });
  } catch (error) {
    console.error("KFM ride Paystack initialization error:", error);
    return NextResponse.json({ error: "Unable to start this payment." }, { status: 500 });
  }
}
