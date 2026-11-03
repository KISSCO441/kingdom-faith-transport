"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Advert = {
  id: string; title: string; category: string; asking_price: number; location: string;
  advert_status: string; admin_notes: string | null; created_at: string; published_at: string | null; expires_at: string | null; expired_at: string | null;
};

const statusLabels: Record<string, string> = {
  draft: "Draft", pending_payment: "Awaiting payment", pending_review: "Under KFM review",
  active: "Published", rejected: "Changes required", paused: "Hidden", sold: "Sold", expired: "Expired",
};

export default function MyAdvertsPage() {
  const [adverts, setAdverts] = useState<Advert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function loadAdverts() {
    const response = await fetch("/api/market-account/my-adverts", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load your adverts.");
    setAdverts(result.adverts || []);
  }

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

  async function action(id: string, title: string, actionName: "hide" | "unhide" | "mark_sold") {
    const prompt = actionName === "hide" ? `Hide "${title}" from buyers?` :
      actionName === "unhide" ? `Submit "${title}" to KFM for review before showing it again?` :
      `Mark "${title}" as sold? Buyers will no longer see it as available.`;
    if (!window.confirm(prompt)) return;
    setBusy(id); setError(""); setMessage("");
    try {
      const response = await fetch("/api/market-account/my-adverts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: actionName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update advert.");
      await loadAdverts();
      setMessage(actionName === "hide" ? "Your advert is now hidden." : actionName === "unhide" ? "Your advert has been sent to KFM for review." : "Your advert has been marked as sold.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update advert.");
    } finally { setBusy(""); }
  }

  async function deleteAdvert(id: string, title: string) {
    if (!window.confirm(`Permanently delete "${title}" from your adverts? Payment records will be retained.`)) return;
    setBusy(id); setError(""); setMessage("");
    try {
      const response = await fetch("/api/market-account/my-adverts", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to delete advert.");
      setAdverts(current => current.filter(ad => ad.id !== id));
      setMessage("Your advert has been deleted. Payment history is retained.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete advert.");
    } finally { setBusy(""); }
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <Link href="/market" className="text-sm font-medium text-primary hover:underline">← Back to NSAWAM MARKET</Link>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">NSAWAM MARKET</p>
          <h1 className="mt-2 text-3xl font-bold">My Adverts</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your classified adverts, prices, photos and availability.</p>
        </div>
        <Link href="/market/account/classifieds/new" className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">Create advert</Link>
      </div>
      {message && <p role="status" className="mt-5 rounded-lg border p-4 text-sm">{message}</p>}
      {loading && <p className="mt-8 rounded-xl border p-5">Loading your adverts…</p>}
      {error && <p role="alert" className="mt-8 rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{error}</p>}
      {!loading && !error && adverts.length === 0 && (
        <section className="mt-8 rounded-xl border p-6">
          <h2 className="font-semibold">No adverts found</h2>
          <p className="mt-2 text-sm text-muted-foreground">There are no saved classified adverts linked to this seller account.</p>
        </section>
      )}
      <div className="mt-6 space-y-4">
        {adverts.map((advert) => {
          const isBusy = busy === advert.id;
          const canEdit = !["pending_payment", "sold", "expired"].includes(advert.advert_status);
          return (
            <article key={advert.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{advert.title}</h2>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">{advert.category.replaceAll("_", " ")} · {advert.location}</p>
                </div>
                <span className="rounded-full border px-3 py-1 text-xs font-semibold">{statusLabels[advert.advert_status] || advert.advert_status}</span>
              </div>
              <p className="mt-3 font-semibold">GH₵ {Number(advert.asking_price).toLocaleString("en-GH", { minimumFractionDigits: 2 })}</p>
              {advert.admin_notes && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">KFM note: {advert.admin_notes}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {canEdit && <Link href={`/market/account/my-adverts/${advert.id}/edit`} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Edit advert</Link>}
                {advert.advert_status === "active" && <button type="button" disabled={isBusy} onClick={() => void action(advert.id, advert.title, "hide")} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">{isBusy ? "Please wait…" : "Hide advert"}</button>}
                {advert.advert_status === "paused" && <button type="button" disabled={isBusy} onClick={() => void action(advert.id, advert.title, "unhide")} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">{isBusy ? "Please wait…" : "Unhide / request review"}</button>}
                {["active", "paused"].includes(advert.advert_status) && <button type="button" disabled={isBusy} onClick={() => void action(advert.id, advert.title, "mark_sold")} className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50">Mark as sold</button>}
                <button type="button" disabled={isBusy} onClick={() => void deleteAdvert(advert.id, advert.title)} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">{isBusy ? "Please wait…" : "Delete advert"}</button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Submitted {new Date(advert.created_at).toLocaleDateString("en-GH")}</p>
              {advert.published_at && <p className="mt-1 text-xs text-muted-foreground">Published {new Date(advert.published_at).toLocaleDateString("en-GH")}{advert.expires_at ? ` · Expires ${new Date(advert.expires_at).toLocaleDateString("en-GH")}` : ""}</p>}
              {advert.advert_status === "expired" && <p className="mt-2 rounded-lg bg-muted p-3 text-sm">This advert has expired after its 90-day listing period. It is hidden from buyers, but its record and payment history are retained. Contact KFM to arrange renewal.</p>}
            </article>
          );
        })}
      </div>
      <Link href="/market/account" className="mt-8 inline-flex text-sm font-medium text-primary underline">Seller account access</Link>
    </main>
  );
}
