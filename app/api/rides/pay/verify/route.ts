import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!supabaseUrl || !serviceKey || !secretKey) {
      return NextResponse.json({ success: false, error: "Ride payment verification is not configured." }, { status: 500 })
    }

    const body = await request.json()
    const reference = typeof body.reference === "string" ? body.reference.trim() : ""
    if (!reference || !reference.startsWith("KFM-RIDE-")) {
      return NextResponse.json({ success: false, error: "A valid KFM ride payment reference is required." }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const { data: ride, error: rideError } = await supabase
      .from("ride_requests")
      .select("id, booking_code, fare_estimate, payment_status, payment_reference, payment_method, ride_status")
      .eq("payment_reference", reference)
      .maybeSingle()

    if (rideError || !ride) {
      return NextResponse.json({ success: false, error: "No KFM ride was found for this payment reference." }, { status: 404 })
    }

    if (ride.payment_status?.toLowerCase() === "paid") {
      return NextResponse.json({ success: true, message: "Your KFM ride payment is already confirmed.", booking_code: ride.booking_code })
    }

    if (ride.ride_status !== "completed" || ride.payment_method?.toLowerCase() !== "paystack") {
      return NextResponse.json({ success: false, error: "This ride is not eligible for online payment confirmation." }, { status: 409 })
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json" },
      cache: "no-store",
    })
    const result = await response.json()
    const transaction = result?.data
    if (!response.ok || result?.status !== true || transaction?.status !== "success" || transaction?.reference !== reference) {
      return NextResponse.json({ success: false, error: "Paystack has not confirmed a successful payment yet." }, { status: 400 })
    }

    const expectedPesewas = Math.round(Number(ride.fare_estimate) * 100)
    if (!Number.isFinite(expectedPesewas) || expectedPesewas <= 0 || transaction.amount !== expectedPesewas || transaction.currency !== "GHS") {
      console.error("KFM ride payment amount/currency mismatch:", ride.booking_code, transaction?.amount, transaction?.currency)
      return NextResponse.json({ success: false, error: "The payment amount or currency does not match this KFM ride. Please contact KFM." }, { status: 400 })
    }

    const fare = Number(ride.fare_estimate)
    const driverShare = Math.round(fare * 0.8 * 100) / 100
    const commission = Math.round((fare - driverShare) * 100) / 100
    const { data: updated, error: updateError } = await supabase
      .from("ride_requests")
      .update({
        payment_status: "paid",
        payment_reference: reference,
        payment_paid_at: transaction.paid_at || new Date().toISOString(),
        payment_channel: transaction.channel || null,
        driver_share_amount: driverShare,
        kfm_commission_amount: commission,
        driver_payout_status: "pending",
        kfm_commission_status: "recorded",
        payment_receipt_number: reference,
      })
      .eq("id", ride.id)
      .eq("payment_status", "unpaid")
      .select("booking_code, payment_status, driver_share_amount, kfm_commission_amount")
      .maybeSingle()

    if (updateError) {
      console.error("KFM ride payment recording failed:", updateError)
      return NextResponse.json({ success: false, error: "Paystack confirmed the payment, but KFM could not record it. Please contact KFM with your payment reference." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: updated ? "Your KFM ride payment has been confirmed." : "Payment confirmation is being reconciled. Please refresh your booking shortly.",
      booking_code: ride.booking_code,
      payment_status: updated?.payment_status || "processing",
      driver_share_amount: updated?.driver_share_amount ?? driverShare,
      kfm_commission_amount: updated?.kfm_commission_amount ?? commission,
      reference,
    })
  } catch (error) {
    console.error("KFM ride payment verification error:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred while verifying ride payment." }, { status: 500 })
  }
}
