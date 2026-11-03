import { createClient } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookOpen, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

async function getBooks() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error} = await supabase.from("kfm_books").select("id,title,author,description,price,cover_url").eq("is_published",true).order("created_at",{ascending:false});
  if(error){console.error("KFM books catalogue error:",error.message);return [];}
  return data ?? [];
}

export default async function BooksPage(){
  const books=await getBooks();
  return <div className="min-h-screen bg-background text-foreground"><SiteHeader/><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
    <section className="overflow-hidden rounded-3xl bg-slate-950 px-5 py-10 text-white sm:px-9 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-[.18em] text-orange-400">Marketplace · Books & Publications</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Books that inspire, teach and empower.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Discover digital books and publications from Apostle K. F. Kisseh and other authors. Pay securely with Paystack and receive your digital copy by email after payment is confirmed.</p>
    </section>
    <section className="mt-10" aria-labelledby="available-books"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="available-books" className="text-2xl font-extrabold sm:text-3xl">Available eBooks</h2><p className="mt-2 text-sm text-muted-foreground">Digital editions available for secure online purchase.</p></div></div>
      {books.length===0?<div className="mt-6 rounded-2xl border border-dashed p-8 text-center"><BookOpen className="mx-auto h-10 w-10 text-muted-foreground"/><h3 className="mt-3 font-bold">Our digital bookstore is getting ready</h3><p className="mt-2 text-sm text-muted-foreground">New books will appear here as they are added to the catalogue.</p></div>:<div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{books.map((book:any)=><article key={book.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm"><div className="flex min-h-64 items-center justify-center bg-muted p-5">{book.cover_url?<img src={book.cover_url} alt={`Cover of ${book.title}`} className="max-h-72 w-auto max-w-full rounded-lg object-contain shadow-md"/>:<div className="flex h-56 w-40 items-center justify-center rounded-lg bg-slate-900 text-white"><BookOpen className="h-12 w-12"/></div>}</div><div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-orange-700">{book.author}</p><h3 className="mt-2 text-xl font-extrabold">{book.title}</h3><p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{book.description}</p><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><span className="text-xl font-black text-primary">GH₵{Number(book.price).toFixed(2)}</span><a href={`/books/${book.id}`} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700">View & Buy eBook</a></div><a href="tel:+233240555688" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted-foreground underline"><Phone className="h-4 w-4"/>Printed copy? Call 0240 555 688</a></div></article>)}</div>}
    </section>
    <section className="mt-12 rounded-2xl border bg-card p-5 sm:p-7"><h2 className="text-xl font-bold">Want a printed copy?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Printed books are arranged by phone. Call us to discuss quantity, bulk orders, delivery or collection and any special requests.</p><a href="tel:+233240555688" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground"><Phone className="h-4 w-4"/>Call 0240 555 688</a><p className="mt-2 text-sm text-muted-foreground">Alternative: 020 409 7129</p></section>
  </main><SiteFooter/></div>;
}
