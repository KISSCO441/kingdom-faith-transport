import { NextRequest, NextResponse } from "next/server";
import { getMarketAccount } from "@/lib/market-account-auth";

export const runtime = "nodejs";

function validateProduct(body: any) {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const price = Number(body?.price);
  const stockQuantity = Number(body?.stockQuantity);

  if (!title || title.length > 140 ||
      !description || description.length > 3000 ||
      !category || category.length > 80 ||
      !Number.isFinite(price) || price <= 0 || price > 10000000 ||
      !Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 1000000) {
    return null;
  }

  return { title, description, category, price: Math.round(price * 100) / 100, stock_quantity: stockQuantity };
}

export async function POST(request: NextRequest) {
  const { account, supabase } = await getMarketAccount(request);
  if (!account || !supabase) return NextResponse.json({ error: "Please sign in to your seller account." }, { status: 401 });
  if (!["vendor", "vendor_and_seller"].includes(account.account_type)) {
    return NextResponse.json({ error: "This account does not have vendor access." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const product = validateProduct(body);
    if (!product) return NextResponse.json({ error: "Check the product details, price and stock quantity." }, { status: 400 });

    const { data: vendor, error: vendorError } = await supabase
      .from("market_vendors")
      .select("id, approval_status")
      .eq("account_id", account.id)
      .maybeSingle();

    if (vendorError) return NextResponse.json({ error: "Unable to verify your vendor application." }, { status: 503 });
    if (!vendor) return NextResponse.json({ error: "Submit your vendor application before listing products." }, { status: 409 });
    if (vendor.approval_status !== "approved") {
      return NextResponse.json({ error: "Product listing is available after KFM approves your vendor application." }, { status: 403 });
    }

    const { data: created, error } = await supabase
      .from("vendor_products")
      .insert({ vendor_id: vendor.id, ...product, image_urls: [], listing_status: "pending_review" })
      .select("id, title, category, price, stock_quantity, listing_status, created_at")
      .single();

    if (error || !created) {
      console.error("KFM vendor product creation failed:", error);
      return NextResponse.json({ error: "Unable to save this product listing." }, { status: 503 });
    }

    return NextResponse.json({ success: true, product: created, message: "Product submitted for KFM review. It will not appear for customers until approved." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid product submission." }, { status: 400 });
  }
}
