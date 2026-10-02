import { NextResponse } from "next/server"
import { calculateCarFareFromLocations } from "@/lib/kfm-fare"

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

type Driver = {
  id: string
  full_name: string | null
  phone: string | null
  vehicle_type: string | null
  operating_town: string | null
  operating_area: string | null
  status: string | null
  availability: string | null
}

async function findAvailableDriver(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  vehicleType: string,
  pickupTown: string,
) {
  const requiredVehicleType =
    vehicleType.trim().toLowerCase() === "motorbike"
      ? "Okada"
      : "Car"

  const response = await fetch(
    `${supabaseUrl}/rest/v1/drivers` +
      `?select=id,full_name,phone,vehicle_type,operating_town,operating_area,status,availability` +
      `&status=eq.VERIFIED` +
      `&availability=eq.ONLINE` +
      `&vehicle_type=ilike.${encodeURIComponent(requiredVehicleType)}`,
    {
      method: "GET",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    const errorData = await response.text()

    console.error(
      "Unable to find available KFM drivers:",
      errorData,
    )

    return null
  }

  const drivers = (await response.json()) as Driver[]

  console.log("KFM DRIVER MATCH QUERY RESULT:", {
    requiredVehicleType,
    pickupTown,
    drivers,
  })

  console.log("KFM AVAILABLE DRIVERS:", drivers)

  if (!drivers.length) {
    console.log(
      "No VERIFIED + ONLINE KFM driver found for vehicle:",
      requiredVehicleType,
    )

    return null
  }

  const sameTownDriver = drivers.find(
    (driver) =>
      driver.operating_town?.trim().toLowerCase() ===
      pickupTown.trim().toLowerCase(),
  )

  if (sameTownDriver) {
    return sameTownDriver
  }

  return drivers[0]
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
        {
          error:
            "Please provide all required booking details.",
        },
        { status: 400 },
      )
    }

    let fareEstimate: number | null = null

    /*
     * KFM OKADA FARE
     *
     * Okada remains zone-based.
     */
    if (vehicle_type.trim().toLowerCase() === "motorbike") {
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
            error:
              "Please select a valid KFM Okada destination zone.",
          },
          { status: 400 },
        )
      }

      fareEstimate = okadaFares[okada_zone]
    }

    /*
     * KFM CAR FARE
     *
     * Mapbox calculates the actual road distance.
     * KFM then applies:
     *
     * GH₵6 per billed kilometre
     * Minimum fare: GH₵25
     */
    if (vehicle_type.trim().toLowerCase() === "car") {
      try {
        const carFare = await calculateCarFareFromLocations({
          pickupArea: pickup_area,
          pickupTown: pickup_town,
          destinationArea: destination_area,
          destinationTown: destination_town,
        })

        fareEstimate = carFare.fare

        console.log("KFM CAR FARE CALCULATION:", {
          pickupTown: pickup_town,
          pickupArea: pickup_area,
          destinationTown: destination_town,
          destinationArea: destination_area,
          distanceKm: carFare.distanceKm,
          billedKm: carFare.billedKm,
          ratePerKm: carFare.ratePerKm,
          minimumFare: carFare.minimumFare,
          fare: carFare.fare,
        })
      } catch (fareError) {
        console.error(
          "KFM car fare calculation failed:",
          fareError,
        )

        return NextResponse.json(
          {
            error:
              "Unable to calculate the KFM car fare from the selected locations. Please check the pickup and destination and try again.",
          },
          { status: 400 },
        )
      }
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

    const matchedDriver = await findAvailableDriver(
      supabaseUrl,
      supabaseServiceRoleKey,
      vehicle_type,
      pickup_town,
    )

    const matchedDriverId = matchedDriver?.id || null

    console.log("KFM DRIVER MATCH RESULT:", {
      vehicle_type,
      pickup_town,
      matchedDriverId,
      matchedDriver,
    })

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
          driver_id: matchedDriverId,
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
        driver_matched: Boolean(matchedDriver),
        driver: matchedDriver
          ? {
              id: matchedDriver.id,
              name: matchedDriver.full_name,
              phone: matchedDriver.phone,
              vehicle_type: matchedDriver.vehicle_type,
              operating_town: matchedDriver.operating_town,
              operating_area: matchedDriver.operating_area,
            }
          : null,
        message: matchedDriver
          ? "Ride request received and a KFM driver has been matched."
          : "Ride request received. KFM is looking for an available driver.",
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
