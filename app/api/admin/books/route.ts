import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireKfmAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;
  const { data, error } = await auth.supabase
    .from("kfm_books")
    .select("id,title,author,description,price,cover_url,is_published,created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("KFM books list query failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json({
      error: "Unable to load books.",
      diagnostic: {
        code: error.code ?? null,
        message: error.message,
        details: error.details ?? null,
        hint: error.hint ?? null,
      },
    }, { status: 500 });
  }
  return NextResponse.json({ books: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const form = await request.formData();
    const title = String(form.get("title") || "").trim();
    const author = String(form.get("author") || "Apostle K. F. Kisseh").trim();
    const description = String(form.get("description") || "").trim();
    const price = Number(form.get("price"));
    const pdf = form.get("pdf");
    const cover = form.get("cover");

    if (!title || title.length > 180 || !description || description.length > 5000 ||
        !Number.isFinite(price) || price <= 0 || !(pdf instanceof File) ||
        pdf.type !== "application/pdf" || pdf.size < 1 || pdf.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Enter a title, description and valid price, and upload a PDF up to 50MB." }, { status: 400 });
    }
    if (cover && (!(cover instanceof File) || !["image/jpeg","image/png","image/webp"].includes(cover.type) || cover.size > 5 * 1024 * 1024)) {
      return NextResponse.json({ error: "Cover image must be JPG, PNG or WebP and no larger than 5MB." }, { status: 400 });
    }

    const slug = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150) + "-" + randomUUID().slice(0, 8);
    const pdfPath = `${slug}/book.pdf`;
    const pdfBytes = Buffer.from(await pdf.arrayBuffer());
    const { error: pdfError } = await auth.supabase.storage.from("kfm-digital-books").upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: false });
    if (pdfError) {
      console.error("KFM book PDF upload failed:", pdfError.message);
      return NextResponse.json({ error: "Could not upload the PDF.", diagnostic: { message: pdfError.message, name: pdfError.name } }, { status: 500 });
    }

    let coverUrl: string | null = null;
    if (cover instanceof File && cover.size > 0) {
      const extension = cover.type === "image/png" ? "png" : cover.type === "image/webp" ? "webp" : "jpg";
      const coverPath = `${slug}/cover.${extension}`;
      const { error: coverError } = await auth.supabase.storage.from("kfm-book-covers").upload(coverPath, Buffer.from(await cover.arrayBuffer()), { contentType: cover.type, upsert: false });
      if (coverError) {
        await auth.supabase.storage.from("kfm-digital-books").remove([pdfPath]);
        return NextResponse.json({ error: "Could not upload the cover image.", diagnostic: { message: coverError.message, name: coverError.name } }, { status: 500 });
      }
      coverUrl = auth.supabase.storage.from("kfm-book-covers").getPublicUrl(coverPath).data.publicUrl;
    }

    const { data: book, error } = await auth.supabase.from("kfm_books").insert({
      title, slug, author, description, price: Math.round(price * 100) / 100,
      cover_url: coverUrl, file_path: pdfPath, is_published: true,
    }).select("id,title,author,description,price,cover_url,is_published,created_at").single();

    if (error || !book) {
      await auth.supabase.storage.from("kfm-digital-books").remove([pdfPath]);
      if (coverUrl) {
        const extension = coverUrl.split(".").pop()?.split("?")[0] || "jpg";
        await auth.supabase.storage.from("kfm-book-covers").remove([`${slug}/cover.${extension}`]);
      }
      console.error("KFM book record creation failed:", error?.message);
      return NextResponse.json({ error: "The book could not be saved.", diagnostic: { code: error?.code ?? null, message: error?.message ?? "No book record was returned.", details: error?.details ?? null, hint: error?.hint ?? null } }, { status: 500 });
    }
    return NextResponse.json({ book });
  } catch (error) {
    console.error("KFM book upload error:", error);
    return NextResponse.json({ error: "Unable to save this book.", diagnostic: { message: error instanceof Error ? error.message : String(error) } }, { status: 500 });
  }
}
