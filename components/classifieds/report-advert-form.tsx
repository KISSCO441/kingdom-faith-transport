"use client"

import { useState } from "react"

const reasons = [
  "Suspected scam or fraud",
  "False or misleading information",
  "Item may be stolen or unlawfully owned",
  "Seller is requesting suspicious advance payment",
  "Other concern",
]

export function ReportAdvertForm({ advertId }: { advertId: string }) {
  const [reason, setReason] = useState(reasons[0])
  const [details, setDetails] = useState("")
  const [contact, setContact] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch("/api/classifieds/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advertId, reason, details, contact }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to submit report.")
      setMessage("Thank you. Your report has been sent to KFM for review.")
      setDetails("")
      setContact("")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit report. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border p-5">
      <h2 className="text-lg font-extrabold">Report this advert</h2>
      <p className="mt-1 text-sm text-muted-foreground">If something about this advert or seller seems suspicious, tell KFM so it can be reviewed.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block text-sm font-semibold">
          Reason for report
          <select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3">
            {reasons.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          More details (optional)
          <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1500} rows={3} className="mt-1 w-full rounded-lg border bg-background p-3 font-normal" placeholder="Tell us what concerned you." />
        </label>
        <label className="block text-sm font-semibold">
          Your phone or email (optional)
          <input value={contact} onChange={(event) => setContact(event.target.value)} maxLength={254} className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3 font-normal" placeholder="How KFM can contact you" />
        </label>
        <button disabled={busy} className="min-h-11 rounded-lg border border-red-300 px-5 py-3 text-sm font-bold text-red-700 disabled:opacity-50">
          {busy ? "Submitting…" : "Submit report"}
        </button>
        {message && <p role="status" className="text-sm font-medium">{message}</p>}
      </form>
    </section>
  )
}
