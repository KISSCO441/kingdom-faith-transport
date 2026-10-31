"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Advert = {
  id: string; title: string; category: string; asking_price: number; location: string;
  advert_status: string; admin_notes: string | null; created_at: string;
};

const statusLabels: Record<string, string> = {
  draft: "Draft", pending_payment: "Awaiting payment", pending_review: "Under KFM review",
  active: "Published", rejected: "Changes required", paused: "Paused", sold: "Sold", expired: "Expired",
};

export default function MyAdvertsPage() {
  const [adverts, setAdverts] = useState<Advert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/market-account/my-adverts", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load your adverts.");
        if (!cancelled) setAdverts(result.adverts || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load your adverts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <Link href="/market" className="text-sm font-medium text-primary hover:underline">← Back to NSAWAM MARKET</Link>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">NSAWAM MARKET</p>
          <h1 className="mt-2 text-3xl font-bold">My Adverts</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your existing classified adverts and their current status.</p>
        </div>
        <Link href="/market/account/classifieds/new" className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">Create advert</Link>
      </div>
      {loading && <p className="mt-8 rounded-xl border p-5">Loading your adverts…</p>}
      {error && <p role="alert" className="mt-8 rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{error}</p>}
      {!loading && !error && adverts.length === 0 && (
        <section className="mt-8 rounded-xl border p-6">
          <h2 className="font-semibold">No adverts found</h2>
          <p className="mt-2 text-sm text-muted-foreground">There are no saved classified adverts linked to this seller account.</p>
        </section>
      )}
      <div className="mt-6 space-y-4">
        {adverts.map((advert) => (
          <article key={advert.id} className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{advert.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{advert.category.replaceAll("_", " ")} · {advert.location}</p>
              </div>
              <span className="rounded-full border px-3 py-1 text-xs font-semibold">{statusLabels[advert.advert_status] || advert.advert_status}</span>
            </div>
            <p className="mt-3 font-semibold">GH₵ {Number(advert.asking_price).toLocaleString("en-GH", { minimumFractionDigits: 2 })}</p>
            {advert.admin_notes && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">KFM note: {advert.admin_notes}</p>}
            <p className="mt-3 text-xs text-muted-foreground">Submitted {new Date(advert.created_at).toLocaleDateString("en-GH")}</p>
          </article>
        ))}
      </div>
      <Link href="/market/account" className="mt-8 inline-flex text-sm font-medium text-primary underline">Seller account access</Link>
    </main>
  );
}
