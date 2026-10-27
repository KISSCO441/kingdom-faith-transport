"use client"

import { useCallback, useEffect, useState } from "react"
import { Car, Clock3, MapPin, RefreshCw, ReceiptText } from "lucide-react"
import { CustomerBottomNav } from "@/components/customer-bottom-nav"
import { Button } from "@/components/ui/button"
import { customerAuthClient } from "@/lib/customer-auth"

type Ride = {
  id: string
  booking_code: string
  created_at: string
  vehicle_type: string | null
  pickup_town: string | null
  pickup_area: string | null
  destination_town: string | null
  destination_area: string | null
  ride_status: string | null
  fare_estimate: number | null
  payment_method: string | null
  payment_status: string | null
  payment_paid_at: string | null
}

export default function CustomerActivityPage() {
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [rides, setRides] = useState<Ride[]>([])
  const [error, setError] = useState("")
  const [signedIn, setSignedIn] = useState(false)

  const loadRides = useCallback(async () => {
    if (!customerAuthClient) {
      setError("Customer sign-in is not configured yet. Please contact KFM.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    const { data } = await customerAuthClient.auth.getSession()
    const session = data.session

    if (!session?.access_token) {
      setSignedIn(false)
      setEmail("")
      setRides([])
      setLoading(false)
      return
    }

    setSignedIn(true)
    setEmail(session.user.email || "")

    try {
      const response = await fetch("/api/customer/rides", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to load ride history.")
      setRides(Array.isArray(result.rides) ? result.rides : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load ride history.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRides()
    if (!customerAuthClient) return
    const { data } = customerAuthClient.auth.onAuthStateChange(() => {
      window.setTimeout(() => void loadRides(), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [loadRides])

  return (
    <main className="min-h-screen bg-muted/30 px-4 pb-28 pt-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">KFM Transport</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Activity</h1>
        <p className="mt-2 text-muted-foreground">Your ride history and payment records.</p>

        {!signedIn && !loading && (
          <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Sign in to see your rides</h2>
            <p className="mt-2 text-sm text-muted-foreground">Use the same verified email address you entered when booking. For privacy, we only show rides linked to that email.</p>
            <Button asChild className="mt-5"><a href="/account">Continue to Account</a></Button>
            <p className="mt-4 text-sm text-muted-foreground">Need to check one booking without signing in? <a className="font-medium text-primary underline" href="/ride-status">Use your booking number</a>.</p>
          </section>
        )}

        {loading && <div className="mt-6 rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading your ride activity...</div>}

        {error && <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{error}</div>}

        {signedIn && !loading && !error && (
          <>
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Signed in as</p>
                <p className="mt-1 break-all text-sm text-muted-foreground">{email}</p>
              </div>
              <Button variant="outline" onClick={() => void loadRides()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            </div>

            {rides.length === 0 ? (
              <section className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold">No linked rides found yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">New rides will appear here when they are booked with this email address. Older rides booked without an email cannot be safely matched automatically.</p>
                <Button asChild className="mt-5"><a href="/#book">Book a ride</a></Button>
                <p className="mt-3 text-sm text-muted-foreground">Or <a className="font-medium text-primary underline" href="/ride-status">check a booking number</a>.</p>
              </section>
            ) : (
              <div className="mt-6 space-y-4">
                {rides.map((ride) => (
                  <article key={ride.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Booking number</p>
                        <h2 className="mt-1 text-xl font-bold">{ride.booking_code}</h2>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold capitalize">{(ride.ride_status || "unknown").replaceAll("_", " ")}</span>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4 shrink-0" />{new Date(ride.created_at).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Pickup</p><p className="mt-1 font-medium">{ride.pickup_town} — {ride.pickup_area}</p></div></div>
                      <div className="flex items-start gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Destination</p><p className="mt-1 font-medium">{ride.destination_town} — {ride.destination_area}</p></div></div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Car className="h-4 w-4" /><span className="capitalize">{ride.vehicle_type || "Ride"}</span></div>
                      <div className="text-right"><p className="text-lg font-bold">{ride.fare_estimate == null ? "Fare pending" : `GH₵${Number(ride.fare_estimate).toFixed(2)}`}</p><p className="text-xs capitalize text-muted-foreground">{ride.payment_status || "unpaid"} · {ride.payment_method || "payment not recorded"}</p></div>
                    </div>
                    <Button asChild variant="outline" className="mt-4 w-full sm:w-auto"><a href={`/ride-status?booking_code=${encodeURIComponent(ride.booking_code)}`}><ReceiptText className="mr-2 h-4 w-4" />Open ride details</a></Button>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <CustomerBottomNav />
    </main>
  )
}
