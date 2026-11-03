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
    const pdfPath = String(form.get("pdfPath") || "").trim();
    const cover = form.get("cover");

    if (!title || title.length > 180 || !description || description.length > 5000 ||
        !Number.isFinite(price) || price <= 0 || !/^admin-uploads\\/[a-f0-9-]+\\.pdf$/i.test(pdfPath)) {
      return NextResponse.json({ error: "Enter a title, description and valid price, and upload a PDF up to 50MB." }, { status: 400 });
    }
    const pdfFolder = pdfPath.slice(0, pdfPath.lastIndexOf("/"));
    const pdfName = pdfPath.slice(pdfPath.lastIndexOf("/") + 1);
    const { data: uploadedFiles, error: fileLookupError } = await auth.supabase.storage.from("kfm-digital-books").list(pdfFolder, { search: pdfName });
    const uploadedPdf = uploadedFiles?.find((file) => file.name === pdfName);
    if (fileLookupError || !uploadedPdf || uploadedPdf.metadata?.mimetype !== "application/pdf" ||
        Number(uploadedPdf.metadata?.size || 0) < 1 || Number(uploadedPdf.metadata?.size || 0) > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "The uploaded PDF could not be verified. Please upload it again." }, { status: 400 });
    }
    if (cover && (!(cover instanceof File) || !["image/jpeg","image/png","image/webp"].includes(cover.type) || cover.size > 5 * 1024 * 1024)) {
      return NextResponse.json({ error: "Cover image must be JPG, PNG or WebP and no larger than 5MB." }, { status: 400 });
    }

    const slug = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150) + "-" + randomUUID().slice(0, 8);
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

export async function PUT(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const form = await request.formData();
    const bookId = String(form.get("bookId") || "").trim();
    const body = await request.json();
    const pdfPath = String(body.pdfPath || "").trim();
    if (!bookId || !/^admin-uploads\\/[a-f0-9-]+\\.pdf$/i.test(pdfPath)) {
      return NextResponse.json({ error: "Choose the correct readable PDF file (maximum 50MB)." }, { status: 400 });
    }
    const pdfFolder = pdfPath.slice(0, pdfPath.lastIndexOf("/"));
    const pdfName = pdfPath.slice(pdfPath.lastIndexOf("/") + 1);
    const { data: uploadedFiles, error: fileLookupError } = await auth.supabase.storage.from("kfm-digital-books").list(pdfFolder, { search: pdfName });
    const uploadedPdf = uploadedFiles?.find((file) => file.name === pdfName);
    if (fileLookupError || !uploadedPdf || uploadedPdf.metadata?.mimetype !== "application/pdf" ||
        Number(uploadedPdf.metadata?.size || 0) < 1 || Number(uploadedPdf.metadata?.size || 0) > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "The uploaded PDF could not be verified. Please upload it again." }, { status: 400 });
    }

    const { data: existing, error: lookupError } = await auth.supabase
      .from("kfm_books").select("id,title,slug,file_path").eq("id", bookId).maybeSingle();
    if (lookupError || !existing) {
      return NextResponse.json({ error: "The selected book could not be found." }, { status: 404 });
    }

    const { error: updateError } = await auth.supabase.from("kfm_books")
      .update({ file_path: pdfPath }).eq("id", bookId);
    if (updateError) {
      console.error("KFM replacement book record update failed:", updateError.message);
      return NextResponse.json({ error: "The PDF uploaded, but the book record could not be updated.", diagnostic: { message: updateError.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "The book PDF has been replaced. The existing listing and its details are unchanged." });
  } catch (error) {
    console.error("KFM book PDF replacement error:", error);
    return NextResponse.json({ error: "Unable to replace this book PDF.", diagnostic: { message: error instanceof Error ? error.message : String(error) } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    const title = String(body.title || "").trim();
    const author = String(body.author || "").trim();
    const description = String(body.description || "").trim();
    const price = Number(body.price);
    if (!id || !title || title.length > 180 || !author || author.length > 160 ||
        !description || description.length > 5000 || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Enter a valid title, author, description and price." }, { status: 400 });
    }
    const { data, error } = await auth.supabase.from("kfm_books")
      .update({ title, author, description, price: Math.round(price * 100) / 100 })
      .eq("id", id).select("id").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Could not update this book.", diagnostic: { message: error?.message || "Book not found." } }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Could not update this book.", diagnostic: { message: error instanceof Error ? error.message : String(error) } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const id = request.nextUrl.searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "Book ID is required." }, { status: 400 });
    const { data, error } = await auth.supabase.from("kfm_books")
      .update({ is_published: false }).eq("id", id).select("id").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Could not remove this book from the store.", diagnostic: { message: error?.message || "Book not found." } }, { status: 500 });
    return NextResponse.json({ success: true, message: "Book removed from the public store. Purchase history is preserved." });
  } catch (error) {
    return NextResponse.json({ error: "Could not remove this book.", diagnostic: { message: error instanceof Error ? error.message : String(error) } }, { status: 500 });
  }
}
