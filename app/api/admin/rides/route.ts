import { NextRequest, NextResponse } from "next/server";
import { requireKfmAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const supabase = auth.supabase;

    // Retrieve ride bookings, including payment details.
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

    // Retrieve driver details separately.
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

    // Retrieve rejection records for the admin audit history.
    const { data: rejections, error: rejectionsError } = await supabase
      .from("ride_driver_rejections")
      .select("ride_id, driver_id, rejected_at")
      .order("rejected_at", { ascending: false });

    if (rejectionsError) {
      console.error("Admin ride rejection history query failed:", rejectionsError);
      return NextResponse.json(
        { success: false, error: "Unable to load ride rejection history." },
        { status: 500 }
      );
    }

    const driverById = new Map(
      (drivers ?? []).map((driver) => [driver.id, driver])
    );

    const rejectionHistoryByRide = new Map<
      string,
      Array<{
        driver_id: string;
        driver_name: string;
        rejected_at: string;
      }>
    >();

    for (const rejection of rejections ?? []) {
      const history = rejectionHistoryByRide.get(rejection.ride_id) ?? [];

      history.push({
        driver_id: rejection.driver_id,
        driver_name:
          driverById.get(rejection.driver_id)?.full_name ?? "Unknown driver",
        rejected_at: rejection.rejected_at,
      });

      rejectionHistoryByRide.set(rejection.ride_id, history);
    }

    const bookings = (rides ?? []).map((ride) => ({
      ...ride,
      driver: ride.driver_id
        ? driverById.get(ride.driver_id) ?? null
        : null,
      rejection_history: rejectionHistoryByRide.get(ride.id) ?? [],
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
