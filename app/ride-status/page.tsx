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

type DriverLocation = {
  latitude: number
  longitude: number
  accuracy_m: number | null
  updated_at: string
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
  const [customerPhone, setCustomerPhone] = useState("")
  const [ride, setRide] = useState<Ride | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [location, setLocation] = useState<DriverLocation | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelFeedback, setCancelFeedback] = useState("")
  const [paying, setPaying] = useState(false)
  const [paymentFeedback, setPaymentFeedback] = useState("")
  const [paymentEmail, setPaymentEmail] = useState("")
  const [cashPaying, setCashPaying] = useState(false)

  async function checkRideStatus(options?: { preserveCurrent?: boolean }) {
    const code = bookingCode.trim().toUpperCase()
    const phone = customerPhone.trim()

    if (!code || !phone) {
      setError("Please enter your KFM booking number and the phone number used when booking.")
      return
    }

    if (!options?.preserveCurrent) setLoading(true)
    setError("")
    if (!options?.preserveCurrent) {
      setRide(null)
      setDriver(null)
      setLocation(null)
    }

    try {
      const response = await fetch("/api/rides/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_code: code, phone }),
        cache: "no-store",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to find your ride.",
        )
      }

      setRide(data.ride || null)
      setDriver(data.driver || null)
      setLocation(data.location || null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to check your ride status.",
      )
    } finally {
      if (!options?.preserveCurrent) setLoading(false)
    }
  }

  async function payForRide() {
    if (!ride || ride.ride_status !== "completed" || ride.payment_status?.toLowerCase() === "paid") return
    setPaying(true)
    setPaymentFeedback("")
    setError("")
    try {
      const response = await fetch("/api/rides/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_code: bookingCode.trim().toUpperCase(),
          customer_phone: customerPhone.trim(),
          customer_email: paymentEmail.trim().toLowerCase(),
        }),
        cache: "no-store",
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to prepare your Paystack payment.")
      }
      if (data.already_paid) {
        setRide((current) => current ? { ...current, payment_status: "paid" } : current)
        setPaymentFeedback("This ride has already been paid.")
        return
      }
      if (!data.authorization_url) {
        throw new Error("KFM did not receive a Paystack payment link. Please contact KFM.")
      }
      window.location.href = data.authorization_url
    } catch (err) {
      setPaymentFeedback(err instanceof Error ? err.message : "Unable to prepare your payment.")
    } finally {
      setPaying(false)
    }
  }

  async function chooseCashPayment() {
    if (!ride || ride.ride_status !== "completed") return
    setCashPaying(true)
    setPaymentFeedback("")
    try {
      const response = await fetch("/api/rides/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_code: bookingCode.trim().toUpperCase(), customer_phone: customerPhone.trim() }),
        cache: "no-store",
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to record your cash payment choice.")
      setRide((current) => current ? { ...current, payment_method: "cash", payment_status: data.payment_status || "cash_pending_driver" } : current)
      setPaymentFeedback("Your cash payment choice has been recorded. Your driver must acknowledge receiving the fare before KFM marks it as paid.")
    } catch (err) {
      setPaymentFeedback(err instanceof Error ? err.message : "Unable to record your cash payment choice.")
    } finally {
      setCashPaying(false)
    }
  }

  async function cancelRide() {
    if (!ride || !["requested", "accepted"].includes(ride.ride_status)) return

    const confirmed = window.confirm(
      "Are you sure you want to cancel this KFM ride? This cannot be undone."
    )
    if (!confirmed) return

    setCancelling(true)
    setCancelFeedback("")
    setError("")

    try {
      const response = await fetch("/api/rides/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_code: bookingCode.trim().toUpperCase(),
          phone: customerPhone.trim(),
        }),
        cache: "no-store",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unable to cancel this ride.")
      }

      setRide((current) => current ? { ...current, ride_status: "cancelled" } : current)
      setLocation(null)
      setCancelFeedback("Your ride has been cancelled.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel this ride.")
    } finally {
      setCancelling(false)
    }
  }

  useEffect(() => {
    if (!ride || ride.ride_status === "cancelled" || (ride.ride_status === "completed" && ["paid", "cash_disputed"].includes(String(ride.payment_status || "").toLowerCase()))) return
    const timer = window.setInterval(() => {
      void checkRideStatus({ preserveCurrent: true })
    }, 10000)
    return () => window.clearInterval(timer)
  }, [ride?.id, ride?.ride_status, bookingCode, customerPhone])

  const statusIndex = ride
    ? getStatusIndex(ride.ride_status)
    : -1

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            KFM Transport
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Check Your Ride
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Enter your KFM booking number and the phone number used when booking to securely check your ride status and driver information.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          <label
            htmlFor="bookingCode"
            className="text-sm font-medium"
          >
            KFM Booking Number
          </label>

          <div className="mt-2 flex flex-col gap-3">
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
              required
              autoComplete="off"
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />

            <label htmlFor="customerPhone" className="text-sm font-medium">
              Phone Number Used When Booking
            </label>
            <input
              id="customerPhone"
              type="tel"
              autoComplete="tel"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") checkRideStatus()
              }}
              placeholder="Enter your booking phone number"
              required
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />

            <Button
              onClick={() => checkRideStatus()}
              disabled={loading}
              className="w-full sm:w-auto sm:min-w-36"
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

              {ride.ride_status === "completed" && ride.payment_method?.toLowerCase() === "paystack" && (
                <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="font-semibold text-orange-950">Ride Payment — Paystack</p>
                  <p className="mt-1 text-sm text-orange-900">
                    {ride.payment_status?.toLowerCase() === "paid" ? "Payment confirmed. Thank you for choosing KFM." : "Your ride is complete. Continue to secure Paystack checkout to pay your fare."}
                  </p>
                  {ride.payment_status?.toLowerCase() !== "paid" && (
                    <Button onClick={payForRide} disabled={paying} className="mt-3 w-full sm:w-auto">
                      {paying ? "Preparing Paystack..." : "Continue to Paystack"}
                    </Button>
                  )}
                  {paymentFeedback && <p role="status" className="mt-3 text-sm text-orange-950">{paymentFeedback}</p>}
                </div>
              )}

              {ride.ride_status === "completed" && ride.payment_method?.toLowerCase() === "cash" && (
                <div className={`mt-5 rounded-xl border p-4 ${ride.payment_status?.toLowerCase() === "cash_disputed" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                  <p className={`font-semibold ${ride.payment_status?.toLowerCase() === "cash_disputed" ? "text-red-950" : "text-green-950"}`}>
                    {ride.payment_status?.toLowerCase() === "cash_disputed" ? "Cash Payment Disputed — Awaiting KFM Admin Review" : "Cash Payment"}
                  </p>
                  <p className={`mt-1 text-sm ${ride.payment_status?.toLowerCase() === "cash_disputed" ? "text-red-900" : "text-green-900"}`}>
                    {ride.payment_status?.toLowerCase() === "paid"
                      ? "Your driver has confirmed receiving the cash fare. Thank you."
                      : ride.payment_status?.toLowerCase() === "cash_disputed"
                        ? "The driver has reported that the cash fare was not received. This is a report, not a final finding. KFM is reviewing the booking. Please contact KFM if you believe you already paid."
                        : "Your cash payment choice is recorded. The fare is awaiting confirmation from your driver."}
                  </p>
                  {paymentFeedback && <p role="status" className="mt-3 text-sm">{paymentFeedback}</p>}
                </div>
              )}

              {cancelFeedback && (
                <p role="status" className="mt-3 rounded-lg border border-green-600/30 bg-green-600/5 px-4 py-3 text-sm">
                  {cancelFeedback}
                </p>
              )}

              {["requested", "accepted"].includes(ride.ride_status) && (
                <div className="mt-5">
                  <Button
                    variant="destructive"
                    onClick={cancelRide}
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling ride..." : "Cancel Ride"}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cancellation is available before the driver arrives. Once the ride is underway, please contact KFM support.
                  </p>
                </div>
              )}

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
                          className="relative flex items-start gap-4"
                        >
                          {index < statusSteps.length - 1 && (
                            <span
                              aria-hidden="true"
                              className={`absolute left-[17px] top-9 h-7 w-0.5 ${
                                index < statusIndex ? "bg-primary" : "bg-border"
                              }`}
                            />
                          )}
                          <div
                            className={`relative z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
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

              {driver ? (
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
    {ride.ride_status === "requested" && (
      <p className="mt-2 text-sm text-muted-foreground">
        Your driver is assigned to this booking. The ride is waiting for the driver to accept.
      </p>
    )}
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
              <div className="flex items-center gap-3">
                <Navigation className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">
                    {location ? "Live Driver Location" : "Trip Map & Route"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {location
                      ? `Driver GPS last updated ${new Date(location.updated_at).toLocaleTimeString()}`
                      : "Map and route preview. Live driver GPS appears when the ride is active and a recent location is available."}
                  </p>
                </div>
              </div>

              {location ? (
                <div className="mt-4 overflow-hidden rounded-xl border">
                  <iframe
                    title="Live KFM driver location map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.006}%2C${location.latitude - 0.006}%2C${location.longitude + 0.006}%2C${location.latitude + 0.006}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`}
                    className="h-80 w-full"
                    loading="lazy"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                    <span className="text-muted-foreground">
                      {location.accuracy_m != null ? `GPS accuracy about ${Math.round(location.accuracy_m)} m` : "GPS location received"}
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary underline underline-offset-4"
                    >
                      Open full live map
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 overflow-hidden rounded-xl border">
                    <iframe
                      title="KFM trip route preview"
                      src={`https://www.google.com/maps?output=embed&saddr=${encodeURIComponent(`${ride.pickup_town}, ${ride.pickup_area}`)}&daddr=${encodeURIComponent(`${ride.destination_town}, ${ride.destination_area}`)}`}
                      className="h-80 w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {["accepted", "arrived", "in_progress"].includes(String(ride.ride_status || "").toLowerCase())
                        ? "Waiting for a recent GPS position from your driver. This is the route preview, not live tracking."
                        : "This is a route preview. Live driver tracking starts when the ride is active and GPS is available."}
                    </p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${ride.pickup_town}, ${ride.pickup_area}`)}&destination=${encodeURIComponent(`${ride.destination_town}, ${ride.destination_area}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 font-medium text-primary underline underline-offset-4"
                    >
                      Open route in Maps
                    </a>
                  </div>
                </>
              )}
            </section>

            <div className="text-center text-sm text-muted-foreground">
              Keep your booking number for reference.
            </div>
          </div>
        )}
      </div>
        {ride && ride.ride_status === "completed" && (
          ["pending", ""].includes(String(ride.payment_method || "").toLowerCase()) ||
          (ride.payment_method?.toLowerCase() === "cash" && ride.payment_status?.toLowerCase() === "unpaid")
        ) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="ride-payment-title">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">KFM Transport</p>
              <h2 id="ride-payment-title" className="mt-2 text-2xl font-bold">How would you like to pay?</h2>
              <p className="mt-2 text-sm text-gray-600">Your ride is complete. Please choose how you will settle the fare of <strong>GH₵{Number(ride.fare_estimate || 0).toFixed(2)}</strong>.</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border p-4">
                  <p className="font-semibold">Pay Online with Paystack</p>
                  <p className="mt-1 text-sm text-gray-600">Pay securely using Mobile Money or a bank card.</p>
                  <label htmlFor="paymentEmail" className="mt-3 block text-sm font-medium">Email for your payment receipt</label>
                  <input id="paymentEmail" type="email" value={paymentEmail} onChange={(event) => setPaymentEmail(event.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                  <Button onClick={payForRide} disabled={paying || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentEmail.trim())} className="mt-3 w-full">{paying ? "Preparing secure payment..." : "Pay Online"}</Button>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="font-semibold">Pay Cash to Driver</p>
                  <p className="mt-1 text-sm text-gray-600">Choose this only if you are handing the full fare directly to your driver.</p>
                  <Button onClick={chooseCashPayment} disabled={cashPaying} variant="outline" className="mt-3 w-full">{cashPaying ? "Recording choice..." : "Pay Cash to Driver"}</Button>
                </div>
              </div>
              {paymentFeedback && <p role="status" className="mt-4 text-sm text-red-700">{paymentFeedback}</p>}
            </div>
          </div>
        )}

    </main>
  )
}
