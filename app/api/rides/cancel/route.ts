import { NextResponse } from "next/server";

function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  return digits;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingCode = String(body?.booking_code ?? "").trim().toUpperCase();
    const suppliedPhone = normalizePhone(body?.phone);

    if (!bookingCode || !suppliedPhone) {
      return NextResponse.json(
        { error: "Your booking number and booking phone number are required." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured." },
        { status: 500 },
      );
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    const rideUrl =
      `${supabaseUrl}/rest/v1/ride_requests?booking_code=eq.${encodeURIComponent(bookingCode)}&select=id,booking_code,customer_phone,ride_status&limit=1`;
    const lookup = await fetch(rideUrl, { headers, cache: "no-store" });

    if (!lookup.ok) {
      console.error("KFM ride cancellation lookup failed:", await lookup.text());
      return NextResponse.json({ error: "Unable to verify this ride." }, { status: 500 });
    }

    const rows = await lookup.json();
    const ride = Array.isArray(rows) ? rows[0] : null;

    if (!ride || normalizePhone(ride.customer_phone) !== suppliedPhone) {
      return NextResponse.json(
        { error: "We could not verify that booking. Check the booking number and phone number used when booking." },
        { status: 404 },
      );
    }

    if (ride.ride_status === "cancelled") {
      return NextResponse.json({ success: true, ride_status: "cancelled", message: "This ride is already cancelled." });
    }

    if (!["requested", "accepted"].includes(String(ride.ride_status || "").toLowerCase())) {
      return NextResponse.json(
        { error: "This ride can no longer be cancelled here. Please contact KFM support for assistance." },
        { status: 409 },
      );
    }

    // Conditional PATCH prevents cancellation if a driver changes the ride status
    // to arrived or in_progress between the lookup and the update.
    const updateUrl =
      `${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(ride.id)}&ride_status=in.(requested,accepted)&select=id,ride_status`;
    const update = await fetch(updateUrl, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ ride_status: "cancelled" }),
      cache: "no-store",
    });

    if (!update.ok) {
      console.error("KFM ride cancellation update failed:", await update.text());
      return NextResponse.json({ error: "Unable to cancel this ride right now. Please try again." }, { status: 500 });
    }

    const updatedRows = await update.json();

    if (!Array.isArray(updatedRows) || !updatedRows[0]) {
      return NextResponse.json(
        { error: "The ride status has changed and it can no longer be cancelled here. Please check the latest status." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      ride_status: updatedRows[0].ride_status,
      message: "Your ride has been cancelled.",
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("KFM ride cancellation API error:", error);
    return NextResponse.json({ error: "Something went wrong while cancelling the ride." }, { status: 500 });
  }
}
