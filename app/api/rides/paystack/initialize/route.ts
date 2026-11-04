import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { normalizeGhanaPhone } from "@/lib/ride-payment";

export const runtime = "nodejs";

type RidePaymentRecord = {
  id: string;
  booking_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  ride_status: string | null;
  payment_method: string | null;
  payment_status: string | null;
  fare_estimate: number | string | null;
  payment_reference: string | null;
  payment_authorization_url: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingCode =
      typeof body.booking_code === "string"
        ? body.booking_code.trim().toUpperCase()
        : "";
    const suppliedPhone = normalizeGhanaPhone(body.phone);

    if (!/^KFM-\\d{6}$/.test(bookingCode) || !/^0\\d{9}$/.test(suppliedPhone)) {
      return NextResponse.json(
        { error: "Enter a valid KFM booking number and Ghana phone number." },
        { status: 400 },
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!supabaseUrl || !serviceKey || !paystackSecret) {
      return NextResponse.json(
        { error: "Ride payment is not configured yet." },
        { status: 503 },
      );
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    const lookup = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests?booking_code=eq.${encodeURIComponent(bookingCode)}&select=id,booking_code,customer_name,customer_phone,customer_email,ride_status,payment_method,payment_status,fare_estimate,payment_reference,payment_authorization_url&limit=1`,
      { headers, cache: "no-store" },
    );

    if (!lookup.ok) {
      console.error("KFM ride payment lookup failed:", await lookup.text());
      return NextResponse.json(
        { error: "Unable to find this ride. Please try again." },
        { status: 502 },
      );
    }

    const rows = (await lookup.json()) as RidePaymentRecord[];
    const ride = rows[0];

    if (!ride || normalizeGhanaPhone(ride.customer_phone) !== suppliedPhone) {
      return NextResponse.json(
        { error: "We could not verify that booking. Check the booking number and phone number." },
        { status: 404 },
      );
    }

    if (String(ride.ride_status).toLowerCase() !== "completed") {
      return NextResponse.json(
        { error: "Payment becomes available after the driver completes the ride." },
        { status: 409 },
      );
    }

    if (String(ride.payment_method).toLowerCase() !== "paystack") {
      return NextResponse.json(
        { error: "This booking was set to Cash when it was made." },
        { status: 409 },
      );
    }

    if (String(ride.payment_status).toLowerCase() === "paid") {
      return NextResponse.json(
        { error: "This ride has already been paid." },
        { status: 409 },
      );
    }

    // Reuse an outstanding authorization link instead of creating duplicate
    // Paystack transactions when the customer taps the payment prompt twice.
    if (ride.payment_reference && ride.payment_authorization_url) {
      return NextResponse.json({
        success: true,
        authorization_url: ride.payment_authorization_url,
        reference: ride.payment_reference,
        reused: true,
      });
    }

    if (ride.payment_reference) {
      return NextResponse.json(
        { error: "A payment attempt already exists. Please contact KFM before trying again." },
        { status: 409 },
      );
    }

    const email =
      typeof ride.customer_email === "string"
        ? ride.customer_email.trim().toLowerCase()
        : "";
    const fare = Number(ride.fare_estimate);

    if (
      !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) ||
      !Number.isFinite(fare) ||
      fare <= 0
    ) {
      return NextResponse.json(
        { error: "A valid booking email and fare are required for Paystack payment." },
        { status: 400 },
      );
    }

    const reference = `KFM-RIDE-${bookingCode}-${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const callbackUrl = `${new URL(request.url).origin}/ride-status?booking_code=${encodeURIComponent(bookingCode)}&reference=${encodeURIComponent(reference)}`;

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(fare * 100),
          currency: "GHS",
          reference,
          callback_url: callbackUrl,
          metadata: {
            kfm_payment_type: "ride",
            kfm_ride_id: ride.id,
            kfm_ride_booking_code: ride.booking_code,
            customer_name: ride.customer_name,
            customer_phone: suppliedPhone,
          },
        }),
        cache: "no-store",
      },
    );

    const paystackData = await paystackResponse.json();

    if (
      !paystackResponse.ok ||
      paystackData?.status !== true ||
      typeof paystackData?.data?.authorization_url !== "string"
    ) {
      console.error("KFM ride Paystack initialization failed:", paystackData);
      return NextResponse.json(
        { error: paystackData?.message || "Unable to start Paystack payment." },
        { status: 502 },
      );
    }

    const save = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(ride.id)}&ride_status=eq.completed&payment_status=eq.unpaid&payment_method=eq.paystack&payment_reference=is.null`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          payment_reference: reference,
          payment_authorization_url: paystackData.data.authorization_url,
          payment_requested_at: new Date().toISOString(),
        }),
        cache: "no-store",
      },
    );

    const savedRows = save.ok ? await save.json() : [];

    if (!save.ok || !Array.isArray(savedRows) || savedRows.length !== 1) {
      console.error(
        "KFM ride payment link could not be saved:",
        save.ok ? "No matching unpaid ride row." : await save.text(),
      );
      return NextResponse.json(
        { error: "The payment link could not be safely attached to this booking. Please contact KFM." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference,
      reused: false,
    });
  } catch (error) {
    console.error("KFM ride Paystack initialization error:", error);
    return NextResponse.json(
      { error: "Unable to start the ride payment. Please try again." },
      { status: 500 },
    );
  }
}
