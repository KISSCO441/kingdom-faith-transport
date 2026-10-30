import { NextRequest, NextResponse } from "next/server";
import { getMarketAccount } from "@/lib/market-account-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { account, supabase } = await getMarketAccount(request);
  if (!account || !supabase) {
    return NextResponse.json({ error: "Please verify your seller email and sign in first." }, { status: 401 });
  }
  if (!["vendor", "vendor_and_seller"].includes(account.account_type)) {
    return NextResponse.json({ error: "This account does not have vendor access." }, { status: 403 });
  }

  const { data: vendor, error: vendorError } = await supabase
    .from("market_vendors")
    .select("id, business_name, approval_status, business_location, admin_notes, created_at")
    .eq("account_id", account.id)
    .maybeSingle();

  if (vendorError) {
    console.error("KFM vendor dashboard lookup failed:", vendorError);
    return NextResponse.json({ error: "Unable to load your vendor account. The marketplace database setup may still be pending." }, { status: 503 });
  }
  if (!vendor) return NextResponse.json({ success: true, vendor: null, products: [] });

  const { data: products, error: productsError } = await supabase
    .from("vendor_products")
    .select("id, title, description, category, price, stock_quantity, image_urls, listing_status, admin_notes, created_at, updated_at")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("KFM vendor products lookup failed:", productsError);
    return NextResponse.json({ error: "Unable to load your product listings." }, { status: 503 });
  }

  return NextResponse.json({ success: true, vendor, products: products ?? [] });
}
