"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function BecomeVendorPage() {
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/market-account/vendor-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, contactName, contactPhone, businessLocation, businessDescription }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit your application.");
      setSuccess(result.message || "Your application has been submitted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit your application.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12">
      <div className="mb-8">
        <Link href="/market" className="text-sm font-medium text-primary hover:underline">← Back to NSAWAM MARKET</Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary">NSAWAM MARKET</p>
        <h1 className="mt-2 text-3xl font-bold">Become a marketplace vendor</h1>
        <p className="mt-3 text-muted-foreground">Tell KFM about your business. Applications are reviewed before a vendor account can list products for sale.</p>
      </div>

      {success ? (
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Application received</h2>
          <p className="mt-2 text-sm text-muted-foreground">{success}</p>
          <p className="mt-3 text-sm">Your application is pending KFM review. Product listings will be enabled after approval.</p>
          <Link href="/market" className="mt-5 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Return to marketplace</Link>
        </section>
      ) : (
        <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
          <label className="block text-sm font-medium">
            Business or shop name *
            <input required maxLength={140} value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-3" />
          </label>
          <label className="block text-sm font-medium">
            Contact person's name *
            <input required maxLength={120} value={contactName} onChange={(e) => setContactName(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-3" />
          </label>
          <label className="block text-sm font-medium">
            Contact phone number *
            <input required maxLength={40} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-3" />
          </label>
          <label className="block text-sm font-medium">
            Business location *
            <input required maxLength={180} placeholder="Town, area or address" value={businessLocation} onChange={(e) => setBusinessLocation(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-3" />
          </label>
          <label className="block text-sm font-medium">
            Brief description of your business
            <textarea maxLength={1500} rows={4} value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-3" />
          </label>
          <p className="text-xs text-muted-foreground">You must first sign in through seller email verification. Submission does not automatically approve your business or publish products.</p>
          <button disabled={busy} className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">
            {busy ? "Submitting..." : "Submit vendor application"}
          </button>
          {error && (
            <div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
              <p>{error}</p>
              {error.toLowerCase().includes("sign in") && (
                <Link href="/market/account" className="mt-2 inline-block font-semibold underline">Go to seller sign-in</Link>
              )}
            </div>
          )}
        </form>
      )}
    </main>
  );
}
