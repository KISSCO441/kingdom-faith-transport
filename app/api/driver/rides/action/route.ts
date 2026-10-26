
import { NextResponse } from "next/server"
import { sendRidePaymentReceiptEmail } from "@/lib/ride-receipt-email"

const allowedTransitions: Record<string, string> = {
  accept: "accepted",
  arrive: "arrived",
  start: "in_progress",
  complete: "completed",
  cancel: "cancelled",
}

const activeStatuses =
  "requested,accepted,arrived,in_progress"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ride_id, driver_id, action } = body

    if (!ride_id || !driver_id || !action) {
      return NextResponse.json(
        { error: "Ride ID, driver ID, and action are required." },
        { status: 400 },
      )
    }

    const isReject = action === "reject"
    const nextStatus = allowedTransitions[action]

    if (!nextStatus && !isReject) {
      return NextResponse.json(
        { error: "Invalid ride action." },
        { status: 400 },
      )
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !serviceKey || !publishableKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured." },
        { status: 500 },
      )
    }

    // Verify the driver's authenticated session.
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

    if (!authenticatedUser?.id || authenticatedUser.id !== driver_id) {
      return NextResponse.json(
        { error: "You are not authorized to update this driver's ride." },
        { status: 403 },
      )
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    }

    // Confirm that this ride is currently assigned to this driver.
    const rideResponse = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests` +
        `?id=eq.${encodeURIComponent(ride_id)}` +
        `&driver_id=eq.${encodeURIComponent(driver_id)}` +
        `&select=id,booking_code,driver_id,ride_status,payment_method,payment_status,fare_estimate,customer_email,customer_name,pickup_town,pickup_area,destination_town,destination_area,payment_reference,payment_paid_at`,
      {
        headers,
        cache: "no-store",
      },
    )

    if (!rideResponse.ok) {
      console.error("KFM RIDE LOOKUP FAILED:", await rideResponse.text())
      return NextResponse.json(
        { error: "Unable to verify the assigned ride." },
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
    const currentStatus = String(ride.ride_status || "").toLowerCase()

    const validAction =
      (action === "accept" && currentStatus === "requested") ||
      (action === "reject" && currentStatus === "requested") ||
      (action === "arrive" && currentStatus === "accepted") ||
      (action === "start" && currentStatus === "arrived") ||
      (action === "complete" && currentStatus === "in_progress") ||
      (action === "cancel" &&
        ["requested", "accepted", "arrived"].includes(currentStatus))

    if (!validAction) {
      return NextResponse.json(
        {
          error: `This ride cannot be ${action}ed from its current status (${currentStatus || "unknown"}).`,
        },
        { status: 409 },
      )
    }

    let updatedRide: any = null
    let rejectionResult: any = null

    // Use database functions for the race-sensitive decisions.
    if (action === "accept" || isReject) {
      const functionName = isReject
        ? "kfm_reject_ride"
        : "kfm_accept_ride"

      const rpcResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/${functionName}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            p_ride_id: ride_id,
            p_driver_id: driver_id,
          }),
          cache: "no-store",
        },
      )

      const rpcText = await rpcResponse.text()
      let rpcResult: any

      try {
        rpcResult = rpcText ? JSON.parse(rpcText) : null
      } catch {
        console.error("KFM RIDE RPC INVALID RESPONSE:", rpcText)
        return NextResponse.json(
          { error: "The ride operation returned an invalid response." },
          { status: 500 },
        )
      }

      if (!rpcResponse.ok) {
        console.error("KFM RIDE RPC FAILED:", rpcResult)
        return NextResponse.json(
          { error: "Unable to process this ride action." },
          { status: 500 },
        )
      }

      if (!rpcResult?.success) {
        return NextResponse.json(
          { error: rpcResult?.error || "This ride is no longer available." },
          { status: 409 },
        )
      }

      if (isReject) {
        rejectionResult = rpcResult
        updatedRide = rpcResult.ride
      } else {
        updatedRide = rpcResult.ride
      }
    } else {
      // Preserve the existing status transitions for other actions.
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/ride_requests` +
          `?id=eq.${encodeURIComponent(ride_id)}` +
          `&driver_id=eq.${encodeURIComponent(driver_id)}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            ride_status: nextStatus,
            ...(action === "complete" && String(ride.payment_method || "").toLowerCase() === "cash" && String(ride.payment_status || "").toLowerCase() !== "paid"
              ? { payment_status: "paid", payment_paid_at: new Date().toISOString() } : {}),
          }),
        },
      )

      const updateText = await updateResponse.text()

      if (!updateResponse.ok) {
        console.error("KFM RIDE UPDATE FAILED:", updateText)
        return NextResponse.json(
          { error: "Unable to update the ride status." },
          { status: 500 },
        )
      }

      let updatedRows: any

      try {
        updatedRows = updateText ? JSON.parse(updateText) : []
      } catch {
        return NextResponse.json(
          { error: "The updated ride response was invalid." },
          { status: 500 },
        )
      }

      updatedRide = Array.isArray(updatedRows)
        ? updatedRows[0]
        : null

      if (!updatedRide) {
        return NextResponse.json(
          { error: "The ride update could not be confirmed." },
          { status: 500 },
        )
      }
    }

    // Refresh the original driver's availability after actions
    // that can change which active rides belong to that driver.
    if (
      action === "accept" ||
      action === "complete" ||
      action === "cancel" ||
      isReject
    ) {
      const activeResponse = await fetch(
        `${supabaseUrl}/rest/v1/ride_requests` +
          `?driver_id=eq.${encodeURIComponent(driver_id)}` +
          `&ride_status=in.(${activeStatuses})` +
          `&select=id&limit=1`,
        {
          headers,
          cache: "no-store",
        },
      )

      if (!activeResponse.ok) {
        console.error(
          "KFM ACTIVE RIDE CHECK FAILED:",
          await activeResponse.text(),
        )
        return NextResponse.json(
          {
            error:
              "Ride action was processed, but driver availability could not be checked.",
          },
          { status: 500 },
        )
      }

      const activeRides = await activeResponse.json()
      const availability =
        activeRides.length > 0 ? "BUSY" : "ONLINE"

      const driverUpdateResponse = await fetch(
        `${supabaseUrl}/rest/v1/drivers?id=eq.${encodeURIComponent(driver_id)}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation",
          },
          body: JSON.stringify({ availability }),
        },
      )

      const driverText = await driverUpdateResponse.text()
      let updatedDrivers: any[] = []

      try {
        updatedDrivers = driverText ? JSON.parse(driverText) : []
      } catch {
        console.error("KFM DRIVER UPDATE INVALID RESPONSE:", driverText)
      }

      if (!driverUpdateResponse.ok) {
        console.error("KFM DRIVER AVAILABILITY UPDATE FAILED:", driverText)
        return NextResponse.json(
          { error: "Ride action was processed, but driver availability could not be updated." },
          { status: 500 },
        )
      }

      if (updatedDrivers?.[0]?.availability !== availability) {
        return NextResponse.json(
          {
            error: "Driver availability could not be verified.",
            expected_availability: availability,
            saved_availability: updatedDrivers?.[0]?.availability ?? null,
          },
          { status: 500 },
        )
      }
    }

    if (action === "complete" && String(ride.payment_method || "").toLowerCase() === "cash" && String(updatedRide?.payment_status || "").toLowerCase() === "paid") {
      await sendRidePaymentReceiptEmail({ ...ride, ...updatedRide, booking_code: ride.booking_code, payment_method: "cash" });
    }

    console.log("KFM DRIVER ACTION COMPLETED:", {
      booking_code: ride.booking_code,
      action,
      previous_status: currentStatus,
      ride_status: updatedRide?.ride_status,
      reassigned: rejectionResult?.reassigned,
      new_driver_id: rejectionResult?.driver_id,
    })

    return NextResponse.json({
      success: true,
      booking_code: ride.booking_code,
      previous_status: currentStatus,
      ride_status: updatedRide?.ride_status ?? nextStatus,
      ride: updatedRide,
      ...(isReject
        ? {
            reassigned: rejectionResult?.reassigned ?? false,
            driver_id: rejectionResult?.driver_id ?? null,
            message: rejectionResult?.message,
          }
        : {}),
    })
  } catch (error) {
    console.error("KFM DRIVER RIDE ACTION ERROR:", error)
    return NextResponse.json(
      { error: "Something went wrong while updating the ride." },
      { status: 500 },
    )
  }
}
