import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "")
  return digits.startsWith("233") && digits.length === 12 ? `0${digits.slice(3)}` : digits
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: false, error: "Ride payment service is not configured." }, { status: 500 })
    }

    const body = await request.json()
    const bookingCode = typeof body.booking_code === "string" ? body.booking_code.trim().toUpperCase() : ""
    const customerPhone = normalizePhone(body.customer_phone)
    if (!bookingCode || !customerPhone) {
      return NextResponse.json({ success: false, error: "Booking code and customer phone are required." }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const { data: ride, error: rideError } = await supabase
      .from("ride_requests")
      .select("id, booking_code, customer_phone, ride_status, payment_method, payment_status")
      .eq("booking_code", bookingCode)
      .maybeSingle()

    if (rideError || !ride || normalizePhone(ride.customer_phone) !== customerPhone) {
      return NextResponse.json({ success: false, error: "We could not find a booking matching those details." }, { status: 404 })
    }
    if (ride.ride_status !== "completed") {
      return NextResponse.json({ success: false, error: "Cash payment can be selected only after the ride is completed." }, { status: 409 })
    }
    if (ride.payment_status?.toLowerCase() === "paid") {
      return NextResponse.json({ success: true, already_paid: true, payment_status: "paid", message: "This ride has already been paid." })
    }
    if (ride.payment_status?.toLowerCase() === "cash_pending_driver") {
      return NextResponse.json({ success: true, payment_status: "cash_pending_driver", message: "Your cash choice is awaiting driver confirmation." })
    }
    if (ride.payment_status?.toLowerCase() === "cash_disputed") {
      return NextResponse.json({ success: false, error: "This cash payment has been flagged for KFM review. Please contact KFM." }, { status: 409 })
    }
    if (!["pending", "cash", ""].includes(String(ride.payment_method || "").toLowerCase())) {
      return NextResponse.json({ success: false, error: "Another payment method has already been selected for this ride." }, { status: 409 })
    }

    const { data: updated, error: updateError } = await supabase
      .from("ride_requests")
      .update({ payment_method: "cash", payment_status: "cash_pending_driver" })
      .eq("id", ride.id)
      .eq("ride_status", "completed")
      .eq("payment_status", "unpaid")
      .in("payment_method", ["pending", "cash"])
      .select("id")
      .maybeSingle()

    if (updateError) {
      console.error("KFM cash choice update failed:", updateError)
      return NextResponse.json({ success: false, error: "Unable to record your cash payment choice." }, { status: 500 })
    }
    if (!updated) {
      return NextResponse.json({ success: false, error: "The payment choice changed while this request was being processed. Refresh your ride status." }, { status: 409 })
    }

    return NextResponse.json({ success: true, payment_status: "cash_pending_driver", message: "Cash payment choice recorded. Awaiting driver confirmation." })
  } catch (error) {
    console.error("KFM cash selection error:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred while recording cash payment." }, { status: 500 })
  }
}
