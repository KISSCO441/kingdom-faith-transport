import { NextRequest, NextResponse } from "next/server";
import { requireKfmAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;

  const [{ data: vendors, error: vendorsError }, { data: products, error: productsError }] = await Promise.all([
    auth.supabase
      .from("market_vendors")
      .select("id, account_id, business_name, contact_name, contact_phone, business_location, business_description, approval_status, admin_notes, created_at, reviewed_at")
      .order("created_at", { ascending: false }),
    auth.supabase
      .from("vendor_products")
      .select("id, vendor_id, title, description, category, price, stock_quantity, listing_status, admin_notes, created_at, reviewed_at, market_vendors!inner(business_name, approval_status)")
      .order("created_at", { ascending: false }),
  ]);

  if (vendorsError || productsError) {
    console.error("KFM marketplace moderation load failed:", vendorsError || productsError);
    return NextResponse.json({ error: "Unable to load marketplace review records. Confirm the marketplace database migration has been applied." }, { status: 503 });
  }

  return NextResponse.json({ success: true, vendors: vendors ?? [], products: products ?? [] });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const entity = body?.entity;
    const id = typeof body?.id === "string" ? body.id : "";
    const status = typeof body?.status === "string" ? body.status : "";
    const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 1000) : "";

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid review record." }, { status: 400 });
    }

    if (entity === "vendor") {
      if (!["approved", "rejected", "suspended"].includes(status)) {
        return NextResponse.json({ error: "Invalid vendor decision." }, { status: 400 });
      }
      const { data, error } = await auth.supabase
        .from("market_vendors")
        .update({ approval_status: status, admin_notes: notes || null, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, business_name, approval_status, admin_notes, reviewed_at")
        .maybeSingle();

      if (error) {
        console.error("KFM vendor moderation failed:", error);
        return NextResponse.json({ error: "Unable to update this vendor. Check that the marketplace migration is applied." }, { status: 503 });
      }
      if (!data) return NextResponse.json({ error: "Vendor application not found." }, { status: 404 });
      return NextResponse.json({ success: true, record: data });
    }

    if (entity === "product") {
      if (!["approved", "rejected", "paused"].includes(status)) {
        return NextResponse.json({ error: "Invalid product decision." }, { status: 400 });
      }

      if (status === "approved") {
        const { data: product, error: productError } = await auth.supabase
          .from("vendor_products")
          .select("id, vendor_id")
          .eq("id", id)
          .maybeSingle();
        if (productError) return NextResponse.json({ error: "Unable to verify product ownership." }, { status: 503 });
        if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

        const { data: vendor, error: vendorError } = await auth.supabase
          .from("market_vendors")
          .select("approval_status")
          .eq("id", product.vendor_id)
          .maybeSingle();
        if (vendorError) return NextResponse.json({ error: "Unable to verify vendor approval." }, { status: 503 });
        if (vendor?.approval_status !== "approved") {
          return NextResponse.json({ error: "Approve the vendor before approving this product." }, { status: 409 });
        }
      }

      const { data, error } = await auth.supabase
        .from("vendor_products")
        .update({ listing_status: status, admin_notes: notes || null, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, title, listing_status, admin_notes, reviewed_at")
        .maybeSingle();

      if (error) {
        console.error("KFM product moderation failed:", error);
        return NextResponse.json({ error: "Unable to update this product." }, { status: 503 });
      }
      if (!data) return NextResponse.json({ error: "Product not found." }, { status: 404 });
      return NextResponse.json({ success: true, record: data });
    }

    return NextResponse.json({ error: "Unknown moderation record type." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 });
  }
}
