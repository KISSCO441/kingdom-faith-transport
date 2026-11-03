"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Advert = {
  id: string; title: string; description: string; category: string; asking_price: number;
  location: string; seller_contact_phone: string; image_urls: string[]; advert_status: string;
}

export default function EditClassifiedAdvertPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const [advert, setAdvert] = useState<Advert | null>(null)
  const [form, setForm] = useState({ title: "", description: "", askingPrice: "", location: "", phone: "" })
  const [photos, setPhotos] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch("/api/market-account/my-adverts", { cache: "no-store" })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Unable to load your adverts.")
        const found = (result.adverts || []).find((item: Advert) => item.id === id)
        if (!found) throw new Error("This advert was not found in your seller account.")
        if (["pending_payment", "sold", "expired"].includes(found.advert_status)) throw new Error("This advert cannot be edited in its current status.")
        if (!cancelled) {
          setAdvert(found)
          setForm({ title: found.title, description: found.description, askingPrice: String(found.asking_price), location: found.location, phone: found.seller_contact_phone })
          setPhotos(found.image_urls || [])
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load advert.")
      } finally { if (!cancelled) setLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [id])

  function removePhoto(index: number) {
    setPhotos(current => current.filter((_, i) => i !== index))
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(""); setMessage("")
    try {
      if (photos.length + files.length > 5) throw new Error("A classified advert can have a maximum of five photos.")
      let uploaded: string[] = []
      if (files.length) {
        const upload = new FormData()
        files.forEach(file => upload.append("files", file))
        const uploadResponse = await fetch("/api/classifieds/upload-images", { method: "POST", body: upload })
        const uploadResult = await uploadResponse.json()
        if (!uploadResponse.ok) throw new Error(uploadResult.error || "Unable to upload advert photos.")
        uploaded = uploadResult.imageUrls || []
      }
      const response = await fetch("/api/market-account/my-adverts", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...form, askingPrice: Number(form.askingPrice), imageUrls: [...photos, ...uploaded] }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to save advert changes.")
      setMessage(result.message || "Advert changes saved.")
      setTimeout(() => router.push("/market/account/my-adverts"), 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save advert changes.")
    } finally { setBusy(false) }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <Link href="/market/account/my-adverts" className="text-sm font-semibold text-primary underline">← Back to My Adverts</Link>
      <section className="mt-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">KFM Classifieds</p>
        <h1 className="mt-2 text-2xl font-extrabold">Edit your advert</h1>
        {loading && <p className="mt-5">Loading advert…</p>}
        {!loading && advert && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Category: {advert.category.replaceAll("_", " ")}. Category cannot be changed here. Changes to a published advert will be reviewed by KFM before it appears publicly again.</p>
            <form onSubmit={save} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">Advert title<input required maxLength={140} value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
              <label className="block text-sm font-semibold">Description<textarea required maxLength={4000} rows={5} value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
              <label className="block text-sm font-semibold">Asking price (GH₵)<input required type="number" min="0.01" step="0.01" value={form.askingPrice} onChange={e => setForm(s => ({ ...s, askingPrice: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
              <label className="block text-sm font-semibold">Location<input required maxLength={180} value={form.location} onChange={e => setForm(s => ({ ...s, location: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
              <label className="block text-sm font-semibold">Seller phone number<input required maxLength={40} value={form.phone} onChange={e => setForm(s => ({ ...s, phone: e.target.value }))} className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
              <div>
                <p className="text-sm font-semibold">Advert photos ({photos.length + files.length}/5)</p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((url, index) => <div key={url} className="relative">
                    <img src={url} alt={`Advert photo ${index + 1}`} className="h-32 w-full rounded-lg border object-cover" />
                    <button type="button" onClick={() => removePhoto(index)} className="mt-1 w-full rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700">Remove photo</button>
                  </div>)}
                  {files.map((file, index) => <div key={file.name + index} className="rounded-lg border p-2 text-xs">{file.name}<button type="button" onClick={() => setFiles(current => current.filter((_, i) => i !== index))} className="mt-2 block text-red-700 underline">Remove selected file</button></div>)}
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={photos.length + files.length >= 5} onChange={e => {
                  const selected = Array.from(e.target.files || [])
                  setFiles(current => [...current, ...selected].slice(0, Math.max(0, 5 - photos.length)))
                  e.currentTarget.value = ""
                }} className="mt-3 block w-full rounded-lg border bg-background p-3 text-sm" />
                <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG or WebP; each photo up to 5 MB. You can keep, remove or replace photos, with up to five in total.</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">Saving changes to a published, hidden or rejected advert sends it to KFM for review. Its existing payment record is retained and no new listing fee is charged for ordinary edits.</div>
              <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60">{busy ? "Saving changes…" : "Save advert changes"}</button>
            </form>
          </>
        )}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
      </section>
    </main>
  )
}
