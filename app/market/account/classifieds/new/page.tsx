"use client"

import { useState } from "react"

const categories = [
  { value: "cars_vehicles", label: "Cars & Vehicles" },
  { value: "appliances_electronics", label: "Home Appliances & Electronics" },
  { value: "furniture_household", label: "Furniture & Household Items" },
  { value: "general_items", label: "Other General Items" },
]

export default function NewClassifiedAdvertPage() {
  const [form, setForm] = useState({ category: "general_items", title: "", description: "", askingPrice: "", location: "", phone: "", imageUrls: "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(""); setMessage("")
    try {
      const imageUrls = form.imageUrls.split("\n").map(value => value.trim()).filter(Boolean)
      const response = await fetch("/api/classifieds/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, askingPrice: Number(form.askingPrice), imageUrls }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to submit your advert.")
      setMessage("Your advert has been saved. Continue to Paystack to pay the listing fee.")
      window.location.assign(result.paymentUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit your advert.")
    } finally { setBusy(false) }
  }

  return <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
    <a href="/classifieds" className="text-sm font-semibold text-primary underline">Back to KFM Classifieds</a>
    <section className="mt-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
      <p className="text-sm font-bold uppercase tracking-wider text-primary">NSAWAM MARKET</p>
      <h1 className="mt-2 text-2xl font-extrabold">Advertise an item</h1>
      <p className="mt-2 text-sm text-muted-foreground">Complete the details below. Your advert will remain unpublished until the listing fee is verified and KFM reviews it.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">Category<select required value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3">{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
        <label className="block text-sm font-semibold">Advert title<input required maxLength={140} value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
        <label className="block text-sm font-semibold">Description<textarea required maxLength={4000} rows={5} value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
        <label className="block text-sm font-semibold">Asking price (GH₵)<input required type="number" min="0.01" step="0.01" value={form.askingPrice} onChange={e => setForm(s => ({ ...s, askingPrice: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
        <label className="block text-sm font-semibold">Location<input required maxLength={180} value={form.location} onChange={e => setForm(s => ({ ...s, location: e.target.value }))} placeholder="e.g. Nsawam, Eastern Region" className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
        <label className="block text-sm font-semibold">Seller phone number<input required maxLength={40} value={form.phone} onChange={e => setForm(s => ({ ...s, phone: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
        <label className="block text-sm font-semibold">Photo links (optional, one HTTPS link per line; maximum 5)<textarea rows={3} value={form.imageUrls} onChange={e => setForm(s => ({ ...s, imageUrls: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">The KFM listing fee is an advertising charge. It does not guarantee the authenticity, ownership or condition of an item, or the honesty of a seller. Buyers must verify independently.</p>
        <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60">{busy ? "Preparing secure payment…" : "Submit advert and continue to payment"}</button>
      </form>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
    </section>
  </main>
}
