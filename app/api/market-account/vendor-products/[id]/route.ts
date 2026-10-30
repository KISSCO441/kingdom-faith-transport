import { NextRequest, NextResponse } from "next/server";
import { getMarketAccount } from "@/lib/market-account-auth";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { account, supabase } = await getMarketAccount(request);
  if (!account || !supabase) return NextResponse.json({ error: "Please sign in to your seller account." }, { status: 401 });
  if (!["vendor", "vendor_and_seller"].includes(account.account_type)) {
    return NextResponse.json({ error: "This account does not have vendor access." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid product listing." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const category = typeof body?.category === "string" ? body.category.trim() : "";
    const price = Number(body?.price);
    const stockQuantity = Number(body?.stockQuantity);

    if (!title || title.length > 140 || !description || description.length > 3000 ||
        !category || category.length > 80 || !Number.isFinite(price) || price <= 0 ||
        price > 10000000 || !Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 1000000) {
      return NextResponse.json({ error: "Check the product details, price and stock quantity." }, { status: 400 });
    }

    const { data: vendor, error: vendorError } = await supabase
      .from("market_vendors")
      .select("id, approval_status")
      .eq("account_id", account.id)
      .maybeSingle();

    if (vendorError) return NextResponse.json({ error: "Unable to verify your vendor account." }, { status: 503 });
    if (!vendor || vendor.approval_status !== "approved") {
      return NextResponse.json({ error: "Only approved vendors can edit product listings." }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from("vendor_products")
      .update({
        title,
        description,
        category,
        price: Math.round(price * 100) / 100,
        stock_quantity: stockQuantity,
        listing_status: "pending_review",
        reviewed_at: null,
        admin_notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("vendor_id", vendor.id)
      .select("id, title, category, price, stock_quantity, listing_status, updated_at")
      .maybeSingle();

    if (error) {
      console.error("KFM vendor product update failed:", error);
      return NextResponse.json({ error: "Unable to update this product listing." }, { status: 503 });
    }
    if (!updated) return NextResponse.json({ error: "Product not found in your vendor account." }, { status: 404 });

    return NextResponse.json({ success: true, product: updated, message: "Changes submitted for KFM review." });
  } catch {
    return NextResponse.json({ error: "Invalid product update." }, { status: 400 });
  }
}
