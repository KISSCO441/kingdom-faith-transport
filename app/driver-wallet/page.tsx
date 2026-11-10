"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { ArrowLeft, Banknote, CheckCircle2, Clock3, RefreshCw, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase as supabaseClient } from "@/lib/supabase"

type WalletData = {
  driver: { id: string; full_name: string | null; phone: string | null }
  wallet: { currency: string; ledger_balance: number; reserved_for_payout: number; available_balance: number }
  transactions: Array<{ id: string; transaction_type: string; direction: string; amount: number; reference: string; description: string; created_at: string }>
  payouts: Array<{ id: string; amount: number; payout_status: string; payout_reference: string | null; paid_at: string | null; created_at: string }>
  payout_profile: null | { id: string; payout_method: string; account_name: string; mobile_money_number: string | null; mobile_money_network: string | null; bank_name: string | null; bank_branch: string | null; bank_account_number: string | null; verification_status: string; admin_note: string | null; verified_at: string | null }
}

const money = (amount: number) => `GH₵ ${Number(amount || 0).toFixed(2)}`
const dateTime = (value: string) => new Date(value).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })

export default function DriverWalletPage() {
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [method, setMethod] = useState("mobile_money")
  const [accountName, setAccountName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [network, setNetwork] = useState("MTN")
  const [bankName, setBankName] = useState("")
  const [bankBranch, setBankBranch] = useState("")
  const [bankAccount, setBankAccount] = useState("")

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
      const profile = result.payout_profile
      if (profile) {
        setMethod(profile.payout_method)
        setAccountName(profile.account_name || "")
        setMobileNumber(profile.mobile_money_number || "")
        setNetwork(profile.mobile_money_network || "MTN")
        setBankName(profile.bank_name || "")
        setBankBranch(profile.bank_branch || "")
        setBankAccount(profile.bank_account_number || "")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your wallet.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadWallet() }, [loadWallet])

  async function savePayoutProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      setSaving(true)
      setError("")
      setNotice("")
      const { data: sessionData } = await supabaseClient!.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error("Please sign in again.")
      const response = await fetch("/api/driver/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          payout_method: method, account_name: accountName,
          mobile_money_number: mobileNumber, mobile_money_network: network,
          bank_name: bankName, bank_branch: bankBranch, bank_account_number: bankAccount,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to save payout details.")
      setNotice(result.message)
      await loadWallet()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save payout details.")
    } finally {
      setSaving(false)
    }
  }

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
        {notice && <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</div>}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Wallet balance</p><p className="mt-2 text-2xl font-bold text-gray-900">{money(data?.wallet.ledger_balance || 0)}</p><p className="mt-1 text-xs text-gray-500">Verified driver earnings, less completed payouts</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Reserved for payout</p><p className="mt-2 text-2xl font-bold text-amber-700">{money(data?.wallet.reserved_for_payout || 0)}</p><p className="mt-1 text-xs text-gray-500">Included in a pending or approved payout batch</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">Available balance</p><p className="mt-2 text-2xl font-bold text-green-700">{money(data?.wallet.available_balance || 0)}</p><p className="mt-1 text-xs text-gray-500">Eligible for a future Friday payout</p></div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-gray-100 p-3"><Banknote className="h-6 w-6" /></div><div><h2 className="text-xl font-bold">Payout destination</h2><p className="text-sm text-gray-500">KFM must verify your details before including you in a payout batch.</p></div></div>
          {data?.payout_profile && <div className="mt-4 rounded-xl border p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Current status: {data.payout_profile.verification_status.toUpperCase()}</p><span className="text-gray-500">{data.payout_profile.verified_at ? `Verified ${dateTime(data.payout_profile.verified_at)}` : "Not yet verified"}</span></div>
            {data.payout_profile.admin_note && <p className="mt-2 text-amber-800">KFM note: {data.payout_profile.admin_note}</p>}
          </div>}
          <form onSubmit={savePayoutProfile} className="mt-5 space-y-4">
            <div><label className="mb-1 block text-sm font-medium">Payout method</label><select value={method} onChange={e=>setMethod(e.target.value)} className="w-full rounded-lg border px-3 py-2"><option value="mobile_money">Mobile Money</option><option value="bank">Bank account</option></select></div>
            <div><label className="mb-1 block text-sm font-medium">Account holder name</label><input required value={accountName} onChange={e=>setAccountName(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></div>
            {method === "mobile_money" ? <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Mobile Money number</label><input required value={mobileNumber} onChange={e=>setMobileNumber(e.target.value)} placeholder="024XXXXXXX" className="w-full rounded-lg border px-3 py-2" /></div><div><label className="mb-1 block text-sm font-medium">Network</label><select value={network} onChange={e=>setNetwork(e.target.value)} className="w-full rounded-lg border px-3 py-2"><option>MTN</option><option>Telecel</option><option>AirtelTigo</option></select></div></div> : <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Bank name</label><input required value={bankName} onChange={e=>setBankName(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></div><div><label className="mb-1 block text-sm font-medium">Branch (optional)</label><input value={bankBranch} onChange={e=>setBankBranch(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></div><div><label className="mb-1 block text-sm font-medium">Bank account number</label><input required value={bankAccount} onChange={e=>setBankAccount(e.target.value)} className="w-full rounded-lg border px-3 py-2" /></div></div>}
            <p className="text-xs text-gray-500">Changing payout details resets verification. KFM Admin must verify the new destination. Submitting details does not initiate a transfer.</p>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save payout destination"}</Button>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Wallet transactions</h2><p className="text-sm text-gray-500">Your most recent credits and payout debits</p></div><Button type="button" variant="outline" onClick={loadWallet}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button></div>
          <div className="mt-4 space-y-3">
            {!data?.transactions.length ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No verified wallet transactions yet. Pending and disputed rides are not credited.</p> : data.transactions.map(tx=><article key={tx.id} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{tx.description}</p><p className="mt-1 text-xs text-gray-500">{tx.reference} · {dateTime(tx.created_at)}</p></div><p className={`font-bold ${tx.direction==="credit"?"text-green-700":"text-red-700"}`}>{tx.direction==="credit"?"+":"−"}{money(Number(tx.amount))}</p></article>)}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Friday payout history</h2>
          <p className="text-sm text-gray-500">Payouts are reviewed by KFM Admin. An external transfer is recorded only after KFM completes it and enters its reference.</p>
          <div className="mt-4 space-y-3">
            {!data?.payouts.length ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">No weekly payouts have been prepared yet.</p> : data.payouts.map(p=><article key={p.id} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{money(Number(p.amount))}</p><p className="text-xs text-gray-500">{dateTime(p.created_at)}{p.payout_reference? ` · Ref: ${p.payout_reference}`:""}</p></div><span className="inline-flex items-center gap-1 text-sm font-semibold"><CheckCircle2 className="h-4 w-4" />{p.payout_status.toUpperCase()}</span></article>)}
          </div>
        </section>
        <p className="text-xs text-gray-500">Internal wallet balances are KFM ledger records, not money held in a separate bank account. Real transfers are not automatic.</p>
      </div>
    </main>
  )
}
