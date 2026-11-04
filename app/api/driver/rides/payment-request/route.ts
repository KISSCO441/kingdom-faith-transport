import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { ride_id, driver_id } = await request.json();
    if (!ride_id || !driver_id) {
      return NextResponse.json({ error: "Ride and driver details are required." }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !serviceKey || !publishableKey) {
      return NextResponse.json({ error: "Server configuration is incomplete." }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!accessToken) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!authResponse.ok) return NextResponse.json({ error: "Your session is invalid or expired." }, { status: 401 });
    const user = await authResponse.json();
    if (user?.id !== driver_id) return NextResponse.json({ error: "You are not authorized to request payment for this ride." }, { status: 403 });

    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
    const rideResponse = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(ride_id)}&driver_id=eq.${encodeURIComponent(driver_id)}&select=id,booking_code,ride_status,payment_method,payment_status,fare_estimate,customer_email`,
      { headers, cache: "no-store" },
    );
    if (!rideResponse.ok) return NextResponse.json({ error: "Unable to check this ride." }, { status: 500 });
    const rides = await rideResponse.json();
    const ride = Array.isArray(rides) ? rides[0] : null;
    if (!ride) return NextResponse.json({ error: "This ride is not assigned to your account." }, { status: 403 });
    if (String(ride.ride_status).toLowerCase() !== "completed" ||
        String(ride.payment_method).toLowerCase() !== "paystack" ||
        String(ride.payment_status).toLowerCase() !== "unpaid") {
      return NextResponse.json({ error: "A payment link can only be created for an unpaid, completed Paystack ride." }, { status: 409 });
    }
    const amount = Number(ride.fare_estimate);
    const email = String(ride.customer_email || "").trim().toLowerCase();
    if (!Number.isFinite(amount) || amount <= 0 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      return NextResponse.json({ error: "The ride fare or customer email is missing. KFM admin must review this booking." }, { status: 409 });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const saveResponse = await fetch(
      `${supabaseUrl}/rest/v1/ride_payment_requests?on_conflict=ride_id`,
      {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({
          ride_id: ride.id,
          booking_code: ride.booking_code,
          token_hash: tokenHash,
          amount: Number(amount.toFixed(2)),
          customer_email: email,
          payment_reference: null,
          status: "pending",
          expires_at: expiresAt,
          paid_at: null,
        }),
      },
    );
    if (!saveResponse.ok) {
      console.error("KFM ride payment request save failed:", await saveResponse.text());
      return NextResponse.json({ error: "Unable to create the payment link. Confirm the KFM ride-payment database migration has been applied." }, { status: 500 });
    }

    const origin = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL\n      ? `https://${process.env.VERCEL_URL}`\n      : process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : new URL(request.url).origin);
    return NextResponse.json({
      success: true,
      booking_code: ride.booking_code,
      payment_url: `${origin}/ride-payment/${token}`,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error("KFM ride payment request error:", error);
    return NextResponse.json({ error: "Unable to create the ride payment request." }, { status: 500 });
  }
}
