"use client"

import { useEffect, useState } from "react"
import {
  UserRound,
  CreditCard,
  MapPin,
  LifeBuoy,
  ShieldCheck,
  Settings,
  ChevronRight,
  Mail,
  LogOut,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomerBottomNav } from "@/components/customer-bottom-nav"
import { customerAuthClient } from "@/lib/customer-auth"

const accountItems = [
  { label: "Payments", description: "Payment records from your KFM rides", icon: CreditCard },
  { label: "Saved places", description: "Saved pickup and destination places (coming soon)", icon: MapPin },
  { label: "Support", description: "Get help with a booking or payment", icon: LifeBuoy },
  { label: "Safety", description: "Ride safety information and assistance", icon: ShieldCheck },
  { label: "Settings", description: "Account preferences (coming soon)", icon: Settings },
]

export default function AccountPage() {
  const [email, setEmail] = useState("")
  const [signedInEmail, setSignedInEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!customerAuthClient) return

    let active = true
    customerAuthClient.auth.getSession().then(({ data }) => {
      if (active) setSignedInEmail(data.session?.user.email || "")
    })

    const { data } = customerAuthClient.auth.onAuthStateChange((_event, session) => {
      setSignedInEmail(session?.user.email || "")
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  async function requestSignInLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")

    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.")
      return
    }

    if (!customerAuthClient) {
      setError("Customer sign-in is not configured yet. Please contact KFM.")
      return
    }

    setLoading(true)
    try {
      const { error: authError } = await customerAuthClient.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      })

      if (authError) throw authError

      setMessage("If this address can receive KFM sign-in emails, a secure link is on its way. Open it on this device to finish signing in. Check your spam folder too.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send a sign-in link. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    if (!customerAuthClient) return
    setSigningOut(true)
    setError("")
    const { error: authError } = await customerAuthClient.auth.signOut()
    if (authError) setError("Unable to sign out. Please try again.")
    setSigningOut(false)
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 pb-28 pt-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">KFM Transport</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Account</h1>
        <p className="mt-2 text-muted-foreground">Your profile, ride history and customer preferences.</p>

        <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{signedInEmail ? "Your KFM account" : "Sign in to your KFM account"}</h2>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {signedInEmail || "Password-free sign-in using a secure link sent to your email."}
              </p>
            </div>
          </div>

          {signedInEmail ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                <p className="font-semibold">You are securely signed in</p>
                <p className="mt-1">Your Activity tab will show rides associated with this verified email address.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1"><a href="/activity"><History className="mr-2 h-4 w-4" />View ride activity</a></Button>
                <Button variant="outline" onClick={() => void signOut()} disabled={signingOut}><LogOut className="mr-2 h-4 w-4" />{signingOut ? "Signing out..." : "Sign out"}</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={requestSignInLink} className="mt-5 space-y-3">
              <label htmlFor="customer-account-email" className="block text-sm font-medium">Email address</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="customer-account-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                <Button type="submit" disabled={loading} className="sm:min-w-44"><Mail className="mr-2 h-4 w-4" />{loading ? "Sending..." : "Send sign-in link"}</Button>
              </div>
              <p className="text-sm text-muted-foreground">No password needed. Use the same email address you enter when booking a ride. For privacy, we only show rides linked to the verified email you sign in with.</p>
            </form>
          )}

          {message && <p className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm" role="status">{message}</p>}
          {error && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm" aria-label="Account options">
          {accountItems.map(({ label, description, icon: Icon }, index) => (
            <div key={label} className={`flex items-center gap-3 p-4 ${index ? "border-t border-border" : ""}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
          ))}
        </section>
      </div>
      <CustomerBottomNav />
    </main>
  )
}
