"use client"

import { useState } from "react"
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

  async function checkRideStatus() {
    const code = bookingCode.trim().toUpperCase()

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
              onClick={checkRideStatus}
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
                              <span className="text-xs font-semibold">
                                {index + 1}
                              </span>
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

            <div className="text-center text-sm text-muted-foreground">
              Keep your booking number for reference.
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
