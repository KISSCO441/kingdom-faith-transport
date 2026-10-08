import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey || !paystackSecretKey) {
  throw new Error("Missing required environment variables")
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
)

export async function POST(request: Request) {
  try {
    const body = await request.text()

    const signature = request.headers.get("x-paystack-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Paystack signature." },
        { status: 401 },
      )
    }

    const hash = crypto
      .createHmac("sha512", paystackSecretKey)
      .update(body)
      .digest("hex")

    if (hash !== signature) {
      return NextResponse.json(
        { error: "Invalid Paystack signature." },
        { status: 401 },
      )
    }

    const event = JSON.parse(body)

    console.log("KFM Paystack webhook event:", event.event)

    if (event.event === "charge.success") {
      const reference = event.data?.reference

      if (!reference) {
        return NextResponse.json(
          { error: "Missing payment reference." },
          { status: 400 },
        )
      }

      const { data: order, error: orderError } = await supabase
        .from("market_orders")
        .select("id, order_number, payment_status")
        .eq("payment_reference", reference)
        .maybeSingle()

      if (orderError) {
        console.error(
          "KFM Paystack order lookup error:",
          orderError,
        )

        return NextResponse.json(
          { error: "Unable to find KFM order." },
          { status: 500 },
        )
      }

      if (!order) {
        console.error(
          "KFM order not found for Paystack reference:",
          reference,
        )

        return NextResponse.json(
          { error: "KFM order not found." },
          { status: 404 },
        )
      }

      if (order.payment_status !== "PAID") {
        const { error: updateError } = await supabase
          .from("market_orders")
          .update({
            payment_status: "PAID",
            payment_reference: reference,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)

        if (updateError) {
          console.error(
            "KFM Paystack payment update error:",
            updateError,
          )

          return NextResponse.json(
            { error: "Unable to update KFM order." },
            { status: 500 },
          )
        }

        console.log(
          `KFM order ${order.order_number} marked PAID.`,
        )
      }
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("KFM Paystack webhook error:", error)

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    )
  }
}
