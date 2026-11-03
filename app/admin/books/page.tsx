"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import AdminAccessGuard from "@/components/admin/AdminAccessGuard";
import { supabase } from "@/lib/supabase";
import { BookOpen, Upload, ExternalLink } from "lucide-react";

type Book = { id:string; title:string; author:string; description:string; price:number; cover_url:string|null; is_published:boolean; created_at:string };

function BooksAdmin() {
  const [books,setBooks] = useState<Book[]>([]);
  const [title,setTitle] = useState("");
  const [author,setAuthor] = useState("Apostle K. F. Kisseh");
  const [description,setDescription] = useState("");
  const [price,setPrice] = useState("");
  const [pdf,setPdf] = useState<File|null>(null);
  const [cover,setCover] = useState<File|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");

  const loadBooks = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured for admin access.");
    const {data:{session}} = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const response = await fetch("/api/admin/books",{headers:{Authorization:`Bearer ${session.access_token}`},cache:"no-store"});
    const result = await response.json();
    if (!response.ok) throw new Error(result.diagnostic ? `${result.error || "Could not load books."} — ${JSON.stringify(result.diagnostic)}` : (result.error || "Could not load books."));
    setBooks(result.books || []);
  },[]);

  useEffect(()=>{ void loadBooks().catch(e=>setError(e instanceof Error?e.message:"Could not load books.")); },[loadBooks]);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (!supabase) throw new Error("Supabase is not configured for admin access.");
      const {data:{session}} = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in to KFM Admin again.");
      const form = new FormData();
      form.set("title",title); form.set("author",author); form.set("description",description); form.set("price",price);
      if (pdf) form.set("pdf",pdf);
      if (cover) form.set("cover",cover);
      const response = await fetch("/api/admin/books",{method:"POST",headers:{Authorization:`Bearer ${session.access_token}`},body:form});
      const result = await response.json();
      if (!response.ok) throw new Error(result.diagnostic ? `${result.error || "Could not save this book."} — ${JSON.stringify(result.diagnostic)}` : (result.error || "Could not save this book."));
      setNotice("Book added and published. It is now visible on the Books & Publications page.");
      setTitle(""); setDescription(""); setPrice(""); setPdf(null); setCover(null);
      const formElement = event.currentTarget;
      formElement.reset();
      await loadBooks();
    } catch(e) { setError(e instanceof Error?e.message:"Could not save this book."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-5xl">
      <header className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="flex items-center gap-3"><BookOpen className="h-8 w-8 text-orange-400"/><p className="text-sm font-bold uppercase tracking-widest text-orange-300">KFM Books & Publications</p></div>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Manage digital books</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Add a book cover, sales description, price and the PDF customers will receive after verified Paystack payment.</p>
      </header>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold">Add a new book</h2>
          <label className="block text-sm font-semibold">Book title<input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border px-3 font-normal" placeholder="Enter the book title"/></label>
          <label className="block text-sm font-semibold">Author<input required maxLength={160} value={author} onChange={e=>setAuthor(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border px-3 font-normal"/></label>
          <label className="block text-sm font-semibold">Description<textarea required maxLength={5000} rows={5} value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-3 font-normal" placeholder="What will readers learn from this book?"/></label>
          <label className="block text-sm font-semibold">Digital price (GH₵)<input required type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border px-3 font-normal" placeholder="e.g. 50.00"/></label>
          <label className="block text-sm font-semibold">Book cover image <span className="font-normal text-slate-500">(JPG, PNG or WebP · max 5MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setCover(e.target.files?.[0]||null)} className="mt-2 block min-h-11 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-3 file:font-semibold file:text-orange-700"/></label>
          <label className="block text-sm font-semibold">Digital book PDF <span className="font-normal text-slate-500">(required · max 50MB)</span><input required type="file" accept="application/pdf,.pdf" onChange={e=>setPdf(e.target.files?.[0]||null)} className="mt-2 block min-h-11 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:font-semibold"/></label>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
          <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700 disabled:opacity-60"><Upload className="h-4 w-4"/>{busy?"Uploading book...":"Add and publish book"}</button>
          <p className="text-xs leading-5 text-slate-500">The PDF is stored privately. Customers cannot access it until Paystack confirms payment.</p>
        </form>
        <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Your books</h2><a href="/books" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-700">View page <ExternalLink className="h-4 w-4"/></a></div>
          {books.length===0?<p className="mt-5 rounded-xl border border-dashed p-5 text-sm text-slate-500">No books have been added yet. Add your first digital book using the form.</p>:<div className="mt-5 space-y-3">{books.map(book=><article key={book.id} className="flex min-w-0 gap-3 rounded-xl border p-3">{book.cover_url?<img src={book.cover_url} alt="" className="h-24 w-16 shrink-0 rounded-md object-cover"/>:<div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-orange-50"><BookOpen className="h-7 w-7 text-orange-600"/></div>}<div className="min-w-0"><h3 className="break-words font-bold">{book.title}</h3><p className="mt-1 text-xs text-slate-500">{book.author}</p><p className="mt-2 font-bold text-orange-700">GH₵{Number(book.price).toFixed(2)}</p><span className="text-xs text-green-700">Published</span></div></article>)}</div>}
        </section>
      </div>
      <a href="/admin" className="mt-6 inline-block text-sm font-semibold text-slate-700 underline">← Back to Admin Control Centre</a>
    </div>
  </main>;
}

export default function AdminBooksPage(){return <AdminAccessGuard><BooksAdmin/></AdminAccessGuard>}
