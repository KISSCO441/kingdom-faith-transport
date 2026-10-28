import { NextResponse } from "next/server";

function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  // Treat Ghana local format (0XXXXXXXXX) and international format (+233XXXXXXXXX) alike.
  if (digits.startsWith("233") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  return digits;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingCode = searchParams.get("booking_code")?.trim().toUpperCase();
    const suppliedPhone = normalizePhone(searchParams.get("phone"));

    if (!bookingCode || !suppliedPhone) {
      return NextResponse.json(
        { error: "Your booking number and booking phone number are required." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    const rideResponse = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests?booking_code=eq.${encodeURIComponent(bookingCode)}&select=id,booking_code,customer_name,customer_phone,vehicle_type,pickup_town,pickup_area,destination_town,destination_area,ride_status,fare_estimate,driver_id,created_at&limit=1`,
      { headers, cache: "no-store" },
    );

    if (!rideResponse.ok) {
      console.error("KFM ride status lookup failed:", await rideResponse.text());
      return NextResponse.json({ error: "Unable to look up the ride." }, { status: 500 });
    }

    const rides = await rideResponse.json();
    const ride = Array.isArray(rides) ? rides[0] : null;

    if (!ride || normalizePhone(ride.customer_phone) !== suppliedPhone) {
      // Use the same response for an unknown booking and a mismatched phone number.
      return NextResponse.json(
        { error: "We could not verify that booking. Check the booking number and phone number used when booking." },
        { status: 404 },
      );
    }

    let driver = null;
    let location = null;

    if (ride.driver_id) {
      const driverResponse = await fetch(
        `${supabaseUrl}/rest/v1/drivers?id=eq.${encodeURIComponent(ride.driver_id)}&select=id,full_name,phone,vehicle_type,vehicle_name,vehicle_registration,vehicle_color,photo_url&limit=1`,
        { headers, cache: "no-store" },
      );

      if (driverResponse.ok) {
        const drivers = await driverResponse.json();
        driver = drivers?.[0] || null;
      }

      if (["accepted", "arrived", "in_progress"].includes(String(ride.ride_status || "").toLowerCase())) {
        const locationResponse = await fetch(
          `${supabaseUrl}/rest/v1/driver_locations?driver_id=eq.${encodeURIComponent(ride.driver_id)}&select=latitude,longitude,accuracy_m,updated_at&limit=1`,
          { headers, cache: "no-store" },
        );

        if (locationResponse.ok) {
          const locations = await locationResponse.json();
          const candidate = locations?.[0];
          if (candidate?.updated_at) {
            const ageMs = Date.now() - new Date(candidate.updated_at).getTime();
            if (Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= 120000) {
              location = candidate;
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      ride: {
        id: ride.id,
        booking_code: ride.booking_code,
        customer_name: ride.customer_name,
        vehicle_type: ride.vehicle_type,
        pickup_town: ride.pickup_town,
        pickup_area: ride.pickup_area,
        destination_town: ride.destination_town,
        destination_area: ride.destination_area,
        ride_status: ride.ride_status,
        fare_estimate: ride.fare_estimate,
        created_at: ride.created_at,
      },
      driver,
      location,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("KFM ride status API error:", error);
    return NextResponse.json({ error: "Something went wrong while checking the ride." }, { status: 500 });
  }
}
