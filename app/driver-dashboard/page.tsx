"use client"

import { useEffect, useState } from "react"
import {
Bike,
Car,
CheckCircle2,
Clock,
LogOut,
ShieldCheck,
User,
Wifi,
WifiOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase as supabaseClient } from "@/lib/supabase"

if (!supabaseClient) {
throw new Error("Supabase client is not configured.")
}

const supabase = supabaseClient

type Driver = {
id: string
full_name: string | null
phone: string | null
email: string | null
vehicle_type: string | null
vehicle_name: string | null
vehicle_registration: string | null
vehicle_color: string | null
operating_town: string | null
operating_area: string | null
driver_license_number: string | null
status: string | null
availability: "ONLINE" | "OFFLINE" | null
profile_photo_url: string | null
}

type RideRequest = {
id: string
booking_code: string | null
customer_name: string | null
customer_phone: string | null
pickup_town: string | null
pickup_area: string | null
destination_town: string | null
destination_area: string | null
vehicle_type: string | null
ride_status: string | null
fare_estimate: number | null
created_at: string
}

export default function DriverDashboardPage() {
const [driver, setDriver] = useState<Driver | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState("")
const [updatingAvailability, setUpdatingAvailability] = useState(false)

const [rideRequests, setRideRequests] = useState<RideRequest[]>([])
const [loadingRides, setLoadingRides] = useState(false)

useEffect(() => {
loadDriver()
}, [])

useEffect(() => {
if (!driver) return

```
loadAssignedRideRequests()

const interval = window.setInterval(() => {
  loadAssignedRideRequests()
}, 10000)

return () => window.clearInterval(interval)
```

}, [driver])

async function loadDriver() {
try {
setLoading(true)
setError("")

```
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    setError("You are not logged in.")
    setLoading(false)
    return
  }

  const { data, error: driverError } = await supabase
    .from("drivers")
    .select(`
      id,
      full_name,
      phone,
      email,
      vehicle_type,
      vehicle_name,
      vehicle_registration,
      vehicle_color,
      operating_town,
      operating_area,
      driver_license_number,
      status,
      availability,
      profile_photo_url
    `)
    .eq("id", user.id)
    .single()

  if (driverError) {
    throw driverError
  }

  setDriver(data as Driver)
} catch (err) {
  console.error("Driver loading error:", err)
  setError("Unable to load your driver profile.")
} finally {
  setLoading(false)
}
```

}

async function loadAssignedRideRequests() {
if (!driver) return

```
try {
  setLoadingRides(true)

  const { data, error: ridesError } = await supabase
    .from("ride_requests")
    .select(`
      id,
      booking_code,
      customer_name,
      customer_phone,
      pickup_town,
      pickup_area,
      destination_town,
      destination_area,
      vehicle_type,
      ride_status,
      fare_estimate,
      created_at
    `)
    .eq("driver_id", driver.id)
    .order("created_at", { ascending: false })

  if (ridesError) {
    throw ridesError
  }

  setRideRequests((data || []) as RideRequest[])
} catch (err) {
  console.error("Assigned ride loading error:", err)
  setRideRequests([])
} finally {
  setLoadingRides(false)
}
```

}

async function updateAvailability(
newAvailability: "ONLINE" | "OFFLINE"
) {
if (!driver) return

```
if (driver.status !== "VERIFIED") {
  setError("Your driver account must be verified before going online.")
  return
}

try {
  setUpdatingAvailability(true)
  setError("")

  const { data, error: updateError } = await supabase
    .from("drivers")
    .update({
      availability: newAvailability,
    })
    .eq("id", driver.id)
    .select()
    .single()

  if (updateError) {
    throw updateError
  }

  setDriver(data as Driver)
} catch (err) {
  console.error("Availability update error:", err)
  setError("Unable to update your availability.")
} finally {
  setUpdatingAvailability(false)
}
```

}

async function handleSignOut() {
await supabase.auth.signOut()
window.location.href = "/"
}

if (loading) {
return ( <main className="min-h-screen bg-gray-50 px-4 py-10"> <div className="mx-auto max-w-5xl"> <div className="rounded-2xl border bg-white p-8 text-center shadow-sm"> <Clock className="mx-auto h-10 w-10 animate-pulse text-gray-500" /> <p className="mt-4 text-gray-600">
Loading your driver dashboard... </p> </div> </div> </main>
)
}

if (!driver) {
return ( <main className="min-h-screen bg-gray-50 px-4 py-10"> <div className="mx-auto max-w-5xl"> <div className="rounded-2xl border bg-white p-8 text-center shadow-sm"> <User className="mx-auto h-12 w-12 text-gray-400" />

```
        <h1 className="mt-4 text-2xl font-bold">
          Driver Profile Not Found
        </h1>

        <p className="mt-2 text-gray-600">
          {error || "We could not find your driver profile."}
        </p>

        <Button
          className="mt-6"
          onClick={() => {
            window.location.href = "/driver-registration"
          }}
        >
          Register as a Driver
        </Button>
      </div>
    </div>
  </main>
)
```

}

const isOnline = driver.availability === "ONLINE"
const isVerified = driver.status === "VERIFIED"

return ( <main className="min-h-screen bg-gray-50 px-4 py-8"> <div className="mx-auto max-w-6xl space-y-6">

```
    {/* Header */}
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">
          Kingdom Faith Marketplace Transport
        </p>

        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          Driver Dashboard
        </h1>

        <p className="mt-1 text-gray-600">
          Welcome, {driver.full_name || "Driver"}
        </p>
      </div>

      <Button
        variant="outline"
        onClick={handleSignOut}
        className="w-full md:w-auto"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>

    {/* Error */}
    {error && (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )}

    {/* Profile + Verification */}
    <div className="grid gap-6 md:grid-cols-2">

      {/* Driver Profile */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gray-100 p-3">
            <User className="h-6 w-6 text-gray-700" />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              Driver Profile
            </h2>

            <p className="text-sm text-gray-500">
              Your registered driver information
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Full Name
            </p>
            <p className="mt-1 font-medium">
              {driver.full_name || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Phone
            </p>
            <p className="mt-1 font-medium">
              {driver.phone || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Email
            </p>
            <p className="mt-1 font-medium">
              {driver.email || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Operating Town
            </p>
            <p className="mt-1 font-medium">
              {driver.operating_town || "Not provided"}
              {driver.operating_area
                ? ` — ${driver.operating_area}`
                : ""}
            </p>
          </div>

        </div>
      </section>

      {/* Verification */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gray-100 p-3">
            <ShieldCheck className="h-6 w-6 text-gray-700" />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              Driver Verification
            </h2>

            <p className="text-sm text-gray-500">
              Your KFM driver account status
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Verification Status
              </p>

              <p className="mt-1 font-semibold">
                {driver.status || "PENDING"}
              </p>
            </div>

            {isVerified ? (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            ) : (
              <Clock className="h-8 w-8 text-yellow-600" />
            )}
          </div>

          <div className="mt-5">
            {isVerified ? (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                Your driver account has been verified by KFM.
              </div>
            ) : (
              <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
                Your driver account is waiting for verification.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>

    {/* Vehicle */}
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-gray-100 p-3">
          {driver.vehicle_type?.toLowerCase() === "okada" ? (
            <Bike className="h-6 w-6 text-gray-700" />
          ) : (
            <Car className="h-6 w-6 text-gray-700" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold">
            Vehicle Information
          </h2>

          <p className="text-sm text-gray-500">
            Vehicle registered to your driver account
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        <div>
          <p className="text-xs font-medium uppercase text-gray-500">
            Vehicle Type
          </p>
          <p className="mt-1 font-semibold">
            {driver.vehicle_type || "Not provided"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-gray-500">
            Vehicle Name
          </p>
          <p className="mt-1 font-semibold">
            {driver.vehicle_name || "Not provided"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-gray-500">
            Registration
          </p>
          <p className="mt-1 font-semibold">
            {driver.vehicle_registration || "Not provided"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-gray-500">
            Color
          </p>
          <p className="mt-1 font-semibold">
            {driver.vehicle_color || "Not provided"}
          </p>
        </div>

      </div>
    </section>

    {/* Availability */}
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-3">
          <div
            className={`rounded-full p-3 ${
              isOnline
                ? "bg-green-100"
                : "bg-gray-100"
            }`}
          >
            {isOnline ? (
              <Wifi className="h-6 w-6 text-green-600" />
            ) : (
              <WifiOff className="h-6 w-6 text-gray-600" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold">
              Driver Availability
            </h2>

            <p className="text-sm text-gray-500">
              Control whether you are available to receive ride assignments
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => updateAvailability("ONLINE")}
            disabled={
              updatingAvailability ||
              isOnline ||
              !isVerified
            }
            className="bg-green-600 hover:bg-green-700"
          >
            <Wifi className="mr-2 h-4 w-4" />
            Go Online
          </Button>

          <Button
            variant="outline"
            onClick={() => updateAvailability("OFFLINE")}
            disabled={
              updatingAvailability ||
              !isOnline
            }
          >
            <WifiOff className="mr-2 h-4 w-4" />
            Go Offline
          </Button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border p-4">
        <p className="text-sm text-gray-500">
          Current Availability
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${
              isOnline
                ? "bg-green-500"
                : "bg-gray-400"
            }`}
          />

          <span className="font-semibold">
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>
    </section>

    {/* Assigned Ride Requests */}
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Assigned Ride Requests
          </h2>

          <p className="text-sm text-gray-500">
            Ride requests assigned to you by KFM Transport
          </p>
        </div>

        {loadingRides && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4 animate-pulse" />
            Checking for new rides...
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">

        {rideRequests.length === 0 && !loadingRides ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Car className="mx-auto h-10 w-10 text-gray-400" />

            <h3 className="mt-3 font-semibold text-gray-800">
              No Assigned Ride Requests
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              When a ride is assigned to you, it will appear here.
            </p>
          </div>
        ) : (
          rideRequests.map((ride) => (
            <div
              key={ride.id}
              className="rounded-xl border p-5 transition hover:shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Booking Number
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    {ride.booking_code || ride.id}
                  </h3>
                </div>

                <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  {ride.ride_status || "ASSIGNED"}
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Customer
                  </p>

                  <p className="mt-1 font-medium">
                    {ride.customer_name || "Not provided"}
                  </p>

                  {ride.customer_phone && (
                    <p className="mt-1 text-sm text-gray-500">
                      {ride.customer_phone}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Pickup Location
                  </p>

                  <p className="mt-1 font-medium">
                    {ride.pickup_town || "Not provided"}
                    {ride.pickup_area
                      ? ` — ${ride.pickup_area}`
                      : ""}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Destination
                  </p>

                  <p className="mt-1 font-medium">
                    {ride.destination_town || "Not provided"}
                    {ride.destination_area
                      ? ` — ${ride.destination_area}`
                      : ""}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Vehicle Requested
                  </p>

                  <p className="mt-1 font-medium">
                    {ride.vehicle_type || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Fare
                  </p>

                  <p className="mt-1 font-semibold">
                    {ride.fare_estimate !== null &&
                    ride.fare_estimate !== undefined
                      ? `GH₵ ${Number(ride.fare_estimate).toFixed(2)}`
                      : "Not provided"}
                  </p>
                </div>

              </div>

              <div className="mt-5 border-t pt-4">
                <p className="text-xs text-gray-500">
                  Ride requested
                </p>

                <p className="mt-1 text-sm font-medium">
                  {new Date(
                    ride.created_at
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}

      </div>
    </section>

  </div>
</main>
```

)
}
