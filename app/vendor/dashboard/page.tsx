"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Vendor = {
  id: string;
  business_name: string;
  approval_status: "pending" | "approved" | "rejected" | "suspended";
  business_location: string;
  admin_notes: string | null;
};
type Product = {
  id: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  stock_quantity: number;
  listing_status: string;
  admin_notes?: string | null;
};

const statusText: Record<string, string> = {
  pending: "Awaiting KFM review",
  approved: "Approved",
  rejected: "Not approved",
  suspended: "Temporarily suspended",
  pending_review: "Awaiting product review",
  draft: "Draft",
  rejected_product: "Changes requested",
  paused: "Paused",
  out_of_stock: "Out of stock",
};

export default function VendorDashboardPage() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/market-account/vendor-dashboard", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load your vendor dashboard.");
      setVendor(result.vendor);
      setProducts(result.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your vendor dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setTitle(product.title);
    setDescription(product.description || "");
    setCategory(product.category);
    setPrice(String(product.price));
    setStockQuantity(String(product.stock_quantity));
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId("");
    setTitle("");
    setDescription("");
    setCategory("Groceries");
    setPrice("");
    setStockQuantity("1");
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(editingId ? `/api/market-account/vendor-products/${editingId}` : "/api/market-account/vendor-products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, price, stockQuantity: Number(stockQuantity) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save product.");
      setMessage(result.message || "Product saved.");
      resetForm();
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <Link href="/market" className="text-sm font-medium text-primary hover:underline">← Back to NSAWAM MARKET</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">NSAWAM MARKET</p>
          <h1 className="mt-2 text-3xl font-bold">Vendor Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage your vendor application and product submissions.</p>
        </div>
        <button type="button" onClick={() => void loadDashboard()} className="rounded-lg border px-4 py-2 text-sm font-semibold">Refresh</button>
      </div>

      {loading ? <p className="mt-8 rounded-xl border p-6">Loading your vendor account…</p> : (
        <>
          {error && <p role="alert" className="mt-6 rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{error}</p>}
          {message && <p role="status" className="mt-6 rounded-lg border p-4 text-sm">{message}</p>}

          {!vendor ? (
            <section className="mt-8 rounded-2xl border bg-card p-6">
              <h2 className="text-xl font-semibold">No vendor application found</h2>
              <p className="mt-2 text-sm text-muted-foreground">Submit your business details first. KFM must approve your application before you can list products.</p>
              <Link href="/market/become-a-vendor" className="mt-5 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Complete vendor application</Link>
            </section>
          ) : (
            <>
              <section className="mt-8 rounded-2xl border bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{vendor.business_name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{vendor.business_location}</p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-sm font-semibold">{statusText[vendor.approval_status] || vendor.approval_status}</span>
                </div>
                {vendor.admin_notes && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">KFM note: {vendor.admin_notes}</p>}
                {vendor.approval_status !== "approved" && <p className="mt-4 text-sm text-muted-foreground">Product listing tools unlock after KFM approves your vendor application. You can refresh this page to check for a decision.</p>}
              </section>

              {vendor.approval_status === "approved" && (
                <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                  <form onSubmit={saveProduct} className="h-fit space-y-4 rounded-2xl border bg-card p-6">
                    <h2 className="text-xl font-semibold">{editingId ? "Edit product" : "Add a product"}</h2>
                    <label className="block text-sm font-medium">Product name
                      <input required maxLength={140} value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-3" />
                    </label>
                    <label className="block text-sm font-medium">Category
                      <input required maxLength={80} value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Groceries, Books, Home & Lifestyle" className="mt-1 w-full rounded-lg border bg-background px-3 py-3" />
                    </label>
                    <label className="block text-sm font-medium">Description
                      <textarea required rows={4} maxLength={3000} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-3" />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-sm font-medium">Price (GH₵)
                        <input required type="number" min="0.01" step="0.01" max="10000000" value={price} onChange={e => setPrice(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-3" />
                      </label>
                      <label className="block text-sm font-medium">Stock quantity
                        <input required type="number" min="0" step="1" max="1000000" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-3" />
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">Product photos and customer checkout integration will be enabled in a later stage. Every new or edited listing is sent to KFM for review.</p>
                    <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Saving…" : editingId ? "Submit changes for review" : "Submit product for review"}</button>
                    {editingId && <button type="button" onClick={resetForm} className="w-full rounded-lg border px-4 py-3 text-sm">Cancel editing</button>}
                  </form>

                  <section className="rounded-2xl border bg-card p-6">
                    <h2 className="text-xl font-semibold">Your product listings</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Only products approved by KFM may be considered for customer display.</p>
                    {products.length === 0 ? <p className="mt-6 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">You have not submitted any products yet.</p> : (
                      <div className="mt-5 space-y-3">
                        {products.map(product => (
                          <article key={product.id} className="rounded-xl border p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="font-semibold">{product.title}</h3>
                                <p className="mt-1 text-xs text-muted-foreground">{product.category} · Stock: {product.stock_quantity}</p>
                                <p className="mt-2 font-semibold">GH₵{Number(product.price).toFixed(2)}</p>
                              </div>
                              <span className="rounded-full border px-3 py-1 text-xs font-semibold">{statusText[product.listing_status] || product.listing_status.replaceAll("_", " ")}</span>
                            </div>
                            {product.admin_notes && <p className="mt-3 text-sm text-muted-foreground">KFM note: {product.admin_notes}</p>}
                            <button type="button" onClick={() => startEdit(product)} className="mt-3 rounded-lg border px-3 py-2 text-sm font-semibold">Edit and resubmit</button>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
