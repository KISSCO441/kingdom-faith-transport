import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const PAYSTACK_API_URL = "https://api.paystack.co"

function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "")
  return digits.startsWith("233") && digits.length === 12 ? `0${digits.slice(3)}` : digits
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!supabaseUrl || !serviceKey || !secretKey) {
      return NextResponse.json({ success: false, error: "Ride payment service is not configured." }, { status: 500 })
    }

    const body = await request.json()
    const bookingCode = typeof body.booking_code === "string" ? body.booking_code.trim().toUpperCase() : ""
    const customerPhone = normalizePhone(body.customer_phone)
    const suppliedEmail = typeof body.customer_email === "string" ? body.customer_email.trim().toLowerCase() : ""
    if (!bookingCode || !customerPhone) {
      return NextResponse.json({ success: false, error: "Booking code and customer phone are required." }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const { data: ride, error: rideError } = await supabase
      .from("ride_requests")
      .select("id, booking_code, customer_name, customer_phone, customer_email, ride_status, payment_method, payment_status, fare_estimate, payment_reference, payment_authorization_url")
      .eq("booking_code", bookingCode)
      .maybeSingle()

    if (rideError || !ride || normalizePhone(ride.customer_phone) !== customerPhone) {
      return NextResponse.json({ success: false, error: "We could not find a booking matching those details." }, { status: 404 })
    }
    if (ride.ride_status !== "completed") {
      return NextResponse.json({ success: false, error: "Payment choices are available after the ride is completed." }, { status: 409 })
    }
    if (ride.payment_status?.toLowerCase() === "paid") {
      return NextResponse.json({ success: true, already_paid: true, message: "This ride has already been paid." })
    }

    const currentMethod = String(ride.payment_method || "").toLowerCase()
    if (["cash", "cash_pending_driver", "cash_disputed"].includes(currentMethod)) {
      return NextResponse.json({ success: false, error: "Cash has already been selected for this ride. Please contact KFM if you need help changing the payment method." }, { status: 409 })
    }
    if (!["pending", "paystack", ""].includes(currentMethod)) {
      return NextResponse.json({ success: false, error: "This ride is not available for online payment." }, { status: 409 })
    }
    if (currentMethod === "paystack" && ride.payment_authorization_url && ride.payment_reference) {
      return NextResponse.json({ success: true, authorization_url: ride.payment_authorization_url, reference: ride.payment_reference, message: "Your KFM ride payment link is ready." })
    }

    const email = suppliedEmail || (typeof ride.customer_email === "string" ? ride.customer_email.trim().toLowerCase() : "")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address for your Paystack receipt." }, { status: 400 })
    }
    const amount = Number(ride.fare_estimate)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "The ride fare is not valid. Please contact KFM." }, { status: 400 })
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
        metadata: { type: "kfm_ride", booking_code: ride.booking_code, customer_name: ride.customer_name, customer_phone: ride.customer_phone, ride_id: ride.id },
      }),
      cache: "no-store",
    })
    const paystack = await paystackResponse.json()
    if (!paystackResponse.ok || paystack.status !== true || !paystack.data?.authorization_url) {
      console.error("KFM ride Paystack initialization failed:", paystack)
      return NextResponse.json({ success: false, error: paystack.message || "Unable to create the Paystack payment link." }, { status: 502 })
    }

    const { data: saved, error: saveError } = await supabase
      .from("ride_requests")
      .update({
        payment_method: "paystack",
        customer_email: email,
        payment_reference: paystack.data.reference,
        payment_authorization_url: paystack.data.authorization_url,
        payment_requested_at: new Date().toISOString(),
      })
      .eq("id", ride.id)
      .eq("payment_status", "unpaid")
      .in("payment_method", ["pending", "paystack"])
      .select("id")
      .maybeSingle()

    if (saveError || !saved) {
      console.error("KFM ride payment selection/save failed:", saveError)
      return NextResponse.json({ success: false, error: "Another payment choice may already have been recorded. Refresh your ride status before trying again." }, { status: 409 })
    }

    return NextResponse.json({ success: true, authorization_url: paystack.data.authorization_url, reference: paystack.data.reference, message: "Your KFM ride payment link is ready." })
  } catch (error) {
    console.error("KFM ride payment initialization error:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred while preparing ride payment." }, { status: 500 })
  }
}
