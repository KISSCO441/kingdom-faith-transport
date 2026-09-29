import { NextResponse } from "next/server"

const okadaFares: Record<string, number> = {
  "Nsawam Central": 15,
  "Adoagyiri / Close Areas": 25,
  "Ntoaso / Nsumia Area": 40,
  "Sakyikrom / Ahodwo Area": 60,
  "Fotobi / Outer Local Area": 80,
}

function createBookingCode() {
  const random = Math.floor(100000 + Math.random() * 900000)
  return `KFM-${random}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      customer_name,
      customer_phone,
      vehicle_type,
      ride_option,
      pickup_town,
      pickup_area,
      destination_town,
      destination_area,
      when_option,
      notes,
      okada_zone,
    } = body

    if (
      !customer_name ||
      !customer_phone ||
      !vehicle_type ||
      !ride_option ||
      !pickup_town ||
      !pickup_area ||
      !destination_town ||
      !destination_area ||
      !when_option
    ) {
      return NextResponse.json(
        { error: "Please provide all required booking details." },
        { status: 400 },
      )
    }

    let fareEstimate: number | null = null

    if (vehicle_type === "motorbike") {
      if (pickup_town !== "Nsawam") {
        return NextResponse.json(
          {
            error:
              "Okada service is currently limited to approved Nsawam-area routes.",
          },
          { status: 400 },
        )
      }

      if (!okada_zone || !okadaFares[okada_zone]) {
        return NextResponse.json(
          {
            error: "Please select a valid KFM Okada destination zone.",
          },
          { status: 400 },
        )
      }

      fareEstimate = okadaFares[okada_zone]
    }

    if (vehicle_type === "car") {
      fareEstimate = null
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are not configured.",
        },
        { status: 500 },
      )
    }

    const bookingCode = createBookingCode()

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests`,
      {
        method: "POST",
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          booking_code: bookingCode,
          customer_name,
          customer_phone,
          vehicle_type,
          ride_option,
          pickup_town,
          pickup_area,
          destination_town,
          destination_area,
          when_option,
          notes: notes || null,
          ride_status: "requested",
          payment_status: "unpaid",
          driver_id: null,
          fare_estimate: fareEstimate,
        }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("Supabase booking error:", data)

      return NextResponse.json(
        {
          error: "Unable to save the ride request.",
          details: data,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        booking: data[0],
        message: "Ride request received successfully.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Ride booking API error:", error)

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the ride request.",
      },
      { status: 500 },
    )
  }
}
