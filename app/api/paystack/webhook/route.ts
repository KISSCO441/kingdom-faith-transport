import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"
import { sendRidePaymentReceiptEmail } from "@/lib/ride-receipt-email"

export const runtime = "nodejs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey || !paystackSecretKey) {
  throw new Error("Missing required environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) {
      return NextResponse.json(
        { error: "Missing or invalid Paystack signature." },
        { status: 401 },
      )
    }

    const expectedSignature = crypto
      .createHmac("sha512", paystackSecretKey!)
      .update(body)
      .digest()

    const receivedSignature = Buffer.from(signature, "hex")

    if (
      expectedSignature.length !== receivedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return NextResponse.json(
        { error: "Invalid Paystack signature." },
        { status: 401 },
      )
    }

    let event: {
      event?: string
      data?: { reference?: string }
    }

    try {
      event = JSON.parse(body)
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook JSON." },
        { status: 400 },
      )
    }

    console.log("KFM Paystack webhook event:", event.event)

    // Acknowledge events that do not concern successful charges.
    if (event.event !== "charge.success") {
      return NextResponse.json({ success: true })
    }

    const reference = event.data?.reference

    if (!reference) {
      return NextResponse.json(
        { error: "Missing payment reference." },
        { status: 400 },
      )
    }

    // Find the KFM order associated with this Paystack reference.
    const { data: order, error: orderError } = await supabase
      .from("market_orders")
      .select("id, order_number, payment_status, total_amount")
      .eq("payment_reference", reference)
      .maybeSingle()

    if (orderError) {
      console.error("KFM Paystack order lookup error:", orderError)

      return NextResponse.json(
        { error: "Unable to find KFM order." },
        { status: 500 },
      )
    }

    if (!order) {
      // Ride payments share the Paystack account but are recorded in ride_requests.
      const { data: ride, error: rideError } = await supabase
        .from("ride_requests")
        .select("id, booking_code, customer_name, customer_email, pickup_town, pickup_area, destination_town, destination_area, payment_status, payment_method, payment_reference, payment_paid_at, fare_estimate, ride_status")
        .eq("payment_reference", reference)
        .maybeSingle()

      if (rideError) {
        console.error("KFM ride payment lookup error:", rideError)
        return NextResponse.json({ error: "Unable to find KFM ride payment." }, { status: 500 })
      }
      if (!ride) return NextResponse.json({ error: "KFM order or ride not found." }, { status: 404 })

      const verifyRideResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${paystackSecretKey}`, Accept: "application/json" },
          cache: "no-store",
        },
      )
      if (!verifyRideResponse.ok) return NextResponse.json({ error: "Unable to verify ride payment with Paystack." }, { status: 502 })
      const verifyRideData = await verifyRideResponse.json()
      const rideTransaction = verifyRideData?.data
      if (
        verifyRideData?.status !== true ||
        rideTransaction?.status !== "success" ||
        rideTransaction?.reference !== reference ||
        rideTransaction?.currency !== "GHS"
      ) {
        return NextResponse.json({ error: "Ride transaction is not verified as successful in GHS." }, { status: 400 })
      }

      const expectedRideAmount = Math.round(Number(ride.fare_estimate) * 100)
      if (
        String(ride.payment_method).toLowerCase() !== "paystack" ||
        String(ride.ride_status).toLowerCase() !== "completed" ||
        !Number.isFinite(expectedRideAmount) ||
        expectedRideAmount <= 0 ||
        rideTransaction.amount !== expectedRideAmount
      ) {
        return NextResponse.json({ error: "Ride payment details do not match the completed KFM ride." }, { status: 400 })
      }
      if (String(ride.payment_status).toLowerCase() === "paid") {
        return NextResponse.json({ success: true, message: "Ride was already marked as paid." })
      }

      const paidAt = rideTransaction.paid_at || new Date().toISOString()
      const { data: updatedRide, error: rideUpdateError } = await supabase
        .from("ride_requests")
        .update({ payment_status: "paid", payment_reference: reference, payment_paid_at: paidAt })
        .eq("id", ride.id)
        .eq("payment_status", "unpaid")
        .select("id")
        .maybeSingle()

      if (rideUpdateError) {
        console.error("KFM ride payment update error:", rideUpdateError)
        return NextResponse.json({ error: "Unable to update KFM ride payment." }, { status: 500 })
      }
      if (updatedRide) {
        await sendRidePaymentReceiptEmail({ ...ride, payment_method: "paystack", payment_reference: reference, payment_paid_at: paidAt })
      }
      return NextResponse.json({
        success: true,
        message: updatedRide ? "Ride payment verified and recorded." : "Ride payment was already recorded.",
      })
    }

    // Verify the transaction directly with Paystack.
    const verificationResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    )

    if (!verificationResponse.ok) {
      console.error(
        "KFM Paystack verification request failed:",
        verificationResponse.status,
      )

      return NextResponse.json(
        { error: "Unable to verify payment with Paystack." },
        { status: 502 },
      )
    }

    const verification = await verificationResponse.json()
    const transaction = verification?.data

    if (
      verification?.status !== true ||
      transaction?.status !== "success" ||
      transaction?.reference !== reference
    ) {
      console.error("KFM Paystack transaction verification failed:", reference)

      return NextResponse.json(
        { error: "Paystack transaction is not verified as successful." },
        { status: 400 },
      )
    }

    // Database order totals are in Ghana cedis; Paystack amounts are pesewas.
    const expectedAmount = Math.round(Number(order.total_amount) * 100)

    if (
      !Number.isFinite(expectedAmount) ||
      expectedAmount <= 0 ||
      transaction?.amount !== expectedAmount
    ) {
      console.error("KFM Paystack amount mismatch:", order.order_number)

      return NextResponse.json(
        { error: "Payment amount does not match the KFM order." },
        { status: 400 },
      )
    }

    if (transaction?.currency !== "GHS") {
      console.error("KFM Paystack currency mismatch:", order.order_number)

      return NextResponse.json(
        { error: "Payment currency does not match GHS." },
        { status: 400 },
      )
    }

    // Do not repeat the payment update for an already-paid order.
    if (order.payment_status === "PAID") {
      return NextResponse.json({
        success: true,
        message: "Order was already marked as paid.",
      })
    }

    // Conditional update helps prevent duplicate webhook deliveries
    // from changing an order that has already been marked PAID.
    const { data: updatedOrder, error: updateError } = await supabase
      .from("market_orders")
      .update({
        payment_status: "PAID",
        payment_reference: reference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .neq("payment_status", "PAID")
      .select("id")
      .maybeSingle()

    if (updateError) {
      console.error("KFM Paystack payment update error:", updateError)

      return NextResponse.json(
        { error: "Unable to update KFM order." },
        { status: 500 },
      )
    }

    if (updatedOrder) {
      console.log(`KFM order ${order.order_number} marked PAID.`)
    }

    return NextResponse.json({
      success: true,
      message: updatedOrder
        ? "Payment verified and order marked as paid."
        : "Order was already marked as paid.",
    })
  } catch (error) {
    console.error("KFM Paystack webhook error:", error)

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    )
  }
}
