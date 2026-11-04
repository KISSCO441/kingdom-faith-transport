import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireKfmAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const MAX_PDF_SIZE = 50 * 1024 * 1024;
const MAX_COVER_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const kind = body.kind === "cover" ? "cover" : "pdf";
    const size = Number(body.size);

    if (kind === "pdf") {
      if (body.contentType !== "application/pdf" || !Number.isFinite(size) || size < 1 || size > MAX_PDF_SIZE) {
        return NextResponse.json({ error: "Choose a valid PDF no larger than 50MB." }, { status: 400 });
      }
      const path = `admin-uploads/${randomUUID()}.pdf`;
      const { data, error } = await auth.supabase.storage.from("kfm-digital-books").createSignedUploadUrl(path, { upsert: false });
      if (error || !data) {
        console.error("KFM signed book upload URL failed:", error?.message);
        return NextResponse.json({ error: "Could not prepare the secure PDF upload." }, { status: 500 });
      }
      return NextResponse.json({ kind, path: data.path, token: data.token });
    }

    const allowedTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const extension = allowedTypes[String(body.contentType || "")];
    if (!extension || !Number.isFinite(size) || size < 1 || size > MAX_COVER_SIZE) {
      return NextResponse.json({ error: "Cover image must be JPG, PNG or WebP and no larger than 5MB." }, { status: 400 });
    }

    const path = `admin-uploads/${randomUUID()}.${extension}`;
    const { data, error } = await auth.supabase.storage.from("kfm-book-covers").createSignedUploadUrl(path, { upsert: false });
    if (error || !data) {
      console.error("KFM signed book cover upload URL failed:", error?.message);
      return NextResponse.json({ error: "Could not prepare the secure cover image upload." }, { status: 500 });
    }
    return NextResponse.json({ kind, path: data.path, token: data.token });
  } catch (error) {
    return NextResponse.json({
      error: "Could not prepare the secure book upload.",
      diagnostic: { message: error instanceof Error ? error.message : String(error) },
    }, { status: 500 });
  }
}
