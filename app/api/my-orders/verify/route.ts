
import { NextResponse } from "next/server";
import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, serviceKey);

function hashCode(email: string, code: string) {
  return createHmac("sha256", serviceKey!)
    .update(`${email}:${code}`)
    .digest("hex");
}

function hashSession(token: string) {
  return createHmac("sha256", serviceKey!)
    .update(token)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const code =
      typeof body?.code === "string"
        ? body.code.trim()
        : "";

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\d{6}$/.test(code)
    ) {
      return NextResponse.json(
        { error: "Enter a valid email and six-digit code." },
        { status: 400 }
      );
    }

    const { data: verification, error: lookupError } =
      await supabase
        .from("market_order_verification_codes")
        .select("id, code_hash, expires_at, attempts, consumed_at")
        .eq("email", email)
        .is("consumed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { error: "Verification is temporarily unavailable." },
        { status: 500 }
      );
    }

    if (
      !verification ||
      verification.consumed_at ||
      new Date(verification.expires_at).getTime() <= Date.now() ||
      verification.attempts >= 5
    ) {
      return NextResponse.json(
        { error: "The code is invalid or expired. Request a new code." },
        { status: 400 }
      );
    }

    const submittedHash = Buffer.from(hashCode(email, code), "hex");
    const storedHash = Buffer.from(verification.code_hash, "hex");

    const matches =
      submittedHash.length === storedHash.length &&
      timingSafeEqual(submittedHash, storedHash);

    if (!matches) {
      const { error: attemptError } = await supabase
        .from("market_order_verification_codes")
        .update({ attempts: verification.attempts + 1 })
        .eq("id", verification.id);

      if (attemptError) {
        return NextResponse.json(
          { error: "Verification is temporarily unavailable." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Incorrect code. Please try again." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data: consumed, error: consumeError } = await supabase
      .from("market_order_verification_codes")
      .update({ consumed_at: now })
      .eq("id", verification.id)
      .is("consumed_at", null)
      .select("id")
      .maybeSingle();

    if (consumeError || !consumed) {
      return NextResponse.json(
        { error: "This code has already been used. Request a new code." },
        { status: 400 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    const { error: sessionError } = await supabase
      .from("market_order_sessions")
      .insert({
        email,
        token_hash: hashSession(token),
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      return NextResponse.json(
        { error: "Could not create your session. Please try again." },
        { status: 500 }
      );
    }

    const { data: orders, error: ordersError } = await supabase
      .from("market_orders")
      .select(
        "id, order_number, total_amount, payment_status, order_status, created_at"
      )
      .eq("customer_email", email)
      .order("created_at", { ascending: false });

    if (ordersError) {
      await supabase
        .from("market_order_sessions")
        .update({ revoked_at: now })
        .eq("token_hash", hashSession(token));

      return NextResponse.json(
        { error: "Could not load your orders. Please try again." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      orders: orders ?? [],
    });

    response.cookies.set("kfm_market_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Verification is temporarily unavailable." },
      { status: 500 }
    );
  }
}
