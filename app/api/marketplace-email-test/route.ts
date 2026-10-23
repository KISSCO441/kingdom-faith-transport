import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { sendMarketPaymentConfirmation } from "@/lib/market-order-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function matchesSecret(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  // This endpoint must never run in production.
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (
    process.env.KFM_MARKETPLACE_EMAIL_TEST_MODE !== "true" ||
    !matchesSecret(
      request.headers.get("x-kfm-email-test-secret"),
      process.env.KFM_MARKETPLACE_EMAIL_TEST_SECRET,
    )
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Preview database configuration is missing." },
      { status: 500 },
    );
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Restrict the test to this known, already-paid test order.
    const { data: order, error } = await supabase
      .from("market_orders")
      .select("id, order_number")
      .eq("order_number", "KFM-MKT-853012")
      .eq("payment_status", "PAID")
      .maybeSingle();

    if (error || !order) {
      console.error("KFM email test order lookup failed:", error);
      return NextResponse.json(
        { error: "The specified paid test order could not be found." },
        { status: 404 },
      );
    }

    const result = await sendMarketPaymentConfirmation(order.id);

    if (!result.sent) {
      return NextResponse.json(
        { success: false, reason: result.reason },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Preview test email accepted by Resend.",
      orderNumber: order.order_number,
      recipient: "11thaprilconsult@gmail.com",
    });
  } catch (error) {
    console.error("KFM Marketplace preview email test failed:", error);
    return NextResponse.json(
      { error: "Unable to send the preview test email." },
      { status: 500 },
    );
  }
}
