"use client"

import AdminAccessGuard from "@/components/admin/AdminAccessGuard"
import { supabase } from "@/lib/supabase"
import { useCallback, useEffect, useState } from "react"

type Advert = {
  id: string; title: string; description: string; category: string; asking_price: number
  location: string; seller_contact_phone: string; advert_status: string; admin_notes: string | null
  created_at: string
  classified_ad_payments: { payment_status: string; amount: number; currency: string; payment_reference: string }[]
}
type Report = {
  id: string; advert_id: string; reporter_email: string | null; reporter_phone: string | null
  reason: string; details: string | null; report_status: string; admin_notes: string | null
  created_at: string; classified_ads: { title: string; advert_status: string } | null
}

function ReviewContent() {
  const [adverts, setAdverts] = useState<Advert[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      if (!supabase) throw new Error("Administrator sign-in is not configured.")
      const { data, error: sessionError } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (sessionError || !token) throw new Error("Please sign in again.")
      const response = await fetch("/api/admin/classifieds-review", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to load classifieds review.")
      setAdverts(result.adverts || []); setReports(result.reports || [])
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load review records.") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function decide(entity: "advert" | "report", id: string, status: string) {
    setBusy(id); setError(""); setMessage("")
    try {
      if (!supabase) throw new Error("Administrator sign-in is not configured.")
      const { data, error: sessionError } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (sessionError || !token) throw new Error("Please sign in again.")
      const response = await fetch("/api/admin/classifieds-review", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ entity, id, status, notes: notes[id] || "" }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to save decision.")
      setMessage("Your moderation decision has been saved.")
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save decision.") }
    finally { setBusy("") }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-950 p-6 text-white">
        <div><p className="text-sm font-bold uppercase tracking-wider text-orange-400">KFM Administration</p><h1 className="mt-2 text-3xl font-black">Classifieds Review</h1><p className="mt-2 text-sm text-slate-300">Review adverts and buyer reports. An advert cannot be published until its listing fee is verified as paid.</p></div>
        <button onClick={() => void load()} className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950">Refresh</button>
      </header>
      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {loading ? <p className="mt-6 rounded-xl border bg-white p-8">Loading classifieds review records…</p> : <>
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-extrabold">Submitted adverts ({adverts.length})</h2>
          {adverts.length === 0 ? <p className="rounded-xl border bg-white p-6 text-sm text-slate-500">No classified adverts have been submitted.</p> : <div className="grid gap-4 lg:grid-cols-2">
            {adverts.map(ad => {
              const paid = ad.classified_ad_payments?.some(p => p.payment_status === "paid")
              return <article key={ad.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-lg font-bold">{ad.title}</h3><span className="rounded-full border px-3 py-1 text-xs font-bold">{ad.advert_status.replaceAll("_", " ")}</span></div>
                <p className="mt-2 text-sm text-slate-600">{ad.category.replaceAll("_", " ")} · {ad.location} · {ad.seller_contact_phone}</p>
                <p className="mt-2 text-lg font-black">GH₵{Number(ad.asking_price).toFixed(2)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{ad.description}</p>
                <p className={`mt-3 text-sm font-bold ${paid ? "text-green-700" : "text-amber-700"}`}>Listing payment: {paid ? "Verified paid" : "Not verified as paid"}</p>
                <label className="mt-3 block text-xs font-semibold">KFM review note<textarea rows={2} maxLength={1000} value={notes[ad.id] ?? ad.admin_notes ?? ""} onChange={e => setNotes(s => ({ ...s, [ad.id]: e.target.value }))} className="mt-1 w-full rounded-lg border p-3 text-sm" /></label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button disabled={!paid || busy === ad.id || ad.advert_status === "active"} onClick={() => void decide("advert", ad.id, "active")} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Approve & publish</button>
                  <button disabled={busy === ad.id} onClick={() => void decide("advert", ad.id, "rejected")} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-40">Reject</button>
                  {ad.advert_status === "active" && <button disabled={busy === ad.id} onClick={() => void decide("advert", ad.id, "paused")} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-40">Pause advert</button>}
                </div>
              </article>
            })}
          </div>}
        </section>
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-extrabold">Buyer reports ({reports.length})</h2>
          {reports.length === 0 ? <p className="rounded-xl border bg-white p-6 text-sm text-slate-500">No buyer reports have been received.</p> : <div className="space-y-4">
            {reports.map(report => <article key={report.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold">{report.classified_ads?.title || "Advert no longer available"}</h3><span className="text-xs font-bold uppercase">{report.report_status.replaceAll("_", " ")}</span></div>
              <p className="mt-2 text-sm font-semibold text-red-700">{report.reason}</p>
              {report.details && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{report.details}</p>}
              <p className="mt-2 text-xs text-slate-500">Reporter: {report.reporter_email || report.reporter_phone || "No contact supplied"}</p>
              <label className="mt-3 block text-xs font-semibold">KFM review note<textarea rows={2} maxLength={1000} value={notes[report.id] ?? report.admin_notes ?? ""} onChange={e => setNotes(s => ({ ...s, [report.id]: e.target.value }))} className="mt-1 w-full rounded-lg border p-3 text-sm" /></label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button disabled={busy === report.id} onClick={() => void decide("report", report.id, "under_review")} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-40">Under review</button>
                <button disabled={busy === report.id} onClick={() => void decide("report", report.id, "resolved")} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Resolve</button>
                <button disabled={busy === report.id} onClick={() => void decide("report", report.id, "dismissed")} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-40">Dismiss</button>
              </div>
            </article>)}
          </div>}
        </section>
      </>}
    </div>
  </main>
}

export default function ClassifiedsReviewPage() {
  return <AdminAccessGuard><ReviewContent /></AdminAccessGuard>
}
