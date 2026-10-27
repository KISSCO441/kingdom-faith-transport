"use client"

import { useEffect, useState } from "react"
import {
  Search,
  CheckCircle2,
  Car,
  Phone,
  MapPin,
  Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomerBottomNav } from "@/components/customer-bottom-nav"

type Ride = {
  id: string
  booking_code: string
  customer_name: string
  vehicle_type: string
  pickup_town: string
  pickup_area: string
  destination_town: string
  destination_area: string
  ride_status: string
  fare_estimate: number | null
  payment_method: string | null
  payment_status: string | null
  payment_reference: string | null
  payment_paid_at: string | null
  created_at: string
}

type Driver = {
  id: string
  full_name: string | null
  phone: string | null
  vehicle_type: string | null
  vehicle_name: string | null
  vehicle_registration: string | null
  vehicle_color: string | null
  photo_url: string | null
}

const statusSteps = [
  {
    key: "requested",
    label: "Ride Requested",
  },
  {
    key: "accepted",
    label: "Driver Accepted",
  },
  {
    key: "arrived",
    label: "Driver Arrived",
  },
  {
    key: "in_progress",
    label: "Ride In Progress",
  },
  {
    key: "completed",
    label: "Ride Completed",
  },
]

function getStatusIndex(status: string) {
  const index = statusSteps.findIndex(
    (step) => step.key === status,
  )

  return index >= 0 ? index : 0
}

function getStatusMessage(status: string) {
  switch (status) {
    case "requested":
      return "Your ride request has been received."

    case "accepted":
      return "Your KFM driver has accepted the ride."

    case "arrived":
      return "Your KFM driver has arrived at the pickup location."

    case "in_progress":
      return "Your ride is currently in progress."

    case "completed":
      return "Your KFM ride has been completed."

    case "cancelled":
      return "This ride has been cancelled."

    default:
      return "We are checking the latest ride status."
  }
}

