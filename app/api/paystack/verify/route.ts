import { NextResponse } from "next/server"

const PAYSTACK_API_URL = "https://api.paystack.co"

export async function GET(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        {
          status: false,
          message: "Paystack secret key is not configured.",
        },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json(
        {
          status: false,
          message: "Payment reference is required.",
        },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    )

    const data = await response.json()

    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          status: false,
          message:
            data?.message || "Unable to verify Paystack transaction.",
        },
        { status: response.status || 400 }
      )
    }

    const transaction = data.data

    if (transaction.status !== "success") {
      return NextResponse.json({
        status: false,
        message: "Payment has not been completed.",
        data: {
          reference: transaction.reference,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
        },
      })
    }

    if (transaction.currency !== "GHS") {
      return NextResponse.json(
        {
          status: false,
          message: "Payment currency could not be verified.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      status: true,
      message: "Payment verified successfully.",
      data: {
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        paidAt: transaction.paid_at,
        channel: transaction.channel,
        customer: transaction.customer,
        metadata: transaction.metadata,
      },
    })
  } catch (error) {
    console.error("Paystack verification error:", error)

    return NextResponse.json(
      {
        status: false,
        message: "An unexpected payment verification error occurred.",
      },
      { status: 500 }
    )
  }
}
