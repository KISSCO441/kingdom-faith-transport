import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rideId = typeof body.ride_id === "string" ? body.ride_id : ""
    const driverId = typeof body.driver_id === "string" ? body.driver_id : ""
    const action = body.action === "dispute" ? "dispute" : "confirm"
    if (!rideId || !driverId) {
      return NextResponse.json({ error: "Ride ID and driver ID are required." }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!supabaseUrl || !serviceKey || !publishableKey) {
      return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 })
    }

    const authHeader = request.headers.get("authorization")
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required. Please sign in again." }, { status: 401 })
    }

    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (!authResponse.ok) {
      return NextResponse.json({ error: "Your session is invalid or expired. Please sign in again." }, { status: 401 })
    }
    const authenticatedUser = await authResponse.json()

    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" }
    const driverResponse = await fetch(
      `${supabaseUrl}/rest/v1/drivers?id=eq.${encodeURIComponent(driverId)}&select=id,user_id&limit=1`,
      { headers, cache: "no-store" },
    )
    if (!driverResponse.ok) {
      console.error("KFM cash driver lookup failed:", await driverResponse.text())
      return NextResponse.json({ error: "Unable to verify your driver profile." }, { status: 500 })
    }
    const drivers = await driverResponse.json()
    const driver = Array.isArray(drivers) ? drivers[0] : null
    if (!authenticatedUser?.id || !driver || driver.user_id !== authenticatedUser.id) {
      return NextResponse.json({ error: "You are not authorized to confirm this driver's cash payment." }, { status: 403 })
    }

    const rideResponse = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(rideId)}&driver_id=eq.${encodeURIComponent(driverId)}&select=id,booking_code,fare_estimate,ride_status,payment_method,payment_status&limit=1`,
      { headers, cache: "no-store" },
    )
    if (!rideResponse.ok) {
      console.error("KFM cash ride lookup failed:", await rideResponse.text())
      return NextResponse.json({ error: "Unable to verify the assigned ride." }, { status: 500 })
    }
    const rides = await rideResponse.json()
    const ride = Array.isArray(rides) ? rides[0] : null
    if (!ride) {
      return NextResponse.json({ error: "This ride is not assigned to your driver account." }, { status: 403 })
    }
    if (ride.ride_status !== "completed" || ride.payment_method?.toLowerCase() !== "cash" || ride.payment_status?.toLowerCase() !== "cash_pending_driver") {
      return NextResponse.json({ error: "This ride is not awaiting cash confirmation." }, { status: 409 })
    }

    const fare = Number(ride.fare_estimate)
    if (action === "confirm" && (!Number.isFinite(fare) || fare <= 0)) {
      return NextResponse.json({ error: "The fare is not valid. Please contact KFM." }, { status: 400 })
    }
    const now = new Date().toISOString()
    const update = action === "confirm"
      ? {
          payment_status: "paid",
          payment_paid_at: now,
          payment_channel: "cash",
          driver_share_amount: Math.round(fare * 0.8 * 100) / 100,
          kfm_commission_amount: Math.round((fare - fare * 0.8) * 100) / 100,
          driver_payout_status: "pending",
          kfm_commission_status: "recorded",
          payment_receipt_number: `CASH-${ride.booking_code}`,
        }
      : { payment_status: "cash_disputed" }

    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(rideId)}&driver_id=eq.${encodeURIComponent(driverId)}&ride_status=eq.completed&payment_method=eq.cash&payment_status=eq.cash_pending_driver`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(update),
        cache: "no-store",
      },
    )
    const updateText = await updateResponse.text()
    if (!updateResponse.ok) {
      console.error("KFM cash payment update failed:", updateText)
      return NextResponse.json({ error: "Unable to update the cash payment record." }, { status: 500 })
    }
    const updatedRows = updateText ? JSON.parse(updateText) : []
    if (!Array.isArray(updatedRows) || !updatedRows[0]) {
      return NextResponse.json({ error: "This cash payment has already been processed. Refresh your dashboard." }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      payment_status: updatedRows[0].payment_status,
      message: action === "confirm" ? "Cash receipt confirmed and recorded." : "Cash payment flagged for KFM review.",
    })
  } catch (error) {
    console.error("KFM driver cash confirmation error:", error)
    return NextResponse.json({ error: "Something went wrong while updating the cash payment." }, { status: 500 })
  }
}
