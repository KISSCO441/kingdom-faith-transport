"use client"

import { useEffect, useState } from "react"

const categories = [
  { value: "cars_vehicles", label: "Cars & Vehicles", fee: 100 },
  { value: "appliances_electronics", label: "Home Appliances & Electronics", fee: 30 },
  { value: "furniture_household", label: "Furniture & Household Items", fee: 30 },
  { value: "general_items", label: "Other General Items", fee: 100 },
]

export default function NewClassifiedAdvertPage() {
  const [category, setCategory] = useState("general_items")
  const [form, setForm] = useState({ title: "", description: "", askingPrice: "", location: "", phone: "" })
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("category") || ""
    if (categories.some(item => item.value === selected)) setCategory(selected)
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(""); setMessage("")
    try {
      if (files.length > 5) throw new Error("You can upload a maximum of five photos.")
      let imageUrls: string[] = []
      if (files.length) {
        const upload = new FormData()
        files.forEach(file => upload.append("files", file))
        const uploadResponse = await fetch("/api/classifieds/upload-images", { method: "POST", body: upload })
        const uploadResult = await uploadResponse.json()
        if (!uploadResponse.ok) throw new Error(uploadResult.error || "Unable to upload advert photos.")
        imageUrls = uploadResult.imageUrls || []
      }
      const response = await fetch("/api/classifieds/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category, askingPrice: Number(form.askingPrice), imageUrls }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to submit your advert.")
      setMessage("Your advert has been saved. Continue to Paystack to pay the listing fee.")
      window.location.assign(result.paymentUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit your advert.")
    } finally { setBusy(false) }
  }

  const selectedCategory = categories.find(item => item.value === category) || categories[3]
  const selectedLabel = selectedCategory.label

  return <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
    <a href="/classifieds" className="text-sm font-semibold text-primary underline">Back to KFM Classifieds</a>
    <section className="mt-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
      <p className="text-sm font-bold uppercase tracking-wider text-primary">KFM Classifieds</p>
      <h1 className="mt-2 text-2xl font-extrabold">Advertise in {selectedLabel}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Complete your advert details and upload up to five photos. Your advert remains unpublished until payment is verified and KFM approves it.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="rounded-lg bg-muted p-3 text-sm font-semibold">Selected category: {selectedLabel}<p className="mt-2 text-base font-extrabold text-primary">KFM advert fee: GH₵{selectedCategory.fee.toFixed(2)}</p></div>
        <label className="block text-sm font-semibold">Advert title<input required maxLength={140} value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
        <label className="block text-sm font-semibold">Description<textarea required maxLength={4000} rows={5} value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
        <label className="block text-sm font-semibold">Asking price (GH₵)<input required type="number" min="0.01" step="0.01" value={form.askingPrice} onChange={e => setForm(s => ({ ...s, askingPrice: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
        <label className="block text-sm font-semibold">Location<input required maxLength={180} value={form.location} onChange={e => setForm(s => ({ ...s, location: e.target.value }))} placeholder="e.g. Nsawam, Eastern Region" className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
        <label className="block text-sm font-semibold">Seller phone number<input required maxLength={40} value={form.phone} onChange={e => setForm(s => ({ ...s, phone: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
        <label className="block text-sm font-semibold">Product photos (optional, maximum 5)
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => setFiles(Array.from(e.target.files || []).slice(0, 5))} className="mt-2 block w-full rounded-lg border bg-background p-3" />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">JPEG, PNG or WebP; each photo up to 5 MB.</span>
        </label>
        {files.length > 0 && <p className="text-xs text-muted-foreground">{files.length} photo(s) selected: {files.map(file => file.name).join(", ")}</p>}
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">The KFM listing fee is an advertising charge. It does not guarantee the authenticity, ownership or condition of an item, or the honesty of a seller. Buyers must verify independently.</p>
        <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60">{busy ? "Preparing advert and secure payment…" : "Submit advert and continue to payment"}</button>
      </form>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
    </section>
  </main>
}
