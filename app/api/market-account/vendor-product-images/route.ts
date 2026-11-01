import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getMarketAccount } from "@/lib/market-account-auth";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

export async function POST(request: NextRequest) {
  const { account, supabase } = await getMarketAccount(request);
  if (!account || !supabase) return NextResponse.json({ error: "Please sign in to your seller account." }, { status: 401 });
  if (!["vendor", "vendor_and_seller"].includes(account.account_type)) return NextResponse.json({ error: "This account does not have vendor access." }, { status: 403 });
  try {
    const { data: vendor, error: vendorError } = await supabase.from("market_vendors").select("id, approval_status").eq("account_id", account.id).maybeSingle();
    if (vendorError) return NextResponse.json({ error: "Unable to verify your vendor account." }, { status: 503 });
    if (!vendor || vendor.approval_status !== "approved") return NextResponse.json({ error: "Only approved vendors can upload product photos." }, { status: 403 });
    const form = await request.formData();
    const files = form.getAll("files").filter((item): item is File => item instanceof File);
    if (!files.length || files.length > MAX_FILES) return NextResponse.json({ error: "Choose between one and five product photos." }, { status: 400 });
    if (files.some(file => !ALLOWED_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_FILE_SIZE)) return NextResponse.json({ error: "Each photo must be JPEG, PNG or WebP and no larger than 5 MB." }, { status: 400 });
    const imageUrls: string[] = [];
    for (const file of files) {
      const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
      const path = vendor.id + "/" + randomUUID() + "." + extension;
      const { error: uploadError } = await supabase.storage.from("vendor-product-images").upload(path, new Uint8Array(await file.arrayBuffer()), { contentType: file.type, upsert: false });
      if (uploadError) { console.error("KFM product photo upload failed:", uploadError); return NextResponse.json({ error: "A product photo could not be uploaded. Please try again." }, { status: 503 }); }
      const { data } = supabase.storage.from("vendor-product-images").getPublicUrl(path);
      imageUrls.push(data.publicUrl);
    }
    return NextResponse.json({ success: true, imageUrls });
  } catch (error) {
    console.error("KFM product photo request failed:", error);
    return NextResponse.json({ error: "Unable to process product photos." }, { status: 400 });
  }
}