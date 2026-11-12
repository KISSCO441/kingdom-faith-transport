"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase as supabaseClient } from "@/lib/supabase"

type WalletData = {
  driver: { id: string; full_name: string | null; phone: string | null; momo_number: string | null; momo_network: string | null; registration_status: string | null }
  wallet: { currency: string; ledger_balance: number; reserved_for_payout: number; available_balance: number }
  transactions: Array<{ id: string; transaction_type: string; direction: string; amount: number; reference: string; description: string; created_at: string }>
  payouts: Array<{ id: string; amount: number; payout_status: string; payout_reference: string | null; paid_at: string | null; created_at: string }>
  payout_destination: { method: string; number: string | null; network: string | null; verified: boolean }
}

const money = (amount: number) => `GH₵ ${Number(amount || 0).toFixed(2)}`
const dateTime = (value: string) => new Date(value).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })

export default function DriverWalletPage() {
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadWallet = useCallback(async () => {
    try {
      setError("")
      const { data: sessionData, error: sessionError } = await supabaseClient!.auth.getSession()
      const token = sessionData.session?.access_token
      if (sessionError || !token) throw new Error("Please sign in again to view your wallet.")
      const response = await fetch("/api/driver/wallet", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to load your wallet.")
      setData(result)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your wallet.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadWallet() }, [loadWallet])

  if (loading) return <main className="min-h-screen bg-gray-50 p-6"><div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 text-center">Loading your KFM wallet…</div></main>

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <a href="/driver-dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Back to Driver Dashboard</a>
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Kingdom Faith Marketplace Transport</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Driver Wallet</h1>
          <p className="mt-1 text-gray-600">{data?.driver.full_name || "Driver"} · Internal earnings and Friday payout records</p>
        </header>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Wallet balance</p><p className={`mt-2 text-2xl font-bold ${(data?.wallet.ledger_balance || 0) < 0 ? "text-red-700" : "text-gray-900"}`}>{money(data?.wallet.ledger_balance || 0)}</p><p className="mt-1 text-xs text-gray-500">Net wallet balance after earnings, KFM cash commission and completed payouts</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Reserved for payout</p><p className="mt-2 text-2xl font-bold text-amber-700">{money(data?.wallet.reserved_for_payout || 0)}</p><p className="mt-1 text-xs text-gray-500">Included in a pending or approved payout batch</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Available balance</p><p className={`mt-2 text-2xl font-bold ${(data?.wallet.available_balance || 0) < 0 ? "text-red-700" : "text-green-700"}`}>{money(data?.wallet.available_balance || 0)}</p><p className="mt-1 text-xs text-gray-500">Available for payout only when positive</p></div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Verified payout details</h2>
          <p className="mt-1 text-sm text-gray-500">KFM uses the Mobile Money details already supplied and verified during your driver registration. You do not need to enter them again.</p>
          <div className="mt-4 rounded-xl border p-4">
            <p className="text-sm font-semibold">{data?.payout_destination.verified ? "Eligible registered destination" : "Payout destination requires KFM verification"}</p>
            <p className="mt-2 text-sm text-gray-700">Account holder: {data?.driver.full_name || "KFM driver"}</p>
            <p className="mt-1 text-sm text-gray-700">Mobile Money: {data?.payout_destination.number || "Not recorded"} · {data?.payout_destination.network || "Network not recorded"}</p>
            <p className="mt-2 text-xs text-gray-500">Registered contact: {data?.driver.phone || "Not recorded"} · Registration status: {(data?.driver.registration_status || "unknown").toUpperCase()}</p>
          </div>
          <p className="mt-3 text-xs text-gray-500">If these details need correction, contact KFM Admin. A change must be verified in your driver registration record before a payout can be prepared.</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Wallet transactions</h2><p className="text-sm text-gray-500">Online earnings, cash commission deductions, reversals and payouts</p></div><Button type="button" variant="outline" onClick={loadWallet}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button></div>
          <div className="mt-4 space-y-3">
            {!data?.transactions.length ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No wallet transactions recorded yet. Pending and disputed rides are excluded.</p> : data.transactions.map(tx=><article key={tx.id} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{tx.description}</p><p className="mt-1 text-xs text-gray-500">{tx.reference} · {dateTime(tx.created_at)}</p></div><p className={`font-bold ${tx.direction==="credit"?"text-green-700":"text-red-700"}`}>{tx.direction==="credit"?"+":"−"}{money(Number(tx.amount))}</p></article>)}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Friday payout history</h2>
          <p className="text-sm text-gray-500">Payouts are reviewed by KFM Admin. An external transfer is recorded only after KFM completes it and enters its reference.</p>
          <div className="mt-4 space-y-3">
            {!data?.payouts.length ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No weekly payouts have been prepared yet.</p> : data.payouts.map(p=><article key={p.id} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{money(Number(p.amount))}</p><p className="text-xs text-gray-500">{dateTime(p.created_at)}{p.payout_reference? ` · Ref: ${p.payout_reference}`:""}</p></div><span className="inline-flex items-center gap-1 text-sm font-semibold"><CheckCircle2 className="h-4 w-4" />{p.payout_status.toUpperCase()}</span></article>)}
          </div>
        </section>
        {(data?.wallet.ledger_balance || 0) < 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Your wallet has an outstanding KFM cash commission balance. Your share of future verified online rides will first reduce this negative balance before any amount becomes available for payout.</p>}
        <p className="text-xs text-gray-500">Internal wallet balances are KFM ledger records, not money held in a separate bank account. Friday Mobile Money transfers are made by KFM and recorded after payment.</p>
      </div>
    </main>
  )
}
