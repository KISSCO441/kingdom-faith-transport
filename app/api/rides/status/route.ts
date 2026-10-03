import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingCode = searchParams
      .get("booking_code")
      ?.trim()
      .toUpperCase()

    if (!bookingCode) {
      return NextResponse.json(
        { error: "Booking number is required." },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are not configured.",
        },
        { status: 500 },
      )
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests` +
        `?booking_code=eq.${encodeURIComponent(bookingCode)}` +
        `&select=id,booking_code,customer_name,vehicle_type,` +
        `pickup_town,pickup_area,destination_town,destination_area,` +
        `ride_status,fare_estimate,driver_id,created_at`,
      {
        method: "GET",
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    )

    if (!response.ok) {
      const errorText = await response.text()

      console.error(
        "KFM ride status lookup failed:",
        errorText,
      )

      return NextResponse.json(
        { error: "Unable to look up the ride." },
        { status: 500 },
      )
    }

    const rides = await response.json()

    if (!rides.length) {
      return NextResponse.json(
        { error: "No ride was found for that booking number." },
        { status: 404 },
      )
    }

    const ride = rides[0]

    let driver = null

    if (ride.driver_id) {
      const driverResponse = await fetch(
        `${supabaseUrl}/rest/v1/drivers` +
          `?id=eq.${encodeURIComponent(ride.driver_id)}` +
           `&select=id,full_name,phone,vehicle_type,vehicle_name,vehicle_registration,vehicle_color,photo_url`,
        {
          method: "GET",
          headers: {
            apikey: supabaseServiceRoleKey,
            Authorization: `Bearer ${supabaseServiceRoleKey}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      )

      if (driverResponse.ok) {
        const drivers = await driverResponse.json()
        driver = drivers[0] || null
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
    })
  } catch (error) {
    console.error("KFM ride status API error:", error)

    return NextResponse.json(
      {
        error: "Something went wrong while checking the ride.",
      },
      { status: 500 },
    )
  }
}
