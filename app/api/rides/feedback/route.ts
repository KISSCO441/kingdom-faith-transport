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
    const hasRating = body.rating !== undefined && body.rating !== null && body.rating !== "";
    const rating = hasRating ? Number(body.rating) : null;
    const comment =
      typeof body.comment === "string" ? body.comment.trim() : "";
    const hasComment = comment.length > 0;
    const commentLength = Array.from(comment).length;

    if (!reference.startsWith("KFM-RIDE-")) {
      return NextResponse.json(
        { success: false, error: "A valid KFM ride reference is required." },
        { status: 400 }
      );
    }

    if (hasRating === hasComment) {
      return NextResponse.json(
        { success: false, error: "Please select a driver rating or enter a short comment." },
        { status: 400 }
      );
    }

    if (hasRating && ![1, 2, 3].includes(rating as number)) {
      return NextResponse.json(
        { success: false, error: "Please select one of the three driver ratings." },
        { status: 400 }
      );
    }

    if (hasComment && commentLength > 80) {
      return NextResponse.json(
        { success: false, error: "Your comment must be 80 characters or fewer." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: ride, error: rideError } = await supabase
      .from("ride_requests")
      .select("id, booking_code, driver_id, ride_status, payment_status")
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
      ride.payment_status?.toLowerCase() !== "paid"
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
        rating: hasRating ? rating : null,
        comment: hasComment ? comment : null,
      });

    if (insertError?.code === "23505") {
      return NextResponse.json({
        success: true,
        already_submitted: true,
        message: "Feedback has already been recorded for this ride. Thank you.",
      });
    }

    if (insertError) {
      console.error("KFM driver feedback could not be saved:", insertError);
      return NextResponse.json(
        { success: false, error: "We could not save your feedback just now. Please try again." },
        { status: 500 }
      );
    }

    // Customer comments are also emailed directly to the KFM transport inbox.
    // Ratings remain stored in the database without generating an email.
    if (hasComment) {
      const resendApiKey = process.env.RESEND_API_KEY;
      const resendFromEmail = process.env.RESEND_FROM_EMAIL;

      if (!resendApiKey || !resendFromEmail) {
        await supabase
          .from("ride_driver_ratings")
          .delete()
          .eq("ride_id", ride.id);

        console.error("KFM ride feedback email configuration is missing.");
        return NextResponse.json(
          { success: false, error: "Your comment could not be delivered to KFM. Please try submitting it again later." },
          { status: 503 }
        );
      }

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to: ["kingdomfaithtransport@gmail.com"],
          subject: `KFM Driver Feedback — ${ride.booking_code || reference}`,
          text: [
            "A customer has submitted feedback about a KFM ride.",
            `Booking: ${ride.booking_code || "Not available"}`,
            `Ride reference: ${reference}`,
            `Driver ID: ${ride.driver_id}`,
            `Customer comment: ${comment}`,
          ].join("\\n"),
          html: `<h2>New KFM Driver Feedback</h2><p>A customer has submitted feedback about a KFM ride.</p><p><strong>Booking:</strong> ${ride.booking_code || "Not available"}</p><p><strong>Ride reference:</strong> ${reference}</p><p><strong>Driver ID:</strong> ${ride.driver_id}</p><p><strong>Customer comment:</strong> ${comment.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`,
        }),
      });

      if (!emailResponse.ok) {
        await supabase
          .from("ride_driver_ratings")
          .delete()
          .eq("ride_id", ride.id);

        console.error("Resend rejected the KFM ride feedback email.");
        return NextResponse.json(
          { success: false, error: "Your comment could not be emailed to KFM. Please try again shortly." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: hasComment
        ? "Thank you. Your comment has been sent to KFM and recorded for service assessment."
        : "Thank you. Your driver rating has been recorded.",
      booking_code: ride.booking_code,
    });
  } catch (error) {
    console.error("KFM ride feedback API error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while saving your feedback." },
      { status: 500 }
    );
  }
}
