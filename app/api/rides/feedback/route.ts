import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
    const hasRating =
      body.rating !== undefined && body.rating !== null && body.rating !== "";
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

    // Reuse an existing feedback record when retrying email delivery.
    const { data: insertedFeedback, error: insertError } = await supabase
      .from("ride_driver_ratings")
      .insert({
        ride_id: ride.id,
        driver_id: ride.driver_id,
        rating: hasRating ? rating : null,
        comment: hasComment ? comment : null,
      })
      .select("id, rating, comment, email_sent_at")
      .single();

    let feedback = insertedFeedback;

    if (insertError?.code === "23505") {
      const { data: existingFeedback, error: existingError } = await supabase
        .from("ride_driver_ratings")
        .select("id, rating, comment, email_sent_at")
        .eq("ride_id", ride.id)
        .maybeSingle();

      if (existingError || !existingFeedback) {
        console.error("KFM existing ride feedback could not be loaded:", existingError);
        return NextResponse.json(
          { success: false, error: "We found your previous feedback but could not prepare its email. Please try again." },
          { status: 500 }
        );
      }

      feedback = existingFeedback;
    } else if (insertError || !insertedFeedback) {
      console.error("KFM driver feedback could not be saved:", insertError);
      return NextResponse.json(
        { success: false, error: "We could not save your feedback just now. Please try again." },
        { status: 500 }
      );
    }

    if (!feedback) {
      return NextResponse.json(
        { success: false, error: "We could not retrieve the saved feedback. Please try again." },
        { status: 500 }
      );
    }

    // A previously emailed feedback record must not generate duplicate emails.
    if (feedback.email_sent_at) {
      return NextResponse.json({
        success: true,
        already_submitted: true,
        email_sent: true,
        message: "Your feedback has already been recorded and emailed to KFM. Thank you.",
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey || !resendFromEmail) {
      console.error("KFM ride feedback email configuration is missing.");
      return NextResponse.json(
        { success: false, feedback_recorded: true, error: "Your feedback is saved, but email delivery is not configured yet. KFM can safely retry delivery." },
        { status: 503 }
      );
    }

    const savedRating = feedback.rating;
    const savedComment =
      typeof feedback.comment === "string" ? feedback.comment : "";
    const ratingLabel =
      savedRating === 1 ? "Good" : savedRating === 2 ? "Very Good" : savedRating === 3 ? "Not So Good" : "";
    const feedbackLabel = savedComment ? "Customer comment" : "Customer rating";
    const feedbackValue = savedComment || ratingLabel;

    const safeBookingCode = escapeHtml(ride.booking_code || "Not available");
    const safeReference = escapeHtml(reference);
    const safeDriverId = escapeHtml(ride.driver_id);
    const safeFeedback = escapeHtml(feedbackValue);

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
          `${feedbackLabel}: ${feedbackValue}`,
        ].join("\n"),
        html: `<h2>New KFM Driver Feedback</h2><p>A customer has submitted feedback about a KFM ride.</p><p><strong>Booking:</strong> ${safeBookingCode}</p><p><strong>Ride reference:</strong> ${safeReference}</p><p><strong>Driver ID:</strong> ${safeDriverId}</p><p><strong>${feedbackLabel}:</strong> ${safeFeedback}</p>`,
      }),
    });

    if (!emailResponse.ok) {
      const resendError = await emailResponse.text();
      console.error("Resend rejected the KFM ride feedback email:", resendError);
      return NextResponse.json(
        { success: false, feedback_recorded: true, error: "Your feedback is safely saved, but KFM email delivery failed. Please try again shortly." },
        { status: 503 }
      );
    }

    const { error: sentUpdateError } = await supabase
      .from("ride_driver_ratings")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", feedback.id);

    if (sentUpdateError) {
      console.error("KFM feedback email sent but delivery status could not be recorded:", sentUpdateError);
      return NextResponse.json({
        success: true,
        email_sent: true,
        message: "Your feedback email was sent to KFM. Its delivery record is being reconciled.",
        booking_code: ride.booking_code,
      });
    }

    return NextResponse.json({
      success: true,
      email_sent: true,
      message: "Thank you. Your comment or rating has been emailed to KFM and recorded.",
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