export default function RideStatusPage() {
  const [bookingCode, setBookingCode] = useState("")
  const [ride, setRide] = useState<Ride | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)

  async function checkRideStatus(codeInput?: string) {
    const code = (codeInput || bookingCode).trim().toUpperCase()

    if (!code) {
      setError("Please enter your KFM booking number.")
      return
    }

    setLoading(true)
    setError("")
    setRide(null)
    setDriver(null)

    try {
      const response = await fetch(
        `/api/rides/status?booking_code=${encodeURIComponent(code)}`,
        {
          cache: "no-store",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to find your ride.",
        )
      }

      setRide(data.ride || null)
      setDriver(data.driver || null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to check your ride status.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("booking_code")
    const reference = params.get("reference")
    if (code) {
      const normalizedCode = code.trim().toUpperCase()
      setBookingCode(normalizedCode)
      void (async () => {
        if (reference) {
          await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`, { cache: "no-store" })
        }
        await checkRideStatus(normalizedCode)
      })()
    }
  }, [])

  async function startPaystackPayment() {
    if (!ride) return
    try {
      setPaymentLoading(true)
      setError("")
      const response = await fetch("/api/rides/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_code: ride.booking_code }),
      })
      const data = await response.json()
      if (!response.ok || !data.success || !data.authorization_url) {
        throw new Error(data.error || "Unable to start Paystack payment.")
      }
      window.location.href = data.authorization_url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment.")
      setPaymentLoading(false)
    }
  }

  const statusIndex = ride
    ? getStatusIndex(ride.ride_status)
    : -1

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-12 pb-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            KFM Transport
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Check Your Ride
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Enter your KFM booking number to see your ride
            status and driver information.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          <label
            htmlFor="bookingCode"
            className="text-sm font-medium"
          >
            KFM Booking Number
          </label>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="bookingCode"
              value={bookingCode}
              onChange={(event) =>
                setBookingCode(event.target.value.toUpperCase())
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  checkRideStatus()
                }
              }}
              placeholder="KFM-243731"
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />

            <Button
              onClick={() => checkRideStatus()}
              disabled={loading}
              className="sm:min-w-36"
            >
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Checking..." : "Check Ride"}
            </Button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {ride && (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your KFM Booking
                  </p>

                  <h2 className="mt-1 text-2xl font-bold tracking-wide">
                    {ride.booking_code}
                  </h2>
                </div>

                <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold capitalize">
                  {ride.ride_status.replace("_", " ")}
                </div>
              </div>

              <p className="mt-5 text-sm text-muted-foreground">
                {getStatusMessage(ride.ride_status)}
              </p>

              {ride.ride_status !== "cancelled" && (
                <div className="mt-8">
                  <div className="space-y-5">
                    {statusSteps.map((step, index) => {
                      const completed = index <= statusIndex
                      const current =
                        index === statusIndex

                      return (
                        <div
                          key={step.key}
                          className="flex items-start gap-4"
                        >
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                              completed
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-background text-muted-foreground"
                            }`}
                          >
                        {completed ? (
  <CheckCircle2 className="h-5 w-5" />
) : (
  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
)}
                          </div>

                          <div>
                            <p
                              className={`font-semibold ${
                                current
                                  ? "text-foreground"
                                  : completed
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </p>

                            {current && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                Current ride status
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">
                    Trip Details
                  </h3>
                </div>

                <div className="mt-5 space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Pickup
                    </p>

                    <p className="mt-1 font-medium">
                      {ride.pickup_town} — {ride.pickup_area}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Destination
                    </p>

                    <p className="mt-1 font-medium">
                      {ride.destination_town} —{" "}
                      {ride.destination_area}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">
                      {ride.vehicle_type}
                    </span>
                  </div>

                  {ride.fare_estimate !== null && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Fare
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        GH₵{ride.fare_estimate}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {driver && ride.ride_status !== "requested" ? (
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Navigation className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">
                      Your KFM Driver
                    </h3>
                  </div>

                  <div className="mt-5 space-y-4">
  {driver.photo_url && (
    <div className="flex justify-center">
      <img
        src={driver.photo_url}
        alt={`${driver.full_name || "KFM Driver"} profile`}
        className="h-28 w-28 rounded-full border-4 border-background object-cover shadow-md"
      />
    </div>
  )}

  <div>
    <p className="text-xs uppercase tracking-wider text-muted-foreground">
      Driver
    </p>

    <p className="mt-1 text-lg font-semibold">
      {driver.full_name || "KFM Driver"}
    </p>
  </div>

                    {driver.vehicle_name && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Vehicle
                        </p>

                        <p className="mt-1 font-medium">
                          {driver.vehicle_name}
                        </p>
                      </div>
                    )}

                    {driver.vehicle_registration && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Registration
                        </p>

                        <p className="mt-1 font-medium">
                          {driver.vehicle_registration}
                        </p>
                      </div>
                    )}

                    {driver.vehicle_color && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Color
                        </p>

                        <p className="mt-1 font-medium">
                          {driver.vehicle_color}
                        </p>
                      </div>
                    )}

                    {driver.phone && (
                      <a
                        href={`tel:${driver.phone}`}
                        className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                      >
                        <Phone className="h-4 w-4" />
                        Call Driver
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Navigation className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">
                      Driver Information
                    </h3>
                  </div>

                  <p className="mt-5 text-sm text-muted-foreground">
                    KFM is currently looking for an available
                    driver for this ride.
                  </p>
                </div>
              )}
            </div>

            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Payment & Receipt</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Payment method</span><span className="font-medium text-right">{ride.payment_method?.toLowerCase() === "cash" ? "Cash to Driver" : ride.payment_method?.toLowerCase() === "paystack" ? "Paystack" : "Not recorded"}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Payment status</span><span className="font-semibold capitalize">{ride.payment_status || "unpaid"}</span></div>
                {ride.payment_status?.toLowerCase() === "paid" ? (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
                    <p className="font-bold">KFM Transport Payment Receipt</p>
                    <p className="mt-1 text-xs">Receipt number</p><p className="font-semibold">{ride.booking_code.replace(/^KFM-/i, "KFM-RCP-")}</p>
                    <p className="mt-3"><strong>Amount paid:</strong> GH₵{Number(ride.fare_estimate || 0).toFixed(2)}</p>
                    <p><strong>Method:</strong> {ride.payment_method?.toLowerCase() === "cash" ? "Cash to Driver — recorded at ride completion" : "Paystack"}</p>
                    <p><strong>Date:</strong> {ride.payment_paid_at ? new Date(ride.payment_paid_at).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded"}</p>
                    {ride.payment_reference && <p><strong>Transaction reference:</strong> {ride.payment_reference}</p>}
                    <Button className="mt-4" variant="outline" onClick={() => window.print()}>Print / Save Receipt</Button>
                  </div>
                ) : ride.ride_status?.toLowerCase() === "completed" && ride.payment_method?.toLowerCase() === "paystack" ? (
                  <div className="mt-4"><p className="text-muted-foreground">Your fare is awaiting online payment.</p><Button className="mt-3 w-full" onClick={startPaystackPayment} disabled={paymentLoading}>{paymentLoading ? "Connecting to Paystack..." : "Pay Fare with Paystack"}</Button></div>
                ) : ride.ride_status?.toLowerCase() === "completed" ? (
                  <p className="text-muted-foreground">Your cash fare is recorded at ride completion.</p>
                ) : <p className="text-muted-foreground">Your receipt will appear here when payment is recorded.</p>}
              </div>
            </section>
            <div className="text-center text-sm text-muted-foreground">Keep your booking number for reference.</div>
          </div>
        )}
      </div>
      <CustomerBottomNav />
    </main>
  )
}
