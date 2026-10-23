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
