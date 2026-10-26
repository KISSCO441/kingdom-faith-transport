import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingCode = typeof body.booking_code === "string" ? body.booking_code.trim().toUpperCase() : "";
    if (!/^KFM-\d{6}$/.test(bookingCode)) return NextResponse.json({ error: "A valid KFM booking number is required." }, { status: 400 });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!supabaseUrl || !serviceKey || !paystackSecret) return NextResponse.json({ error: "Payment service is not configured." }, { status: 500 });

    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
    const rideResponse = await fetch(`${supabaseUrl}/rest/v1/ride_requests?booking_code=eq.${encodeURIComponent(bookingCode)}&select=id,booking_code,customer_name,customer_email,ride_status,payment_method,payment_status,fare_estimate&limit=1`, { headers, cache: "no-store" });
    if (!rideResponse.ok) {
      console.error("KFM ride payment lookup failed:", await rideResponse.text());
      return NextResponse.json({ error: "Unable to find this ride." }, { status: 500 });
    }
    const rides = await rideResponse.json();
    const ride = Array.isArray(rides) ? rides[0] : null;
    if (!ride) return NextResponse.json({ error: "No ride was found for that booking number." }, { status: 404 });
    if (String(ride.ride_status).toLowerCase() !== "completed") return NextResponse.json({ error: "Online payment is available after the ride is completed." }, { status: 409 });
    if (String(ride.payment_method).toLowerCase() !== "paystack") return NextResponse.json({ error: "This booking selected Cash to Driver." }, { status: 409 });
    if (String(ride.payment_status).toLowerCase() === "paid") return NextResponse.json({ error: "This ride is already marked as paid." }, { status: 409 });

    const email = typeof ride.customer_email === "string" ? ride.customer_email.trim().toLowerCase() : "";
    const fare = Number(ride.fare_estimate);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Number.isFinite(fare) || fare <= 0) {
      return NextResponse.json({ error: "A valid receipt email and fare are required for online payment." }, { status: 400 });
    }

    const reference = `KFM-RIDE-${bookingCode}-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const callbackUrl = `${new URL(request.url).origin}/ride-status?booking_code=${encodeURIComponent(bookingCode)}`;
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${paystackSecret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount: Math.round(fare * 100), currency: "GHS", reference, callback_url: callbackUrl,
        metadata: { kfm_ride_id: ride.id, kfm_ride_booking_code: ride.booking_code, customer_name: ride.customer_name } }),
      cache: "no-store",
    });
    const paystackData = await paystackResponse.json();
    if (!paystackResponse.ok || paystackData?.status !== true || !paystackData?.data?.authorization_url) {
      console.error("KFM ride Paystack initialization failed:", paystackData);
      return NextResponse.json({ error: paystackData?.message || "Unable to start Paystack payment." }, { status: 502 });
    }

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(ride.id)}&payment_status=eq.unpaid&payment_method=eq.paystack`, {
      method: "PATCH", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify({ payment_reference: reference }), cache: "no-store",
    });
    const updatedRows = updateResponse.ok ? await updateResponse.json() : [];
    if (!updateResponse.ok || !Array.isArray(updatedRows) || updatedRows.length === 0) {
      console.error("KFM ride payment reference save failed.");
      return NextResponse.json({ error: "Payment could not be linked to the booking. Please contact KFM before trying again." }, { status: 500 });
    }
    return NextResponse.json({ success: true, authorization_url: paystackData.data.authorization_url, reference });
  } catch (error) {
    console.error("KFM ride Paystack initialization error:", error);
    return NextResponse.json({ error: "Unable to start the ride payment." }, { status: 500 });
  }
}
