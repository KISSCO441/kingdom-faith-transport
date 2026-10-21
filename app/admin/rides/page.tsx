
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase as supabaseClient } from "@/lib/supabase"
import {
  AlertCircle,
  Banknote,
  Car,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Phone,
  RefreshCw,
  User,
} from "lucide-react"

type Driver = {
  id: string
  full_name: string
  phone: string
}

type RideRejection = {
  driver_id: string
  driver_name: string
  rejected_at: string
}

type Ride = {
  id: string
  created_at: string | null
  booking_code: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  vehicle_type: string
  ride_option: string
  pickup_town: string
  pickup_area: string
  destination_town: string
  destination_area: string
  when_option: string
  notes: string | null
  ride_status: string
  payment_status: string
  driver_id: string | null
  fare_estimate: number | null
  payment_method: string
  payment_reference: string | null
  payment_paid_at: string | null
  driver: Driver | null
  rejection_history: RideRejection[]
}

export default function AdminRidesPage() {
  const [rides, setRides] = useState<Ride[]>([])
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const loadRides = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")

      const { data: sessionData, error: sessionError } =
        await supabaseClient!.auth.getSession()

      const accessToken = sessionData.session?.access_token

      if (sessionError || !accessToken) {
        throw new Error("Please sign in again to access ride bookings.")
      }

      const response = await fetch("/api/admin/rides", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load ride bookings.")
      }

      const loadedRides: Ride[] = data.rides ?? []
      setRides(loadedRides)

      setSelectedRideId((current) => {
        if (current && loadedRides.some((ride) => ride.id === current)) {
          return current
        }

        return loadedRides[0]?.id ?? null
      })
    } catch (err) {
      console.error("Admin rides dashboard error:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load ride bookings."
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadRides()
  }, [loadRides])

  const selectedRide = useMemo(
    () => rides.find((ride) => ride.id === selectedRideId) ?? null,
    [rides, selectedRideId]
  )

  const completedRides = rides.filter(
    (ride) => ride.ride_status?.toUpperCase() === "COMPLETED"
  ).length

  const paidRides = rides.filter(
    (ride) => ride.payment_status?.toUpperCase() === "PAID"
  )

  const outstandingRides = rides.filter(
    (ride) => ride.payment_status?.toUpperCase() !== "PAID"
  )

  const outstandingAmount = outstandingRides.reduce(
    (total, ride) => total + Number(ride.fare_estimate || 0),
    0
  )

  const paidAmount = paidRides.reduce(
    (total, ride) => total + Number(ride.fare_estimate || 0),
    0
  )

  function formatCurrency(amount: number | null) {
    return `GH₵${Number(amount || 0).toFixed(2)}`
  }

  function formatDate(date: string | null) {
    if (!date) return "Not recorded"

    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return "Not recorded"

    return parsed.toLocaleString("en-GH", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  function statusClass(status: string) {
    const value = status?.toUpperCase()

    if (["PAID", "COMPLETED"].includes(value)) {
      return "bg-green-100 text-green-700"
    }

    if (["CANCELLED", "FAILED", "REJECTED"].includes(value)) {
      return "bg-red-100 text-red-700"
    }

    if (["ACCEPTED", "ARRIVED", "IN_PROGRESS"].includes(value)) {
      return "bg-blue-100 text-blue-700"
    }

    return "bg-amber-100 text-amber-800"
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-slate-500" />
          <p className="text-slate-600">Loading KFM ride bookings...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium uppercase tracking-wider text-amber-400">
              KFM Administration
            </p>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Ride Bookings &amp; Payments
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Monitor customer rides, assigned drivers, fares and payment records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadRides(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh Rides"}
          </button>
        </header>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load ride bookings</p>
              <p className="mt-1 text-sm">{error}</p>
              <button
                type="button"
                onClick={() => void loadRides()}
                className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Bookings"
            value={String(rides.length)}
            icon={<Car className="h-6 w-6 text-slate-700" />}
          />
          <SummaryCard
            label="Completed Rides"
            value={String(completedRides)}
            icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
          />
          <SummaryCard
            label="Recorded Payments"
            value={formatCurrency(paidAmount)}
            icon={<CreditCard className="h-6 w-6 text-green-600" />}
          />
          <SummaryCard
            label="Unpaid Booking Fares"
            value={formatCurrency(outstandingAmount)}
            icon={<Clock3 className="h-6 w-6 text-amber-600" />}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-bold text-slate-900">Ride Bookings</h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a booking to inspect its details.
              </p>
            </div>

            {rides.length === 0 ? (
              <div className="p-8 text-center">
                <Car className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">
                  No ride bookings found.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Customer bookings will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {rides.map((ride) => (
                  <button
                    key={ride.id}
                    type="button"
                    onClick={() => setSelectedRideId(ride.id)}
                    className={`w-full p-5 text-left transition ${
                      ride.id === selectedRideId
                        ? "bg-slate-100"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">
                          {ride.booking_code}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {ride.customer_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(ride.created_at)}
                        </p>
                      </div>
                      <p className="shrink-0 font-bold text-slate-900">
                        {formatCurrency(ride.fare_estimate)}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(ride.ride_status)}`}
                      >
                        {ride.ride_status}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(ride.payment_status)}`}
                      >
                        {ride.payment_status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="min-w-0 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {!selectedRide ? (
              <div className="flex min-h-96 items-center justify-center text-center">
                <div>
                  <Car className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4 font-semibold text-slate-700">
                    Select a ride booking
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    The booking and payment details will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Ride Booking</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">
                      {selectedRide.booking_code}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Booked {formatDate(selectedRide.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(selectedRide.ride_status)}`}
                    >
                      RIDE: {selectedRide.ride_status}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(selectedRide.payment_status)}`}
                    >
                      PAYMENT: {selectedRide.payment_status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 py-6 md:grid-cols-2">
                  <InfoCard
                    title="Customer Information"
                    icon={<User className="h-5 w-5" />}
                  >
                    <InfoRow label="Name" value={selectedRide.customer_name} />
                    <InfoRow label="Phone">
                      <a
                        href={`tel:${selectedRide.customer_phone}`}
                        className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        {selectedRide.customer_phone}
                      </a>
                    </InfoRow>
                    <InfoRow
                      label="Email"
                      value={selectedRide.customer_email || "Not provided"}
                    />
                  </InfoCard>

                  <InfoCard
                    title="Ride Information"
                    icon={<MapPin className="h-5 w-5" />}
                  >
                    <InfoRow label="Vehicle" value={selectedRide.vehicle_type} />
                    <InfoRow label="Ride option" value={selectedRide.ride_option} />
                    <InfoRow
                      label="Pickup"
                      value={`${selectedRide.pickup_area}, ${selectedRide.pickup_town}`}
                    />
                    <InfoRow
                      label="Destination"
                      value={`${selectedRide.destination_area}, ${selectedRide.destination_town}`}
                    />
                    <InfoRow label="Schedule" value={selectedRide.when_option} />
                    {selectedRide.notes && (
                      <InfoRow label="Customer notes" value={selectedRide.notes} />
                    )}
                  </InfoCard>

                  <InfoCard
                    title="Assigned Driver"
                    icon={<Phone className="h-5 w-5" />}
                  >
                    {selectedRide.driver ? (
                      <>
                        <InfoRow
                          label="Name"
                          value={selectedRide.driver.full_name}
                        />
                        <InfoRow label="Phone">
                          <a
                            href={`tel:${selectedRide.driver.phone}`}
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            {selectedRide.driver.phone}
                          </a>
                        </InfoRow>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No driver is currently assigned.
                      </p>
                    )}
                  </InfoCard>

                  <InfoCard
                    title="Payment Information"
                    icon={<Banknote className="h-5 w-5" />}
                  >
                    <InfoRow
                      label="Fare"
                      value={formatCurrency(selectedRide.fare_estimate)}
                    />
                    <InfoRow
                      label="Payment method"
                      value={selectedRide.payment_method}
                    />
                    <InfoRow
                      label="Payment status"
                      value={selectedRide.payment_status}
                    />
                    <InfoRow
                      label="Payment reference"
                      value={selectedRide.payment_reference || "Not recorded"}
                    />
                    <InfoRow
                      label="Payment date"
                      value={formatDate(selectedRide.payment_paid_at)}
                    />
                  </InfoCard>
                </div>

                <section className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-bold">Driver Rejection History</h3>
                  </div>

                  {(selectedRide.rejection_history ?? []).length === 0 ? (
                    <p className="mt-3 text-sm text-slate-600">
                      No driver rejections have been recorded for this booking.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {selectedRide.rejection_history.map((rejection) => (
                        <div
                          key={`${rejection.driver_id}-${rejection.rejected_at}`}
                          className="rounded-lg border border-red-100 bg-white p-4"
                        >
                          <p className="font-semibold text-slate-900">
                            {rejection.driver_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Rejected on: {formatDate(rejection.rejected_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Payment confirmation</p>
                  <p className="mt-1">
                    This dashboard is currently read-only. A completed ride is
                    not automatically treated as paid. Cash receipts and
                    Paystack transactions will require separate verification
                    before payment records can be updated.
                  </p>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">{icon}</div>
      </div>
    </div>
  )
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-5">
      <div className="mb-4 flex items-center gap-2 text-slate-700">
        {icon}
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-3 text-sm">{children}</div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <div className="mt-0.5 break-words font-semibold text-slate-900">
        {children ?? value ?? "—"}
      </div>
    </div>
  )
}
