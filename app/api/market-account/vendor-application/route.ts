import { NextRequest, NextResponse } from "next/server";
import { getMarketAccount } from "@/lib/market-account-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { account, supabase } = await getMarketAccount(request);
  if (!account || !supabase) {
    return NextResponse.json({ error: "Please verify your seller email and sign in first." }, { status: 401 });
  }
  if (!["vendor", "vendor_and_seller"].includes(account.account_type)) {
    return NextResponse.json({ error: "This account is not enabled for vendor registration. Sign in with a vendor account." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const businessName = typeof body?.businessName === "string" ? body.businessName.trim() : "";
    const contactName = typeof body?.contactName === "string" ? body.contactName.trim() : "";
    const contactPhone = typeof body?.contactPhone === "string" ? body.contactPhone.trim() : "";
    const businessLocation = typeof body?.businessLocation === "string" ? body.businessLocation.trim() : "";
    const businessDescription = typeof body?.businessDescription === "string" ? body.businessDescription.trim() : "";

    if (!businessName || businessName.length > 140 ||
        !contactName || contactName.length > 120 ||
        !contactPhone || contactPhone.length > 40 ||
        !businessLocation || businessLocation.length > 180 ||
        businessDescription.length > 1500) {
      return NextResponse.json({ error: "Complete the required fields and keep the details within the stated limits." }, { status: 400 });
    }

    const { data: existing, error: lookupError } = await supabase
      .from("market_vendors")
      .select("id, approval_status")
      .eq("account_id", account.id)
      .maybeSingle();
    if (lookupError) return NextResponse.json({ error: "Unable to check your vendor application." }, { status: 500 });
    if (existing) {
      return NextResponse.json({
        error: "A vendor application already exists for this account.",
        status: existing.approval_status,
      }, { status: 409 });
    }

    const { data: vendor, error: insertError } = await supabase
      .from("market_vendors")
      .insert({
        account_id: account.id,
        business_name: businessName,
        contact_name: contactName,
        contact_phone: contactPhone,
        business_location: businessLocation,
        business_description: businessDescription || null,
        approval_status: "pending",
      })
      .select("id, business_name, approval_status, created_at")
      .single();

    if (insertError || !vendor) {
      return NextResponse.json({ error: "Your vendor application could not be saved." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Your vendor application has been submitted for KFM review.",
      application: vendor,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to submit your vendor application." }, { status: 400 });
  }
}
