import { NextResponse } from "next/server";
import { calculateRidePaymentSplit, normalizeGhanaPhone } from "@/lib/ride-payment";
import { sendRidePaymentNotifications } from "@/lib/ride-payment-email";

export const runtime = "nodejs";

type RidePaymentRecord = {
  id: string;
  booking_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  ride_status: string | null;
  payment_method: string | null;
  payment_status: string | null;
  fare_estimate: number | string | null;
  payment_reference: string | null;
  payment_paid_at: string | null;
  driver_share_amount: number | string | null;
  kfm_commission_amount: number | string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingCode =
      typeof body.booking_code === "string"
        ? body.booking_code.trim().toUpperCase()
        : "";
    const suppliedPhone = normalizeGhanaPhone(body.phone);
    const reference =
      typeof body.reference === "string" ? body.reference.trim() : "";

    if (
      !/^KFM-\d{6}$/.test(bookingCode) ||
      !/^0\d{9}$/.test(suppliedPhone) ||
      !/^KFM-RIDE-KFM-\d{6}-[a-f0-9]{16}$/i.test(reference)
    ) {
      return NextResponse.json(
        { error: "The booking details or payment reference are invalid." },
        { status: 400 },
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!supabaseUrl || !serviceKey || !paystackSecret) {
      return NextResponse.json(
        { error: "Ride payment verification is not configured yet." },
        { status: 503 },
      );
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    const lookup = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests?booking_code=eq.${encodeURIComponent(bookingCode)}&payment_reference=eq.${encodeURIComponent(reference)}&select=id,booking_code,customer_name,customer_phone,ride_status,payment_method,payment_status,fare_estimate,payment_reference,payment_paid_at,driver_share_amount,kfm_commission_amount&limit=1`,
      { headers, cache: "no-store" },
    );

    if (!lookup.ok) {
      console.error("KFM ride payment verification lookup failed:", await lookup.text());
      return NextResponse.json(
        { error: "Unable to verify this ride payment." },
        { status: 502 },
      );
    }

    const rows = (await lookup.json()) as RidePaymentRecord[];
    const ride = rows[0];

    if (!ride || normalizeGhanaPhone(ride.customer_phone) !== suppliedPhone) {
      return NextResponse.json(
        { error: "We could not match this payment to your booking." },
        { status: 404 },
      );
    }

    if (String(ride.payment_method).toLowerCase() !== "paystack") {
      return NextResponse.json(
        { error: "This ride was not booked with Paystack." },
        { status: 409 },
      );
    }

    if (String(ride.ride_status).toLowerCase() !== "completed") {
      return NextResponse.json(
        { error: "This ride is not yet completed." },
        { status: 409 },
      );
    }

    if (String(ride.payment_status).toLowerCase() === "paid") {
      const split = calculateRidePaymentSplit(Number(ride.fare_estimate));
      await sendRidePaymentNotifications(ride.id);
      return NextResponse.json({
        success: true,
        already_paid: true,
        booking_code: ride.booking_code,
        payment_status: "paid",
        payment_reference: ride.payment_reference,
        payment_paid_at: ride.payment_paid_at,
        ...split,
      });
    }

    const verificationResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const verification = await verificationResponse.json();

    if (
      !verificationResponse.ok ||
      verification?.status !== true ||
      verification?.data?.status !== "success" ||
      verification?.data?.reference !== reference
    ) {
      return NextResponse.json(
        { error: "Paystack has not confirmed a successful payment yet." },
        { status: 402 },
      );
    }

    const split = calculateRidePaymentSplit(Number(ride.fare_estimate));
    const expectedAmountPesewas = Math.round(split.fareAmount * 100);
    const transaction = verification.data;

    if (
      transaction.currency !== "GHS" ||
      Number(transaction.amount) !== expectedAmountPesewas
    ) {
      console.error("KFM ride payment amount or currency mismatch:", {
        booking_code: bookingCode,
        reference,
        expectedAmountPesewas,
        receivedAmount: transaction.amount,
        receivedCurrency: transaction.currency,
      });
      return NextResponse.json(
        { error: "The payment amount or currency does not match the KFM fare." },
        { status: 409 },
      );
    }

    const paidAt =
      typeof transaction.paid_at === "string"
        ? transaction.paid_at
        : new Date().toISOString();
    const receiptNumber = `KFM-RCP-${bookingCode.replace(/^KFM-/i, "")}`;

    const update = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(ride.id)}&payment_reference=eq.${encodeURIComponent(reference)}&payment_status=eq.unpaid`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({
          payment_status: "paid",
          payment_paid_at: paidAt,
          payment_channel: transaction.channel || "paystack",
          driver_share_amount: split.driverShareAmount,
          kfm_commission_amount: split.kfmCommissionAmount,
          driver_payout_status: "pending",
          kfm_commission_status: "retained",
          payment_receipt_number: receiptNumber,
        }),
        cache: "no-store",
      },
    );

    const updatedRows = update.ok ? await update.json() : [];

    if (!update.ok) {
      console.error("KFM ride payment record update failed:", await update.text());
      return NextResponse.json(
        { error: "Payment was verified, but KFM could not update the booking record. Please contact support with your Paystack reference." },
        { status: 502 },
      );
    }

    // A concurrent webhook may have recorded the same verified payment first.
    if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
      const refreshed = await fetch(
        `${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(ride.id)}&select=payment_status,payment_paid_at,driver_share_amount,kfm_commission_amount,payment_receipt_number&limit=1`,
        { headers, cache: "no-store" },
      );
      const refreshedRows = refreshed.ok ? await refreshed.json() : [];
      const saved = refreshedRows?.[0];
      if (String(saved?.payment_status).toLowerCase() !== "paid") {
        return NextResponse.json(
          { error: "The verified payment could not be recorded. Please contact KFM." },
          { status: 502 },
        );
      }
      await sendRidePaymentNotifications(ride.id);
    } else {
      await sendRidePaymentNotifications(ride.id);
    }

    return NextResponse.json({
      success: true,
      booking_code: bookingCode,
      payment_status: "paid",
      payment_reference: reference,
      payment_paid_at: paidAt,
      payment_channel: transaction.channel || "paystack",
      payment_receipt_number: receiptNumber,
      ...split,
    });
  } catch (error) {
    console.error("KFM ride Paystack verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong while verifying the ride payment." },
      { status: 500 },
    );
  }
}
