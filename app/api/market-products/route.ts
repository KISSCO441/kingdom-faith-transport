import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Marketplace products are temporarily unavailable." }, { status: 503 });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("vendor_products")
    .select("id, title, description, category, item_condition, price, stock_quantity, image_urls, market_vendors!inner(business_name, contact_phone, business_location, approval_status)")
    .eq("listing_status", "approved")
    .eq("market_vendors.approval_status", "approved")
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("KFM public vendor product load failed:", error);
    return NextResponse.json({ error: "Unable to load approved marketplace products." }, { status: 503 });
  }

  const products = (data ?? []).map((product: any) => {
    const vendor = Array.isArray(product.market_vendors)
      ? product.market_vendors[0]
      : product.market_vendors;

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      item_condition: product.item_condition,
      price: Number(product.price),
      stock_quantity: product.stock_quantity,
      image_urls: product.image_urls ?? [],
      vendor_name: vendor?.business_name ?? "",
      vendor_phone: vendor?.contact_phone ?? "",
      vendor_location: vendor?.business_location ?? "",
    };
  });

  return NextResponse.json({ success: true, products }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
