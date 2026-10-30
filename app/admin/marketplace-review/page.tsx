"use client";

import AdminAccessGuard from "@/components/admin/AdminAccessGuard";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

type Vendor = {
  id: string;
  business_name: string;
  contact_name: string;
  contact_phone: string;
  business_location: string;
  business_description: string | null;
  approval_status: string;
  admin_notes: string | null;
  created_at: string;
};
type Product = {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  stock_quantity: number;
  listing_status: string;
  admin_notes: string | null;
  created_at: string;
  market_vendors: { business_name: string; approval_status: string };
};

function MarketplaceReviewContent() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!supabase) throw new Error("Administrator sign-in is not configured.");
      const { data, error: sessionError } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (sessionError || !token) throw new Error("Please sign in again.");
      const response = await fetch("/api/admin/marketplace-review", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load review records.");
      setVendors(result.vendors || []);
      setProducts(result.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load marketplace review records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function decide(entity: "vendor" | "product", id: string, status: string) {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      if (!supabase) throw new Error("Administrator sign-in is not configured.");
      const { data, error: sessionError } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (sessionError || !token) throw new Error("Please sign in again.");
      const response = await fetch("/api/admin/marketplace-review", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ entity, id, status, notes: notes[id] || "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save review decision.");
      setMessage(entity === "vendor" ? "Vendor application decision saved." : "Product review decision saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save review decision.");
    } finally {
      setBusyId("");
    }
  }

  const pendingVendors = vendors.filter(v => v.approval_status === "pending");

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-400">KFM Administration</p>
            <h1 className="mt-2 text-3xl font-bold">Marketplace Review</h1>
            <p className="mt-2 text-sm text-slate-300">Approve vendors and review their product submissions before publication.</p>
          </div>
          <button onClick={() => void load()} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900">Refresh</button>
        </div>

        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</p>}

        {loading ? <p className="mt-8 rounded-xl border bg-white p-8">Loading marketplace applications…</p> : (
          <>
            <section className="mt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900">Vendor applications</h2>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">{pendingVendors.length} awaiting review</span>
              </div>
              {vendors.length === 0 ? <p className="rounded-xl border bg-white p-6 text-sm text-slate-500">No vendor applications have been submitted.</p> : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {vendors.map(vendor => (
                    <article key={vendor.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="text-lg font-bold text-slate-900">{vendor.business_name}</h3>
                        <span className="rounded-full border px-3 py-1 text-xs font-semibold">{vendor.approval_status.replaceAll("_", " ")}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">{vendor.contact_name} · {vendor.contact_phone}</p>
                      <p className="mt-1 text-sm text-slate-600">{vendor.business_location}</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{vendor.business_description}</p>
                      <label className="mt-4 block text-xs font-semibold text-slate-600">KFM review note
                        <textarea value={notes[vendor.id] ?? vendor.admin_notes ?? ""} onChange={e => setNotes(s => ({ ...s, [vendor.id]: e.target.value }))} rows={2} maxLength={1000} className="mt-1 w-full rounded-lg border p-3 text-sm" placeholder="Optional feedback for the vendor" />
                      </label>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button disabled={busyId === vendor.id || vendor.approval_status === "approved"} onClick={() => void decide("vendor", vendor.id, "approved")} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve vendor</button>
                        <button disabled={busyId === vendor.id} onClick={() => void decide("vendor", vendor.id, "rejected")} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Reject</button>
                        <button disabled={busyId === vendor.id} onClick={() => void decide("vendor", vendor.id, "suspended")} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">Suspend</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900">Product submissions</h2>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">{products.filter(p => p.listing_status === "pending_review").length} awaiting review</span>
              </div>
              {products.length === 0 ? <p className="rounded-xl border bg-white p-6 text-sm text-slate-500">No vendor products have been submitted.</p> : (
                <div className="space-y-4">
                  {products.map(product => (
                    <article key={product.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{product.title}</h3>
                          <p className="mt-1 text-sm text-slate-500">{product.market_vendors?.business_name} · {product.category}</p>
                        </div>
                        <span className="rounded-full border px-3 py-1 text-xs font-semibold">{product.listing_status.replaceAll("_", " ")}</span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{product.description}</p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">GH₵{Number(product.price).toFixed(2)} · Stock: {product.stock_quantity}</p>
                      <label className="mt-4 block text-xs font-semibold text-slate-600">KFM review note
                        <textarea value={notes[product.id] ?? product.admin_notes ?? ""} onChange={e => setNotes(s => ({ ...s, [product.id]: e.target.value }))} rows={2} maxLength={1000} className="mt-1 w-full rounded-lg border p-3 text-sm" placeholder="Optional feedback for the vendor" />
                      </label>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button disabled={busyId === product.id || product.market_vendors?.approval_status !== "approved"} onClick={() => void decide("product", product.id, "approved")} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve product</button>
                        <button disabled={busyId === product.id} onClick={() => void decide("product", product.id, "rejected")} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Request changes / reject</button>
                        {product.listing_status === "approved" && <button disabled={busyId === product.id} onClick={() => void decide("product", product.id, "paused")} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">Pause listing</button>}
                      </div>
                      {product.market_vendors?.approval_status !== "approved" && <p className="mt-3 text-xs text-amber-700">This product cannot be approved until its vendor is approved.</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function MarketplaceReviewPage() {
  return <AdminAccessGuard><MarketplaceReviewContent /></AdminAccessGuard>;
}
