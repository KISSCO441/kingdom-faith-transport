
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { ride_id, driver_id } = body

    if (!ride_id || !driver_id) {
      return NextResponse.json(
        { error: "Ride ID and driver ID are required." },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !serviceRoleKey || !publishableKey) {
      return NextResponse.json(
        { error: "Server authentication is not configured." },
        { status: 500 },
      )
    }

    // 1. Verify the authenticated Supabase user.
    const authHeader = request.headers.get("authorization")
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in again." },
        { status: 401 },
      )
    }

    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        method: "GET",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    )

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: "Your session is invalid or expired. Please sign in again." },
        { status: 401 },
      )
    }

    const authenticatedUser = await authResponse.json()

    if (
      !authenticatedUser?.id ||
      authenticatedUser.id !== driver_id
    ) {
      return NextResponse.json(
        { error: "You are not authorized to confirm this payment." },
        { status: 403 },
      )
    }

    const headers = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    }

    // 2. Confirm that this ride belongs to this driver.
    const rideResponse = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests` +
        `?id=eq.${encodeURIComponent(ride_id)}` +
        `&driver_id=eq.${encodeURIComponent(driver_id)}` +
        `&select=id,booking_code,driver_id,ride_status,payment_method,payment_status,fare_estimate`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    )

    if (!rideResponse.ok) {
      console.error(
        "KFM CASH CONFIRMATION RIDE LOOKUP FAILED:",
        await rideResponse.text(),
      )

      return NextResponse.json(
        { error: "Unable to verify this ride." },
        { status: 500 },
      )
    }

    const rides = await rideResponse.json()

    if (!Array.isArray(rides) || rides.length === 0) {
      return NextResponse.json(
        { error: "This ride is not assigned to this driver." },
        { status: 403 },
      )
    }

    const ride = rides[0]

    // 3. Only completed cash rides can be confirmed.
    if (String(ride.ride_status).toLowerCase() !== "completed") {
      return NextResponse.json(
        { error: "Only completed rides can have cash payments confirmed." },
        { status: 409 },
      )
    }

    if (String(ride.payment_method).toLowerCase() !== "cash") {
      return NextResponse.json(
        { error: "This booking is not a cash-payment ride." },
        { status: 409 },
      )
    }

    if (String(ride.payment_status).toLowerCase() !== "unpaid") {
      return NextResponse.json(
        { error: "This payment is not unpaid. No changes were made." },
        { status: 409 },
      )
    }

    // 4. Record payment and the agreed 80/20 split atomically in the database.
    const settleResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/kfm_record_ride_payment`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          p_ride_id: ride_id,
          p_payment_method: "cash",
          p_payment_reference: null,
        }),
        cache: "no-store",
      },
    );

    const settleResult = await settleResponse.json().catch(() => null);
    if (!settleResponse.ok || !settleResult?.success) {
      console.error("KFM CASH PAYMENT SETTLEMENT FAILED:", settleResult);
      return NextResponse.json(
        { error: settleResult?.error || "Unable to record the cash payment. Confirm the KFM ride-payment migration has been applied." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: settleResult.already_paid
        ? "This cash payment was already recorded."
        : "Cash payment confirmed and the 80/20 split recorded.",
      booking_code: ride.booking_code,
      payment_status: "paid",
      fare: settleResult.fare_amount ?? Number(ride.fare_estimate),
      driver_share: settleResult.driver_share ?? null,
      kfm_commission: settleResult.kfm_commission ?? null,
    });
  } catch (error) {
    console.error("KFM CASH PAYMENT CONFIRMATION ERROR:", error)

    return NextResponse.json(
      { error: "Something went wrong while confirming the cash payment." },
      { status: 500 },
    )
  }
}
