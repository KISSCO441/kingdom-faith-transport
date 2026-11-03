import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookPurchase } from "@/components/books/book-purchase";

export const dynamic="force-dynamic";
export default async function BookDetailPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) notFound();
 const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:book,error}=await supabase.from("kfm_books").select("id,title,author,description,price,cover_url").eq("id",id).eq("is_published",true).maybeSingle();
 if(error||!book) notFound();
 return <div className="min-h-screen bg-background text-foreground"><SiteHeader/><main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12"><a href="/books" className="text-sm font-semibold text-primary underline">← All books</a><div className="mt-5 grid gap-8 md:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]"><div className="flex min-h-80 items-center justify-center rounded-2xl bg-muted p-6">{book.cover_url?<img src={book.cover_url} alt={`Cover of ${book.title}`} className="max-h-[520px] max-w-full rounded-lg object-contain shadow-lg"/>:<div className="flex h-72 w-52 items-center justify-center rounded-xl bg-slate-900 text-white"><span className="text-center text-xl font-black">KFM<br/>BOOKS</span></div>}</div><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-orange-700">Digital book</p><h1 className="mt-3 break-words text-3xl font-black sm:text-4xl">{book.title}</h1><p className="mt-3 text-sm font-semibold text-muted-foreground">By {book.author}</p><p className="mt-6 whitespace-pre-line text-sm leading-7 text-muted-foreground">{book.description}</p><p className="mt-7 text-3xl font-black text-primary">GH₵{Number(book.price).toFixed(2)}</p><BookPurchase bookId={book.id}/><div className="mt-6 rounded-xl border p-4"><h2 className="font-bold">Prefer a printed copy?</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Call to discuss quantity, bulk orders, delivery or collection and special requests.</p><a href="tel:+233240555688" className="mt-3 inline-flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm font-bold">Call 0240 555 688</a></div><p className="mt-5 text-xs leading-5 text-muted-foreground">Your PDF download is released only after KFM verifies successful Paystack payment. Download links expire after 7 days and allow up to 5 downloads.</p></div></div></main><SiteFooter/></div>;
}
