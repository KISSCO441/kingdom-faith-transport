
import { NextResponse } from "next/server";
import { calculateCarFareFromLocations } from "@/lib/kfm-fare";

const okadaFares: Record<string, number> = {
  "Nsawam Central": 15,
  "Adoagyiri / Close Areas": 25,
  "Ntoaso / Nsumia Area": 40,
  "Sakyikrom / Ahodwo Area": 60,
  "Fotobi / Outer Local Area": 80,
};

function createBookingCode() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `KFM-${random}`;
}

type Driver = {
  id: string;
  full_name: string | null;
  phone: string | null;
  vehicle_type: string | null;
  operating_town: string | null;
  operating_area: string | null;
  status: string | null;
  availability: string | null;
};

async function findAvailableDriver(
  supabaseUrl: string,
  supabaseSecretKey: string,
  vehicleType: string,
  pickupTown: string
): Promise<Driver | null> {
  const requiredVehicleType =
    vehicleType.trim().toLowerCase() === "motorbike"
      ? "Okada"
      : "Car";

  const params = new URLSearchParams({
    select:
      "id,full_name,phone,vehicle_type,operating_town,operating_area,status,availability",
    status: "eq.VERIFIED",
    availability: "eq.ONLINE",
    vehicle_type: `ilike.${requiredVehicleType}`,
  });

  const response = await fetch(
    `${supabaseUrl}/rest/v1/drivers?${params.toString()}`,
    {
      method: "GET",
      headers: {
        apikey: supabaseSecretKey,
        Authorization: `Bearer ${supabaseSecretKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Unable to find available KFM drivers:",
      errorText
    );

    return null;
  }

  const drivers = (await response.json()) as Driver[];

  if (drivers.length === 0) {
    return null;
  }

  // Retrieve active rides so drivers already handling a ride
  // are not selected for another booking.
  const rideParams = new URLSearchParams({
    select: "driver_id",
    ride_status: "in.(requested,accepted,arrived,in_progress)",
    driver_id: `in.(${drivers.map((driver) => driver.id).join(",")})`,
  });

  const activeRidesResponse = await fetch(
    `${supabaseUrl}/rest/v1/ride_requests?${rideParams.toString()}`,
    {
      method: "GET",
      headers: {
        apikey: supabaseSecretKey,
        Authorization: `Bearer ${supabaseSecretKey}`,
      },
      cache: "no-store",
    }
  );

  if (!activeRidesResponse.ok) {
    const errorText = await activeRidesResponse.text();

    console.error(
      "Unable to check active KFM rides:",
      errorText
    );

    // Fail closed: do not automatically assign a driver when
    // the active-ride check cannot be completed.
    return null;
  }

  const activeRides = (await activeRidesResponse.json()) as {
    driver_id: string | null;
  }[];

  const busyDriverIds = new Set(
    activeRides
      .map((ride) => ride.driver_id)
      .filter((id): id is string => Boolean(id))
  );

  const availableDrivers = drivers.filter(
    (driver) => !busyDriverIds.has(driver.id)
  );

  const sameTownDriver = availableDrivers.find(
    (driver) =>
      driver.operating_town?.trim().toLowerCase() ===
      pickupTown.trim().toLowerCase()
  );

  return sameTownDriver ?? availableDrivers[0] ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customer_name,
      customer_phone,
      customer_email,
      payment_method,
      vehicle_type,
      ride_option,
      pickup_town,
      pickup_area,
      destination_town,
      destination_area,
      when_option,
      notes,
      okada_zone,
    } = body;

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
        { status: 400 }
      );
    }

    // Existing bookings default to cash until a customer selects otherwise.
    const paymentMethod =
      payment_method == null
        ? "cash"
        : typeof payment_method === "string"
          ? payment_method.trim().toLowerCase()
          : "";

    if (!["cash", "paystack"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Please select a valid payment method." },
        { status: 400 }
      );
    }

    const normalizedCustomerEmail =
      typeof customer_email === "string"
        ? customer_email.trim().toLowerCase()
        : "";

    if (normalizedCustomerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedCustomerEmail)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (paymentMethod === "paystack" && !normalizedCustomerEmail) {
      return NextResponse.json({ error: "Please provide a valid email address for online payment." }, { status: 400 });
    }

    let fareEstimate: number | null = null;

    // KFM OKADA: preserve the existing zone-based fares.
    if (vehicle_type.trim().toLowerCase() === "motorbike") {
      if (pickup_town !== "Nsawam") {
        return NextResponse.json(
          {
            error:
              "Okada service is currently limited to approved Nsawam-area routes.",
          },
          { status: 400 }
        );
      }

      if (!okada_zone || !okadaFares[okada_zone]) {
        return NextResponse.json(
          {
            error:
              "Please select a valid KFM Okada destination zone.",
          },
          { status: 400 }
        );
      }

      fareEstimate = okadaFares[okada_zone];
    }

    // KFM CAR: preserve the existing server-calculated fare.
    if (vehicle_type.trim().toLowerCase() === "car") {
      try {
        const carFare = await calculateCarFareFromLocations({
          pickupArea: pickup_area,
          pickupTown: pickup_town,
          destinationArea: destination_area,
          destinationTown: destination_town,
        });

        fareEstimate = carFare.fare;

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
        });
      } catch (fareError) {
        console.error(
          "KFM car fare calculation failed:",
          fareError
        );

        return NextResponse.json(
          {
            error:
              "Unable to calculate the KFM car fare from the selected locations. Please check the pickup and destination and try again.",
          },
          { status: 400 }
        );
      }
    }

    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error("KFM ride API Supabase configuration is missing.");

      return NextResponse.json(
        {
          error:
            "Supabase environment variables are not configured.",
        },
        { status: 500 }
      );
    }

    const bookingCode = createBookingCode();

    const matchedDriver = await findAvailableDriver(
      supabaseUrl,
      supabaseSecretKey,
      vehicle_type,
      pickup_town
    );

    const matchedDriverId = matchedDriver?.id || null;

    console.log("KFM DRIVER MATCH RESULT:", {
      vehicle_type,
      pickup_town,
      matchedDriverId,
    });

    const response = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests`,
      {
        method: "POST",
        headers: {
          apikey: supabaseSecretKey,
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
          payment_method: paymentMethod,
          customer_email: normalizedCustomerEmail || null,
          payment_reference: null,
          payment_paid_at: null,
          driver_id: matchedDriverId,
          fare_estimate: fareEstimate,
        }),
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok || !Array.isArray(data) || !data[0]) {
      console.error("KFM Supabase booking error:", data);

      return NextResponse.json(
        { error: "Unable to save the ride request." },
        { status: 500 }
      );
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Ride booking API error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the ride request.",
      },
      { status: 500 }
    );
  }
}
