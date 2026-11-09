import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { success: false, error: "Ride feedback is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const reference =
      typeof body.reference === "string" ? body.reference.trim() : "";
    const rating = Number(body.rating);

    if (!reference.startsWith("KFM-RIDE-")) {
      return NextResponse.json(
        { success: false, error: "A valid KFM ride reference is required." },
        { status: 400 }
      );
    }

    if (![1, 2, 3].includes(rating)) {
      return NextResponse.json(
        { success: false, error: "Please select one of the three driver ratings." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: ride, error: rideError } = await supabase
      .from("ride_requests")
      .select("id, booking_code, driver_id, ride_status, payment_status, payment_method")
      .eq("payment_reference", reference)
      .maybeSingle();

    if (rideError || !ride) {
      return NextResponse.json(
        { success: false, error: "We could not find the KFM ride for this receipt." },
        { status: 404 }
      );
    }

    if (
      ride.ride_status?.toLowerCase() !== "completed" ||
      ride.payment_status?.toLowerCase() !== "paid" ||
      ride.payment_method?.toLowerCase() !== "paystack"
    ) {
      return NextResponse.json(
        { success: false, error: "Feedback is available after the ride is completed and payment is confirmed." },
        { status: 409 }
      );
    }

    if (!ride.driver_id) {
      return NextResponse.json(
        { success: false, error: "This ride has no assigned driver to rate. Please contact KFM for assistance." },
        { status: 409 }
      );
    }

    const { error: insertError } = await supabase
      .from("ride_driver_ratings")
      .insert({
        ride_id: ride.id,
        driver_id: ride.driver_id,
        rating,
      });

    if (insertError?.code === "23505") {
      return NextResponse.json({
        success: true,
        already_submitted: true,
        message: "A driver rating has already been recorded for this ride. Thank you for your feedback.",
      });
    }

    if (insertError) {
      console.error("KFM driver feedback could not be saved:", insertError);
      return NextResponse.json(
        { success: false, error: "We could not save your rating just now. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you. Your driver rating has been recorded.",
      booking_code: ride.booking_code,
    });
  } catch (error) {
    console.error("KFM ride feedback API error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while saving your rating." },
      { status: 500 }
    );
  }
}
