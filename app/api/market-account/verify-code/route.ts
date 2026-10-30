import { NextResponse } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function hash(value: string) {
  return createHmac("sha256", serviceKey!).update(value).digest("hex");
}

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Seller sign-in is not configured." }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter a valid email and six-digit code." }, { status: 400 });
    }

    const { data: verification, error } = await supabase
      .from("market_account_verification_codes")
      .select("id, code_hash, expires_at, attempts")
      .eq("email", email)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return NextResponse.json({ error: "Verification is temporarily unavailable." }, { status: 500 });
    if (!verification || new Date(verification.expires_at).getTime() <= Date.now() || verification.attempts >= 5) {
      return NextResponse.json({ error: "The code is invalid or expired. Request another code." }, { status: 400 });
    }

    const submitted = Buffer.from(hash(`${email}:${code}`), "hex");
    const stored = Buffer.from(verification.code_hash, "hex");
    const matches = submitted.length === stored.length && timingSafeEqual(submitted, stored);
    if (!matches) {
      const { error: attemptError } = await supabase
        .from("market_account_verification_codes")
        .update({ attempts: verification.attempts + 1 })
        .eq("id", verification.id);
      if (attemptError) return NextResponse.json({ error: "Verification is temporarily unavailable." }, { status: 500 });
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: consumed, error: consumeError } = await supabase
      .from("market_account_verification_codes")
      .update({ consumed_at: now })
      .eq("id", verification.id)
      .is("consumed_at", null)
      .select("id")
      .maybeSingle();
    if (consumeError || !consumed) return NextResponse.json({ error: "This code has already been used." }, { status: 400 });

    const { data: account, error: accountError } = await supabase
      .from("market_accounts")
      .update({ email_verified_at: now, updated_at: now })
      .eq("email", email)
      .select("id, account_type, display_name, email")
      .single();
    if (accountError || !account) return NextResponse.json({ error: "Seller account could not be found." }, { status: 404 });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    const { error: sessionError } = await supabase.from("market_account_sessions").insert({
      account_id: account.id,
      token_hash: hash(token),
      expires_at: expiresAt,
    });
    if (sessionError) return NextResponse.json({ error: "Could not create seller session." }, { status: 500 });

    const response = NextResponse.json({
      success: true,
      account: {
        id: account.id,
        email: account.email,
        accountType: account.account_type,
        displayName: account.display_name,
      },
    });
    response.cookies.set("kfm_market_account_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Verification is temporarily unavailable." }, { status: 500 });
  }
}
