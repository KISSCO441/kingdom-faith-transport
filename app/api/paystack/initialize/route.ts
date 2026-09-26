import { NextResponse } from "next/server"

const PAYSTACK_API_URL = "https://api.paystack.co"

export async function POST(request: Request) {
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

    const body = await request.json()

    const {
      email,
      amount,
      reference,
      customerName,
      phone,
      whatsapp,
      address,
      instructions,
      items,
    } = body

    if (!email || !amount || !reference) {
      return NextResponse.json(
        {
          status: false,
          message: "Email, amount and reference are required.",
        },
        { status: 400 }
      )
    }

    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          status: false,
          message: "Invalid payment amount.",
        },
        { status: 400 }
      )
    }

    const paystackAmount = Math.round(numericAmount * 100)

    const response = await fetch(
      `${PAYSTACK_API_URL}/transaction/initialize`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: String(paystackAmount),
          currency: "GHS",
          reference,
          channels: ["card", "mobile_money"],
          metadata: {
            customer_name: customerName || "",
            phone: phone || "",
            whatsapp: whatsapp || "",
            delivery_address: address || "",
            delivery_instructions: instructions || "",
            items: items || [],
          },
        }),
      }
    )

    const data = await response.json()

    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          status: false,
          message:
            data?.message ||
            "Unable to initialize Paystack transaction.",
        },
        { status: response.status || 400 }
      )
    }

    return NextResponse.json({
      status: true,
      message: "Paystack transaction initialized.",
      data: {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      },
    })
  } catch (error) {
    console.error("Paystack initialization error:", error)

    return NextResponse.json(
      {
        status: false,
        message: "An unexpected payment error occurred.",
      },
      { status: 500 }
    )
  }
}
