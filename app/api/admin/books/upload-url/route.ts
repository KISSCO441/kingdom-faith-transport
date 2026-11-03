import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireKfmAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const size = Number(body.size);
    if (body.contentType !== "application/pdf" || !Number.isFinite(size) || size < 1 || size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Choose a valid PDF no larger than 50MB." }, { status: 400 });
    }
    const path = `admin-uploads/${randomUUID()}.pdf`;
    const { data, error } = await auth.supabase.storage.from("kfm-digital-books").createSignedUploadUrl(path, { upsert: false });
    if (error || !data) {
      console.error("KFM signed book upload URL failed:", error?.message);
      return NextResponse.json({ error: "Could not prepare the secure PDF upload." }, { status: 500 });
    }
    return NextResponse.json({ path: data.path, token: data.token });
  } catch (error) {
    return NextResponse.json({ error: "Could not prepare the secure PDF upload.", diagnostic: { message: error instanceof Error ? error.message : String(error) } }, { status: 500 });
  }
}
