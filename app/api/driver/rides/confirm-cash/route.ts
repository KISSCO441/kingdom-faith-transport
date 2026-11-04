import { NextResponse } from "next/server";
import { calculateRidePaymentSplit } from "@/lib/ride-payment";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rideId = typeof body.ride_id === "string" ? body.ride_id : "";
    const driverId = typeof body.driver_id === "string" ? body.driver_id : "";

    if (!rideId || !driverId) {
      return NextResponse.json(
        { error: "Ride ID and driver ID are required." },
        { status: 400 },
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !serviceKey || !publishableKey) {
      return NextResponse.json(
        { error: "KFM payment confirmation is not configured." },
        { status: 503 },
      );
    }

    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "Please sign in again to confirm this cash payment." },
        { status: 401 },
      );
    }

    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: "Your driver session is invalid or has expired." },
        { status: 401 },
      );
    }

    const authenticatedUser = await authResponse.json();

    if (!authenticatedUser?.id || authenticatedUser.id !== driverId) {
      return NextResponse.json(
        { error: "You are not authorized to confirm this payment." },
        { status: 403 },
      );
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    const lookup = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(rideId)}&driver_id=eq.${encodeURIComponent(driverId)}&select=id,booking_code,ride_status,payment_method,payment_status,fare_estimate,cash_confirmed_by&limit=1`,
      { headers, cache: "no-store" },
    );

    if (!lookup.ok) {
      console.error("KFM cash ride lookup failed:", await lookup.text());
      return NextResponse.json(
        { error: "Unable to verify the assigned ride." },
        { status: 502 },
      );
    }

    const rows = await lookup.json();
    const ride = rows?.[0];

    if (!ride) {
      return NextResponse.json(
        { error: "This ride is not assigned to your driver account." },
        { status: 404 },
      );
    }

    if (
      String(ride.ride_status).toLowerCase() !== "completed" ||
      String(ride.payment_method).toLowerCase() !== "cash"
    ) {
      return NextResponse.json(
        { error: "Only a completed ride booked for cash can be confirmed here." },
        { status: 409 },
      );
    }

    if (String(ride.payment_status).toLowerCase() === "paid") {
      return NextResponse.json({
        success: true,
        already_paid: true,
        booking_code: ride.booking_code,
        payment_status: "paid",
      });
    }

    const split = calculateRidePaymentSplit(Number(ride.fare_estimate));
    const confirmedAt = new Date().toISOString();
    const receiptNumber = `KFM-RCP-${String(ride.booking_code).replace(/^KFM-/i, "")}`;

    const update = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(rideId)}&driver_id=eq.${encodeURIComponent(driverId)}&ride_status=eq.completed&payment_method=eq.cash&payment_status=eq.unpaid`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          payment_status: "paid",
          payment_paid_at: confirmedAt,
          payment_channel: "cash",
          driver_share_amount: split.driverShareAmount,
          kfm_commission_amount: split.kfmCommissionAmount,
          driver_payout_status: "collected_by_driver",
          kfm_commission_status: "due_from_driver",
          cash_confirmed_by: driverId,
          cash_confirmed_at: confirmedAt,
          payment_receipt_number: receiptNumber,
        }),
        cache: "no-store",
      },
    );

    const updatedRows = update.ok ? await update.json() : [];

    if (!update.ok) {
      console.error("KFM cash payment update failed:", await update.text());
      return NextResponse.json(
        { error: "Unable to record the cash payment. Please contact KFM." },
        { status: 502 },
      );
    }

    if (!Array.isArray(updatedRows) || updatedRows.length !== 1) {
      return NextResponse.json(
        { error: "This payment was updated elsewhere. Refresh your ride history." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      booking_code: ride.booking_code,
      payment_status: "paid",
      payment_channel: "cash",
      payment_paid_at: confirmedAt,
      payment_receipt_number: receiptNumber,
      ...split,
      kfm_commission_status: "due_from_driver",
    });
  } catch (error) {
    console.error("KFM cash payment confirmation error:", error);
    return NextResponse.json(
      { error: "Something went wrong while confirming the cash payment." },
      { status: 500 },
    );
  }
}
