import { NextResponse } from "next/server"
import { sendRidePaymentReceiptEmail } from "@/lib/ride-receipt-email"

const PAYSTACK_API_URL = "https://api.paystack.co"

export async function GET(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        {
          status: false,
          message: "Paystack secret key is not configured.",
        },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json(
        {
          status: false,
          message: "Payment reference is required.",
        },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    )

    const data = await response.json()

    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          status: false,
          message:
            data?.message || "Unable to verify Paystack transaction.",
        },
        { status: response.status || 400 }
      )
    }

    const transaction = data.data

    if (transaction.status !== "success") {
      return NextResponse.json({
        status: false,
        message: "Payment has not been completed.",
        data: {
          reference: transaction.reference,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
        },
      })
    }

    if (transaction.currency !== "GHS") {
      return NextResponse.json(
        {
          status: false,
          message: "Payment currency could not be verified.",
        },
        { status: 400 }
      )
    }

    const rideBookingCode = transaction?.metadata?.kfm_ride_booking_code;
    if (typeof rideBookingCode === "string" && rideBookingCode.trim()) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ status: false, message: "Ride payment recording is not configured." }, { status: 500 });
      }
      const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
      const lookup = await fetch(
        `${supabaseUrl}/rest/v1/ride_requests?booking_code=eq.${encodeURIComponent(rideBookingCode)}&select=id,booking_code,customer_name,customer_email,pickup_town,pickup_area,destination_town,destination_area,ride_status,payment_method,payment_status,fare_estimate&limit=1`,
        { headers, cache: "no-store" },
      );
      if (!lookup.ok) return NextResponse.json({ status: false, message: "Unable to load the ride payment record." }, { status: 500 });
      const rides = await lookup.json();
      const ride = Array.isArray(rides) ? rides[0] : null;
      if (!ride || String(ride.payment_method).toLowerCase() !== "paystack") {
        return NextResponse.json({ status: false, message: "This Paystack transaction is not linked to a valid KFM ride." }, { status: 400 });
      }
      if (String(ride.ride_status).toLowerCase() !== "completed") {
        return NextResponse.json({ status: false, message: "The ride must be completed before its fare can be recorded as paid." }, { status: 409 });
      }
      const expectedAmount = Math.round(Number(ride.fare_estimate) * 100);
      if (!Number.isFinite(expectedAmount) || expectedAmount <= 0 || transaction.amount !== expectedAmount) {
        return NextResponse.json({ status: false, message: "Payment amount does not match the KFM ride fare." }, { status: 400 });
      }
      if (String(ride.payment_status).toLowerCase() !== "paid") {
        const paidAt = transaction.paid_at || new Date().toISOString();
        const update = await fetch(
          `${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(ride.id)}&payment_status=eq.unpaid&payment_method=eq.paystack`,
          {
            method: "PATCH",
            headers: { ...headers, Prefer: "return=representation" },
            body: JSON.stringify({ payment_status: "paid", payment_reference: transaction.reference, payment_paid_at: paidAt }),
            cache: "no-store",
          },
        );
        const updatedRows = update.ok ? await update.json() : [];
        if (!update.ok || !Array.isArray(updatedRows) || updatedRows.length === 0) {
          return NextResponse.json({ status: false, message: "Payment was verified but the ride record could not be updated. Please contact KFM." }, { status: 500 });
        }
        await sendRidePaymentReceiptEmail({ ...ride, payment_method: "paystack", payment_reference: transaction.reference, payment_paid_at: paidAt });
      }
    }

    return NextResponse.json({
      status: true,
      message: "Payment verified successfully.",
      data: {
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        paidAt: transaction.paid_at,
        channel: transaction.channel,
        customer: transaction.customer,
        metadata: transaction.metadata,
      },
    })
  } catch (error) {
    console.error("Paystack verification error:", error)

    return NextResponse.json(
      {
        status: false,
        message: "An unexpected payment verification error occurred.",
      },
      { status: 500 }
    )
  }
}
