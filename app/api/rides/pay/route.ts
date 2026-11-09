import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const PAYSTACK_API_URL = "https://api.paystack.co"

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!supabaseUrl || !serviceKey || !secretKey) {
      return NextResponse.json({ success: false, error: "Ride payment service is not configured." }, { status: 500 })
    }

    const body = await request.json()
    const bookingCode = typeof body.booking_code === "string" ? body.booking_code.trim() : ""
    const customerPhone = typeof body.customer_phone === "string" ? body.customer_phone.trim() : ""

    if (!bookingCode || !customerPhone) {
      return NextResponse.json({ success: false, error: "Booking code and customer phone are required." }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const { data: ride, error: rideError } = await supabase
      .from("ride_requests")
      .select("id, booking_code, customer_name, customer_phone, customer_email, ride_status, payment_method, payment_status, fare_estimate, payment_reference, payment_authorization_url")
      .eq("booking_code", bookingCode)
      .eq("customer_phone", customerPhone)
      .maybeSingle()

    if (rideError || !ride) {
      return NextResponse.json({ success: false, error: "We could not find a booking matching those details." }, { status: 404 })
    }

    if (ride.ride_status !== "completed" || ride.payment_method?.toLowerCase() !== "paystack") {
      return NextResponse.json({ success: false, error: "Online payment is available only for completed rides booked with Pay Online." }, { status: 409 })
    }

    if (ride.payment_status?.toLowerCase() === "paid") {
      return NextResponse.json({ success: true, already_paid: true, message: "This ride has already been paid." })
    }

    if (ride.payment_authorization_url && ride.payment_reference) {
      return NextResponse.json({
        success: true,
        authorization_url: ride.payment_authorization_url,
        reference: ride.payment_reference,
        message: "Your KFM ride payment link is ready.",
      })
    }

    const amount = Number(ride.fare_estimate)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "The ride fare is not valid. Please contact KFM." }, { status: 400 })
    }

    const email = typeof ride.customer_email === "string" ? ride.customer_email.trim().toLowerCase() : ""
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "A valid customer email is required for Paystack. Please contact KFM." }, { status: 400 })
    }

    const reference = `KFM-RIDE-${bookingCode}-${Date.now()}`
    const paystackResponse = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: String(Math.round(amount * 100)),
        currency: "GHS",
        reference,
        callback_url: `${new URL(request.url).origin}/payment/callback`,
        channels: ["card", "mobile_money"],
        metadata: {
          type: "kfm_ride",
          booking_code: ride.booking_code,
          customer_name: ride.customer_name,
          customer_phone: ride.customer_phone,
          ride_id: ride.id,
        },
      }),
      cache: "no-store",
    })

    const paystack = await paystackResponse.json()
    if (!paystackResponse.ok || paystack.status !== true || !paystack.data?.authorization_url) {
      console.error("KFM ride Paystack initialization failed:", paystack)
      return NextResponse.json({ success: false, error: paystack.message || "Unable to create the Paystack payment link." }, { status: 502 })
    }

    const { error: saveError } = await supabase
      .from("ride_requests")
      .update({
        payment_reference: paystack.data.reference,
        payment_authorization_url: paystack.data.authorization_url,
        payment_requested_at: new Date().toISOString(),
      })
      .eq("id", ride.id)
      .eq("payment_status", "unpaid")

    if (saveError) {
      console.error("KFM ride payment details save failed:", saveError)
      return NextResponse.json({ success: false, error: "Paystack created a payment link, but KFM could not save it. Please contact KFM before paying." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystack.data.authorization_url,
      reference: paystack.data.reference,
      message: "Your KFM ride payment link is ready.",
    })
  } catch (error) {
    console.error("KFM ride payment initialization error:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred while preparing ride payment." }, { status: 500 })
  }
}
