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

    console.log("KFM DRIVER ACTION RECEIVED:", {
      ride_id,
      driver_id,
      action,
    })

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

    console.log("KFM SUPABASE CONFIG:", {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
    })

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are not configured.",
        },
        { status: 500 },
      )
    }

    // ---------------------------------------------------------
    // 1. Verify that this ride belongs to this driver
    // ---------------------------------------------------------

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
        "KFM DRIVER RIDE LOOKUP FAILED:",
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

    console.log("KFM DRIVER RIDE LOOKUP RESULT:", rides)

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

    console.log("KFM CURRENT RIDE STATUS:", {
      booking_code: ride.booking_code,
      currentStatus,
      requestedAction: action,
      nextStatus,
    })

    // ---------------------------------------------------------
    // 2. Validate ride transition
    // ---------------------------------------------------------

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
      console.error(
        "KFM INVALID RIDE ACTION:",
        {
          action,
          currentStatus,
          booking_code: ride.booking_code,
        },
      )

      return NextResponse.json(
        {
          error:
            `This ride cannot be ${action}ed from its current status (${currentStatus || "unknown"}).`,
        },
        { status: 409 },
      )
    }

    // ---------------------------------------------------------
    // 3. Update ride status
    // ---------------------------------------------------------

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
        "KFM DRIVER RIDE STATUS UPDATE FAILED:",
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

    console.log("KFM RIDE STATUS UPDATED:", {
      booking_code: ride.booking_code,
      previous_status: currentStatus,
      new_status: nextStatus,
      updatedRide,
    })

    // ---------------------------------------------------------
    // 4. Update driver availability
    //
    // ACCEPT  -> BUSY
    // COMPLETE -> ONLINE
    // CANCEL  -> ONLINE
    // ---------------------------------------------------------

    if (
      action === "accept" ||
      action === "complete" ||
      action === "cancel"
    ) {
      const driverAvailability =
        action === "accept" ? "BUSY" : "ONLINE"

      console.log(
        "KFM DRIVER AVAILABILITY UPDATE START:",
        {
          driver_id,
          booking_code: ride.booking_code,
          action,
          requestedAvailability: driverAvailability,
        },
      )

      // First read the current driver record.
      const driverBeforeResponse = await fetch(
        `${supabaseUrl}/rest/v1/drivers` +
          `?id=eq.${encodeURIComponent(driver_id)}` +
          `&select=id,full_name,availability`,
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

      const driverBefore = await driverBeforeResponse.json()

      console.log(
        "KFM DRIVER BEFORE AVAILABILITY UPDATE:",
        driverBefore,
      )

      // Now attempt the actual availability update.
      const driverResponse = await fetch(
        `${supabaseUrl}/rest/v1/drivers` +
          `?id=eq.${encodeURIComponent(driver_id)}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseServiceRoleKey,
            Authorization: `Bearer ${supabaseServiceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            availability: driverAvailability,
          }),
        },
      )

      const driverResponseText =
        await driverResponse.text()

      console.log(
        "KFM DRIVER AVAILABILITY RAW RESPONSE:",
        {
          status: driverResponse.status,
          ok: driverResponse.ok,
          response: driverResponseText,
        },
      )

      let updatedDriver: any[] = []

      try {
        updatedDriver = driverResponseText
          ? JSON.parse(driverResponseText)
          : []
      } catch (parseError) {
        console.error(
          "KFM DRIVER AVAILABILITY RESPONSE JSON PARSE FAILED:",
          parseError,
        )
      }

      if (!driverResponse.ok) {
        console.error(
          "KFM DRIVER AVAILABILITY UPDATE FAILED:",
          {
            status: driverResponse.status,
            response: updatedDriver,
            rawResponse: driverResponseText,
          },
        )

        return NextResponse.json(
          {
            error:
              "Ride updated, but driver availability could not be updated.",
            details: updatedDriver,
          },
          { status: 500 },
        )
      }

      console.log(
        "KFM DRIVER AVAILABILITY UPDATE RESULT:",
        updatedDriver,
      )

      // -------------------------------------------------------
      // 5. Verify the value returned by Supabase
      // -------------------------------------------------------

      const savedAvailability =
        updatedDriver?.[0]?.availability

      console.log(
        "KFM DRIVER AVAILABILITY VERIFICATION:",
        {
          driver_id,
          expected: driverAvailability,
          saved: savedAvailability,
          updatedDriver,
        },
      )

      if (savedAvailability !== driverAvailability) {
        console.error(
          "KFM DRIVER AVAILABILITY MISMATCH:",
          {
            expected: driverAvailability,
            saved: savedAvailability,
            driver: updatedDriver,
          },
        )

        return NextResponse.json(
          {
            error:
              "Driver availability did not save with the expected value.",
            expected_availability: driverAvailability,
            saved_availability: savedAvailability,
            driver: updatedDriver,
          },
          { status: 500 },
        )
      }

      console.log(
        "KFM DRIVER AVAILABILITY UPDATE SUCCESS:",
        {
          driver_id,
          availability: savedAvailability,
        },
      )
    } else {
      console.log(
        "KFM DRIVER AVAILABILITY NOT CHANGED FOR THIS ACTION:",
        {
          action,
          driver_id,
        },
      )
    }

    // ---------------------------------------------------------
    // 6. Final response
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      booking_code: ride.booking_code,
      previous_status: currentStatus,
      ride_status: nextStatus,
      ride: updatedRide[0] || null,
    })
  } catch (error) {
    console.error(
      "KFM DRIVER RIDE ACTION ERROR:",
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
