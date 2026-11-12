import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"
import { sendMarketPaymentConfirmation } from "@/lib/market-order-email"

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
      data?: { reference?: string; status?: string; transfer_code?: string; amount?: number; currency?: string; domain?: string }
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

    // Driver payout transfers have their own lifecycle. Never treat a transfer
    // webhook as a customer charge, and never mark a test transfer as paid.
    const transferEvents: Record<string, string> = {
      "transfer.success": "success",
      "transfer.failed": "failed",
      "transfer.reversed": "reversed",
    }
    const transferStatus = event.event ? transferEvents[event.event] : undefined
    if (transferStatus) {
      const transferReference = event.data?.reference
      const amount = event.data?.amount
      const currency = event.data?.currency
      if (!transferReference || !Number.isSafeInteger(amount) || !currency) {
        return NextResponse.json({ error: "Paystack transfer event is missing required verification fields." }, { status: 400 })
      }

      const { data: result, error } = await supabase.rpc("kfm_handle_paystack_driver_payout_event", {
        p_reference: transferReference,
        p_status: transferStatus,
        p_transfer_code: event.data?.transfer_code || null,
        p_amount_pesewas: amount,
        p_currency: currency,
        p_domain: event.data?.domain || "live",
      })
      if (error) {
        console.error("KFM Paystack driver payout webhook processing failed:", error)
        return NextResponse.json({ error: "Unable to reconcile Paystack driver payout event." }, { status: 500 })
      }
      return NextResponse.json({ success: true, payout: result })
    }

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

    // KFM ride payments use their own reference prefix and ride_requests table.
    if (reference.startsWith("KFM-RIDE-")) {
      const { data: ride, error: rideError } = await supabase
        .from("ride_requests")
        .select("id, booking_code, fare_estimate, payment_status, payment_method, ride_status")
        .eq("payment_reference", reference)
        .maybeSingle()

      if (rideError || !ride) {
        console.error("KFM ride not found for Paystack reference:", reference, rideError)
        return NextResponse.json({ error: "KFM ride not found." }, { status: 404 })
      }

      const verificationResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${paystackSecretKey}`, Accept: "application/json" },
          cache: "no-store",
        },
      )
      if (!verificationResponse.ok) {
        return NextResponse.json({ error: "Unable to verify ride payment with Paystack." }, { status: 502 })
      }

      const verification = await verificationResponse.json()
      const transaction = verification?.data
      const expectedAmount = Math.round(Number(ride.fare_estimate) * 100)

      if (
        verification?.status !== true ||
        transaction?.status !== "success" ||
        transaction?.reference !== reference ||
        transaction?.currency !== "GHS" ||
        !Number.isFinite(expectedAmount) ||
        expectedAmount <= 0 ||
        transaction?.amount !== expectedAmount ||
        ride.ride_status !== "completed" ||
        ride.payment_method?.toLowerCase() !== "paystack"
      ) {
        console.error("KFM ride Paystack verification mismatch:", ride.booking_code)
        return NextResponse.json({ error: "Ride payment could not be verified against the booking." }, { status: 400 })
      }

      if (ride.payment_status?.toLowerCase() === "paid") {
        return NextResponse.json({ success: true, message: "Ride payment was already recorded." })
      }

      const fare = Number(ride.fare_estimate)
      const driverShare = Math.round(fare * 0.8 * 100) / 100
      const commission = Math.round((fare - driverShare) * 100) / 100
      const { error: updateError } = await supabase
        .from("ride_requests")
        .update({
          payment_status: "paid",
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

      if (updateError) {
        console.error("KFM ride payment recording failed:", updateError)
        return NextResponse.json({ error: "Unable to record KFM ride payment." }, { status: 500 })
      }

      console.log(`KFM ride ${ride.booking_code} marked PAID via Paystack webhook.`)
      return NextResponse.json({ success: true, message: "Ride payment verified and recorded." })
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
      console.error("KFM order not found for Paystack reference:", reference)

      return NextResponse.json(
        { error: "KFM order not found." },
        { status: 404 },
      )
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

    // A webhook retry can also retry a failed confirmation email. The
    // email helper uses a stable Resend idempotency key per order.
    if (order.payment_status === "PAID") {
      const email = await sendMarketPaymentConfirmation(order.id)

      if (
        process.env.KFM_MARKETPLACE_EMAILS_ENABLED === "true" &&
        process.env.RESEND_DOMAIN_VERIFIED === "true" &&
        !email.sent
      ) {
        return NextResponse.json(
          { error: "Payment is recorded, but the confirmation email could not be sent." },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Order was already marked as paid.",
        email: email.sent ? "sent" : email.reason,
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

    let emailResult: "sent" | "disabled" | "not_sent" = "not_sent"

    if (updatedOrder) {
      console.log(`KFM order ${order.order_number} marked PAID.`)

      // Send only after Paystack verification and the database PAID update.
      // Email failure must not undo a successful payment or break checkout.
      const email = await sendMarketPaymentConfirmation(order.id)
      emailResult = email.sent
        ? "sent"
        : email.reason === "disabled"
          ? "disabled"
          : "not_sent"
    }

    if (
      updatedOrder &&
      process.env.KFM_MARKETPLACE_EMAILS_ENABLED === "true" &&
      process.env.RESEND_DOMAIN_VERIFIED === "true" &&
      emailResult === "not_sent"
    ) {
      return NextResponse.json(
        { error: "Payment is recorded, but the confirmation email could not be sent." },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: updatedOrder
        ? "Payment verified and order marked as paid."
        : "Order was already marked as paid.",
      email: emailResult,
    })
  } catch (error) {
    console.error("KFM Paystack webhook error:", error)

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    )
  }
}
