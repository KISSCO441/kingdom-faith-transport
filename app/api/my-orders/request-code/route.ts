
import { NextResponse } from "next/server";
import { createHmac, randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;

// Customer emails remain disabled unless explicitly enabled.
// Test mode can send only to the single configured test inbox.
const emailTestMode = process.env.KFM_MARKETPLACE_EMAIL_TEST_MODE === "true";
const customerEmailsEnabled =
  process.env.KFM_MARKETPLACE_CUSTOMER_EMAILS_ENABLED === "true";
const testRecipient =
  process.env.KFM_MARKETPLACE_EMAIL_TEST_TO?.trim().toLowerCase() || "";

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, serviceKey);

const genericMessage =
  "If orders are associated with this email, verification instructions will be sent.";

function hashCode(email: string, code: string) {
  return createHmac("sha256", serviceKey!)
    .update(`${email}:${code}`)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    // Limit requests for each email address.
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { count, error: rateLimitError } = await supabase
      .from("market_order_verification_codes")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", since);

    if (rateLimitError) {
      console.error("Verification rate-limit check failed.");
      return NextResponse.json(
        { error: "Unable to process your request right now." },
        { status: 500 },
      );
    }

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ message: genericMessage });
    }

    // Enforce the send gate before creating or sending a code.
    // Test mode is restricted to one inbox controlled by the project owner.
    if (emailTestMode) {
      if (!testRecipient || email !== testRecipient) {
        return NextResponse.json(
          { error: "Email verification is in test mode and only the configured test address can receive a code." },
          { status: 403 },
        );
      }
    } else if (!customerEmailsEnabled) {
      return NextResponse.json(
        { error: "Email verification is temporarily unavailable." },
        { status: 503 },
      );
    }

    // In test mode, allow the configured test inbox even if it has no orders.
    // In customer mode, do not reveal whether the email has existing orders.
    if (!emailTestMode) {
      const { data: existingOrder, error: orderError } = await supabase
        .from("market_orders")
        .select("id")
        .eq("customer_email", email)
        .limit(1)
        .maybeSingle();

      if (orderError) {
        console.error("Unable to check customer orders.");
        return NextResponse.json(
          { error: "Unable to process your request right now." },
          { status: 500 },
        );
      }

      if (!existingOrder) {
        return NextResponse.json({ message: genericMessage });
      }
    }

    // Do not store or log the plain-text verification code.
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const codeHash = hashCode(email, code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Invalidate any previous unused codes for this email.
    const { error: invalidateError } = await supabase
      .from("market_order_verification_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("email", email)
      .is("consumed_at", null);

    if (invalidateError) {
      console.error("Unable to invalidate previous verification codes.");
      return NextResponse.json(
        { error: "Unable to process your request right now." },
        { status: 500 },
      );
    }

    const { data: savedCode, error: saveError } = await supabase
      .from("market_order_verification_codes")
      .insert({
        email,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
      })
      .select("id")
      .single();

    if (saveError || !savedCode) {
      console.error("Unable to save verification code.");
      return NextResponse.json(
        { error: "Unable to process your request right now." },
        { status: 500 },
      );
    }

    // Email delivery requires a verified sender address in Resend.
    if (!resendApiKey || !resendFromEmail) {
      await supabase
        .from("market_order_verification_codes")
        .delete()
        .eq("id", savedCode.id);

      console.error("Resend sender configuration is missing.");
      return NextResponse.json(
        { error: "Email verification is temporarily unavailable." },
        { status: 503 },
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
        to: [email],
        subject: "Your KFM Marketplace verification code",
        text: `Your KFM Marketplace verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
        html: `<p>Your KFM Marketplace verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
      }),
    });

    if (!emailResponse.ok) {
      // Do not leave an unusable code active.
      await supabase
        .from("market_order_verification_codes")
        .delete()
        .eq("id", savedCode.id);

      console.error("Resend rejected the verification email.");
      return NextResponse.json(
        { error: "Email verification is temporarily unavailable." },
        { status: 503 },
      );
    }

    return NextResponse.json({ message: genericMessage });
  } catch {
    return NextResponse.json(
      { error: "Unable to process your request right now." },
      { status: 500 },
    );
  }
}
