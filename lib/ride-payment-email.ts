import "server-only";

import { createClient } from "@supabase/supabase-js";

type NotificationResult = {
  sent: number;
  skipped: number;
  failed: number;
};

function money(value: unknown): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? `GH₵${amount.toFixed(2)}` : "GH₵0.00";
}

/**
 * Sends idempotent ride-payment confirmations after the ride is marked paid.
 * Preview messages can only go to the fixed test recipient configured for Preview.
 */
export async function sendRidePaymentNotifications(
  rideId: string,
): Promise<NotificationResult> {
  const previewTestMode =
    process.env.VERCEL_ENV === "preview" &&
    process.env.KFM_RIDE_PAYMENT_EMAIL_TEST_MODE === "true";

  if (
    !previewTestMode &&
    (process.env.KFM_RIDE_PAYMENT_EMAILS_ENABLED !== "true" ||
      process.env.RESEND_DOMAIN_VERIFIED !== "true")
  ) {
    return { sent: 0, skipped: 1, failed: 0 };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = previewTestMode
    ? "KFM Ride Payment Test <onboarding@resend.dev>"
    : process.env.RESEND_FROM_EMAIL;
  const testRecipient = process.env.KFM_RIDE_PAYMENT_TEST_EMAIL;
  const adminEmail = process.env.KFM_ADMIN_EMAIL;
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !resendApiKey ||
    !fromEmail ||
    !supabaseUrl ||
    !serviceRoleKey ||
    (previewTestMode && !testRecipient)
  ) {
    console.error("KFM ride payment email skipped: configuration is incomplete.");
    return { sent: 0, skipped: 0, failed: 1 };
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: ride, error: rideError } = await supabase
      .from("ride_requests")
      .select(
        "id, booking_code, customer_name, customer_email, customer_phone, driver_id, fare_estimate, payment_status, payment_method, payment_reference, payment_paid_at, payment_channel, payment_receipt_number, driver_share_amount, kfm_commission_amount",
      )
      .eq("id", rideId)
      .eq("payment_status", "paid")
      .maybeSingle();

    if (rideError || !ride) {
      console.error("KFM ride payment email could not load paid ride:", rideError);
      return { sent: 0, skipped: 0, failed: 1 };
    }

    let driver: { full_name?: string | null; email?: string | null; phone?: string | null } | null = null;
    if (ride.driver_id) {
      const { data, error } = await supabase
        .from("drivers")
        .select("full_name,email,phone")
        .eq("id", ride.driver_id)
        .maybeSingle();
      if (error) {
        console.error("KFM ride payment email could not load driver:", error);
      } else {
        driver = data;
      }
    }

    const fare = money(ride.fare_estimate);
    const driverShare = money(ride.driver_share_amount);
    const commission = money(ride.kfm_commission_amount);
    const details = [
      `Booking: ${ride.booking_code}`,
      `Customer: ${ride.customer_name || "Not provided"}`,
      `Customer phone: ${ride.customer_phone || "Not provided"}`,
      `Fare paid: ${fare}`,
      `Driver share (80%): ${driverShare}`,
      `KFM commission (20%): ${commission}`,
      `Payment method: ${ride.payment_method || "Not recorded"}`,
      `Payment channel: ${ride.payment_channel || "Not recorded"}`,
      `Paystack reference: ${ride.payment_reference || "Not applicable"}`,
      `Receipt: ${ride.payment_receipt_number || "Not generated"}`,
      `Paid at: ${ride.payment_paid_at || "Not recorded"}`,
    ].join("\n");

    const recipients = previewTestMode
      ? [{ email: testRecipient!, role: "Preview test" }]
      : [
          ...(driver?.email ? [{ email: driver.email, role: "Driver" }] : []),
          ...(adminEmail ? [{ email: adminEmail, role: "KFM administration" }] : []),
          ...(ride.customer_email
            ? [{ email: ride.customer_email, role: "Customer receipt" }]
            : []),
        ];

    if (recipients.length === 0) {
      console.error("KFM ride payment email skipped: no recipient addresses are configured.");
      return { sent: 0, skipped: 1, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `kfm-ride-payment-${ride.id}-${recipient.role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipient.email],
          subject: `${previewTestMode ? "[TEST] " : ""}KFM ride payment confirmed — ${ride.booking_code}`,
          text: [
            "Kingdom Faith Transport — Ride payment confirmation",
            "",
            `Hello ${recipient.role},`,
            "KFM has verified and recorded the completed ride payment.",
            "",
            details,
            "",
            "The driver share and KFM commission are accounting allocations. Any driver payout or cash commission settlement is recorded separately.",
          ].join("\n"),
        }),
        cache: "no-store",
      });

      if (response.ok) {
        sent += 1;
      } else {
        failed += 1;
        console.error(
          "KFM ride payment email failed:",
          recipient.role,
          response.status,
          (await response.text()).slice(0, 800),
        );
      }
    }

    return { sent, skipped: 0, failed };
  } catch (error) {
    console.error("KFM ride payment email error:", error);
    return { sent: 0, skipped: 0, failed: 1 };
  }
}
