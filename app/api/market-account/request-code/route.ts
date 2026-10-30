import { NextResponse } from "next/server";
import { createHmac, randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function emailMode() {
  const previewTest =
    process.env.VERCEL_ENV === "preview" &&
    process.env.KFM_MARKET_ACCOUNT_EMAIL_TEST_MODE === "true" &&
    Boolean(process.env.KFM_MARKET_ACCOUNT_EMAIL_TEST_TO);
  const liveEnabled =
    process.env.RESEND_DOMAIN_VERIFIED === "true" &&
    process.env.KFM_MARKET_ACCOUNT_EMAILS_ENABLED === "true";
  return previewTest ? "preview-test" : liveEnabled ? "live" : "disabled";
}

function hashCode(email: string, code: string) {
  return createHmac("sha256", serviceKey!)
    .update(`${email}:${code}`)
    .digest("hex");
}

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Seller sign-in is not configured." }, { status: 503 });
  }

  const mode = emailMode();
  if (mode === "disabled" || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return NextResponse.json(
      { error: "Seller email verification is not enabled yet." },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const accountType = body?.accountType;
    const displayName = typeof body?.displayName === "string" ? body.displayName.trim().slice(0, 120) : null;
    const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, 40) : null;

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!["vendor", "classified_seller", "vendor_and_seller"].includes(accountType)) {
      return NextResponse.json({ error: "Choose a valid seller account type." }, { status: 400 });
    }
    if (mode === "preview-test" &&
      email !== process.env.KFM_MARKET_ACCOUNT_EMAIL_TEST_TO!.trim().toLowerCase()) {
      return NextResponse.json({ error: "Preview email testing is restricted to the configured test recipient." }, { status: 403 });
    }

    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count, error: rateError } = await supabase
      .from("market_account_verification_codes")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", since);
    if (rateError) return NextResponse.json({ error: "Unable to process sign-in." }, { status: 500 });
    if ((count ?? 0) >= 3) return NextResponse.json({ message: "If verification is available, a code will be sent." });

    const now = new Date().toISOString();
    const { error: invalidateError } = await supabase
      .from("market_account_verification_codes")
      .update({ consumed_at: now })
      .eq("email", email)
      .is("consumed_at", null);
    if (invalidateError) return NextResponse.json({ error: "Unable to start verification." }, { status: 500 });

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const { data: saved, error: saveError } = await supabase
      .from("market_account_verification_codes")
      .insert({
        email,
        code_hash: hashCode(email, code),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0,
        requested_account_type: accountType,
        requested_display_name: displayName,
        requested_phone: phone,
      })
      .select("id")
      .single();
    if (saveError || !saved) return NextResponse.json({ error: "Unable to create verification code." }, { status: 500 });

    const recipient = mode === "preview-test"
      ? process.env.KFM_MARKET_ACCOUNT_EMAIL_TEST_TO!
      : email;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [recipient],
        subject: "Your NSAWAM MARKET seller sign-in code",
        text: `Your seller sign-in code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`,
        html: `<p>Your NSAWAM MARKET seller sign-in code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes.</p>`,
      }),
    });

    if (!response.ok) {
      await supabase.from("market_account_verification_codes").delete().eq("id", saved.id);
      console.error("Seller verification email provider rejected the message.");
      return NextResponse.json({ error: "Email verification is temporarily unavailable." }, { status: 503 });
    }

    return NextResponse.json({
      message: "If verification is available, a code will be sent.",
      ...(mode === "preview-test" ? { previewTestMode: true } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Unable to process seller sign-in." }, { status: 500 });
  }
}
