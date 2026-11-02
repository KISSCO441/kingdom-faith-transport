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


export async function DELETE(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const entity = body?.entity;
    const id = typeof body?.id === "string" ? body.id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid record." }, { status: 400 });
    }

    const storagePaths: string[] = [];
    const collectOwnedPaths = (urls: unknown, vendorId: string) => {
      if (!Array.isArray(urls)) return;
      const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL}/storage/v1/object/public/vendor-product-images/${vendorId}/`;
      for (const value of urls) {
        if (typeof value !== "string" || !value.startsWith(prefix)) continue;
        try {
          const pathname = new URL(value).pathname;
          const marker = "/storage/v1/object/public/vendor-product-images/";
          const relative = pathname.split(marker)[1];
          if (relative?.startsWith(`${vendorId}/`)) storagePaths.push(relative);
        } catch { /* Ignore malformed or non-owned photo URLs. */ }
      }
    };

    if (entity === "product") {
      const { data: product, error: readError } = await auth.supabase
        .from("vendor_products")
        .select("id, vendor_id, image_urls")
        .eq("id", id)
        .maybeSingle();
      if (readError) return NextResponse.json({ error: "Unable to verify this product." }, { status: 503 });
      if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
      collectOwnedPaths(product.image_urls, product.vendor_id);

      const { error: deleteError } = await auth.supabase.from("vendor_products").delete().eq("id", id);
      if (deleteError) {
        console.error("KFM admin product deletion failed:", deleteError);
        return NextResponse.json({ error: "Product could not be deleted. It may be referenced by protected records." }, { status: 409 });
      }
      if (storagePaths.length) {
        const { error: storageError } = await auth.supabase.storage.from("vendor-product-images").remove(storagePaths);
        if (storageError) console.error("KFM product photo cleanup failed:", storageError);
      }
      return NextResponse.json({ success: true, message: "Product listing deleted." });
    }

    if (entity === "vendor") {
      const { data: vendor, error: vendorError } = await auth.supabase
        .from("market_vendors").select("id, business_name").eq("id", id).maybeSingle();
      if (vendorError) return NextResponse.json({ error: "Unable to verify this vendor." }, { status: 503 });
      if (!vendor) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

      const { count, error: settlementError } = await auth.supabase
        .from("market_vendor_settlements").select("id", { count: "exact", head: true }).eq("vendor_id", id);
      if (settlementError) return NextResponse.json({ error: "Unable to check vendor settlement history. Deletion was not attempted." }, { status: 503 });
      if ((count ?? 0) > 0) {
        return NextResponse.json({ error: "This vendor has settlement records. Permanent deletion is blocked to protect financial history. Suspend the vendor instead." }, { status: 409 });
      }

      const { data: products, error: productsError } = await auth.supabase
        .from("vendor_products").select("image_urls").eq("vendor_id", id);
      if (productsError) return NextResponse.json({ error: "Unable to inspect vendor product photos. Deletion was not attempted." }, { status: 503 });
      for (const product of products ?? []) collectOwnedPaths(product.image_urls, id);

      const { error: deleteError } = await auth.supabase.from("market_vendors").delete().eq("id", id);
      if (deleteError) {
        console.error("KFM admin vendor deletion failed:", deleteError);
        return NextResponse.json({ error: "Vendor could not be deleted. A protected financial or historical record may reference this vendor." }, { status: 409 });
      }
      if (storagePaths.length) {
        const { error: storageError } = await auth.supabase.storage.from("vendor-product-images").remove(storagePaths);
        if (storageError) console.error("KFM vendor photo cleanup failed:", storageError);
      }
      return NextResponse.json({ success: true, message: "Vendor and product listings deleted. Seller account, classified adverts, orders, payments and settlements were not deleted." });
    }

    return NextResponse.json({ error: "Unknown record type." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid deletion request." }, { status: 400 });
  }
}
