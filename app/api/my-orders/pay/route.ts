
import { NextResponse } from "next/server";
import {
  createHmac,
  randomBytes,
} from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

if (!supabaseUrl || !serviceKey || !paystackSecretKey) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(supabaseUrl, serviceKey);

function hashSession(token: string) {
  return createHmac("sha256", serviceKey!)
    .update(token)
    .digest("hex");
}

function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) return null;

  const sessionCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("kfm_market_session="));

  if (!sessionCookie) return null;

  const token = sessionCookie.slice(
    "kfm_market_session=".length,
  );

  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export async function POST(request: Request) {
  try {
    const token = getSessionToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Please verify your email to access your orders." },
        { status: 401 },
      );
    }

    const tokenHash = hashSession(token);
    const now = new Date().toISOString();

    // STEP 1: Validate the customer's verified session.
    const { data: session, error: sessionError } = await supabase
      .from("market_order_sessions")
      .select("id, email, expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .gt("expires_at", now)
      .maybeSingle();

    if (sessionError) {
      console.error("KFM My Orders session lookup failed.");

      return NextResponse.json(
        { error: "Unable to validate your session. Please try again." },
        { status: 500 },
      );
    }

    if (!session) {
      const response = NextResponse.json(
        { error: "Your session has expired. Please verify your email again." },
        { status: 401 },
      );

      response.cookies.set("kfm_market_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    // STEP 2: Accept only an existing order ID.
    const body = await request.json();
    const orderId =
      typeof body?.orderId === "string" ? body.orderId.trim() : "";

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        orderId,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid order." },
        { status: 400 },
      );
    }

    // STEP 3: Ensure this order belongs to the verified customer.
    const { data: order, error: orderError } = await supabase
      .from("market_orders")
      .select(
        "id, order_number, customer_email, customer_name, customer_phone, delivery_location, total_amount, payment_status",
      )
      .eq("id", orderId)
      .eq("customer_email", session.email)
      .maybeSingle();

    if (orderError) {
      console.error("KFM My Orders order lookup failed.");

      return NextResponse.json(
        { error: "Unable to load this order. Please try again." },
        { status: 500 },
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 },
      );
    }

    if (order.payment_status === "PAID") {
      return NextResponse.json(
        { error: "This order has already been paid." },
        { status: 409 },
      );
    }

    if (order.payment_status !== "PENDING") {
      return NextResponse.json(
        { error: "This order is not available for payment." },
        { status: 409 },
      );
    }

    // STEP 4: Use only the total stored in the database.
    const totalAmount = Number(order.total_amount);
    const amountInPesewas = Math.round(totalAmount * 100);

    if (
      !Number.isSafeInteger(amountInPesewas) ||
      amountInPesewas <= 0 ||
      Math.abs(totalAmount * 100 - amountInPesewas) > 0.000001
    ) {
      return NextResponse.json(
        { error: "The saved order amount is invalid." },
        { status: 400 },
      );
    }

    // A fresh reference allows another payment attempt without
    // creating another market order.
    const paymentReference =
      `${order.order_number}-R-${randomBytes(8).toString("hex")}`;

    // Save the reference before initialization so the existing
    // webhook can locate the order after a successful payment.
    const { data: referenceUpdate, error: referenceError } =
      await supabase
        .from("market_orders")
        .update({
          payment_reference: paymentReference,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("payment_status", "PENDING")
        .select("id")
        .maybeSingle();

    if (referenceError || !referenceUpdate) {
      console.error("KFM My Orders reference update failed.");

      return NextResponse.json(
        { error: "Unable to prepare payment. Please try again." },
        { status: 500 },
      );
    }

    // STEP 5: Initialize Paystack for the existing order.
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.email,
          amount: amountInPesewas,
          currency: "GHS",
          reference: paymentReference,
          metadata: {
            kfm_order_id: order.id,
            kfm_order_number: order.order_number,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            delivery_location: order.delivery_location,
            payment_attempt: "my_orders",
          },
        }),
        cache: "no-store",
      },
    );

    const paystackData = await paystackResponse.json();

    if (
      !paystackResponse.ok ||
      paystackData?.status !== true ||
      typeof paystackData?.data?.authorization_url !== "string" ||
      paystackData?.data?.reference !== paymentReference
    ) {
      console.error(
        "KFM My Orders Paystack initialization failed:",
        paystackData?.message || "Invalid Paystack response",
      );

      return NextResponse.json(
        { error: "Unable to start payment. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      paymentUrl: paystackData.data.authorization_url,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to start payment. Please try again." },
      { status: 500 },
    );
  }
}
