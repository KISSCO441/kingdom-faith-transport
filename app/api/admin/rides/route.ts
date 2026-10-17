
import { NextRequest, NextResponse } from "next/server";
import { requireKfmAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const supabase = auth.supabase;

    // Retrieve ride bookings, including their payment details.
    const { data: rides, error: ridesError } = await supabase
      .from("ride_requests")
      .select(
        "id, created_at, booking_code, customer_name, customer_phone, vehicle_type, ride_option, pickup_town, pickup_area, destination_town, destination_area, when_option, notes, ride_status, payment_status, driver_id, fare_estimate, payment_method, customer_email, payment_reference, payment_paid_at"
      )
      .order("created_at", { ascending: false });

    if (ridesError) {
      console.error("Admin rides query failed:", ridesError);
      return NextResponse.json(
        { success: false, error: "Unable to load ride bookings." },
        { status: 500 }
      );
    }

    // Retrieve driver details separately to avoid relying on a database join.
    const { data: drivers, error: driversError } = await supabase
      .from("drivers")
      .select("id, full_name, phone");

    if (driversError) {
      console.error("Admin drivers query failed:", driversError);
      return NextResponse.json(
        { success: false, error: "Unable to load assigned driver details." },
        { status: 500 }
      );
    }

    const driverById = new Map(
      (drivers ?? []).map((driver) => [driver.id, driver])
    );

    const bookings = (rides ?? []).map((ride) => ({
      ...ride,
      driver: ride.driver_id
        ? driverById.get(ride.driver_id) ?? null
        : null,
    }));

    return NextResponse.json({
      success: true,
      rides: bookings,
      total: bookings.length,
    });
  } catch (error) {
    console.error("Admin rides API error:", error);

    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
