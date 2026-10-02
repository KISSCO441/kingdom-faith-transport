import { NextResponse } from "next/server"

const allowedTransitions: Record<string, string> = {
  accept: "accepted",
  arrive: "arrived",
  start: "in_progress",
  complete: "completed",
  cancel: "cancelled",
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      ride_id,
      driver_id,
      action,
    } = body

    if (!ride_id || !driver_id || !action) {
      return NextResponse.json(
        {
          error: "Ride ID, driver ID, and action are required.",
        },
        { status: 400 },
      )
    }

    const nextStatus = allowedTransitions[action]

    if (!nextStatus) {
      return NextResponse.json(
        {
          error: "Invalid ride action.",
        },
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

    const rideResponse = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests` +
        `?id=eq.${encodeURIComponent(ride_id)}` +
        `&driver_id=eq.${encodeURIComponent(driver_id)}` +
        `&select=id,booking_code,driver_id,ride_status`,
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

    if (!rideResponse.ok) {
      const errorText = await rideResponse.text()

      console.error(
        "KFM driver ride lookup failed:",
        errorText,
      )

      return NextResponse.json(
        {
          error: "Unable to verify the assigned ride.",
        },
        { status: 500 },
      )
    }

    const rides = await rideResponse.json()

    if (!rides.length) {
      return NextResponse.json(
        {
          error:
            "This ride is not assigned to this driver.",
        },
        { status: 403 },
      )
    }

    const ride = rides[0]

    const currentStatus = String(
      ride.ride_status || "",
    ).toLowerCase()

    const validAction =
      (action === "accept" && currentStatus === "requested") ||
      (action === "arrive" && currentStatus === "accepted") ||
      (action === "start" && currentStatus === "arrived") ||
      (action === "complete" && currentStatus === "in_progress") ||
      (action === "cancel" &&
        ["requested", "accepted", "arrived"].includes(
          currentStatus,
        ))

    if (!validAction) {
      return NextResponse.json(
        {
          error:
            `This ride cannot be ${action}ed from its current status (${currentStatus || "unknown"}).`,
        },
        { status: 409 },
      )
    }

    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests` +
        `?id=eq.${encodeURIComponent(ride_id)}` +
        `&driver_id=eq.${encodeURIComponent(driver_id)}`,
      {
        method: "PATCH",
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          ride_status: nextStatus,
        }),
      },
    )

    const updatedRide = await updateResponse.json()

    if (!updateResponse.ok) {
      console.error(
        "KFM driver ride status update failed:",
        updatedRide,
      )

      return NextResponse.json(
        {
          error: "Unable to update the ride status.",
          details: updatedRide,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      booking_code: ride.booking_code,
      previous_status: currentStatus,
      ride_status: nextStatus,
      ride: updatedRide[0] || null,
    })
  } catch (error) {
    console.error(
      "KFM driver ride action error:",
      error,
    )

    return NextResponse.json(
      {
        error:
          "Something went wrong while updating the ride.",
      },
      { status: 500 },
    )
  }
}
