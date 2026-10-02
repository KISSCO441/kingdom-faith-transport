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
availability: string | null
profile_photo_url: string | null
}

type RideRequest = {
id: string
booking_number: string | null
pickup_location: string | null
destination: string | null
vehicle_type: string | null
status: string | null
fare: number | null
created_at: string
}

export default function DriverDashboardPage() {
const [driver, setDriver] = useState<Driver | null>(null)
const [rideRequests, setRideRequests] = useState<RideRequest[]>([])
const [loading, setLoading] = useState(true)
const [loadingRides, setLoadingRides] = useState(false)
const [updatingAvailability, setUpdatingAvailability] = useState(false)
const [error, setError] = useState("")
const [success, setSuccess] = useState("")

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
setLoading(true)
setError("")

```
try {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    setError(
      "You must be signed in to access the KFM Driver Dashboard.",
    )
    return
  }

  const { data, error: driverError } = await supabase
    .from("drivers")
    .select(
      `
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
      `,
    )
    .eq("id", user.id)
    .single()

  if (driverError) {
    throw driverError
  }

  setDriver(data)
} catch (err) {
  console.error("Driver dashboard error:", err)

  setError(
    err instanceof Error
      ? err.message
      : "Unable to load your driver profile.",
  )
} finally {
  setLoading(false)
}
```

}

async function loadAssignedRideRequests() {
if (!driver) return

```
setLoadingRides(true)

try {
  const { data, error: rideError } = await supabase
    .from("ride_requests")
    .select(
      `
        id,
        booking_number,
        pickup_location,
        destination,
        vehicle_type,
        status,
        fare,
        created_at
      `,
    )
    .eq("driver_id", driver.id)
    .order("created_at", { ascending: false })

  if (rideError) {
    throw rideError
  }

  setRideRequests(data || [])
} catch (err) {
  console.error("Assigned ride requests error:", err)

  setError(
    err instanceof Error
      ? err.message
      : "Unable to load assigned ride requests.",
  )
} finally {
  setLoadingRides(false)
}
```

}

async function updateAvailability(
newAvailability: "ONLINE" | "OFFLINE",
) {
if (!driver) return

```
setUpdatingAvailability(true)
setError("")
setSuccess("")

try {
  if (driver.status !== "VERIFIED") {
    throw new Error(
      "Your KFM driver account must be VERIFIED before you can go online.",
    )
  }

  const { data, error: updateError } = await supabase
    .from("drivers")
    .update({
      availability: newAvailability,
      updated_at: new Date().toISOString(),
    })
    .eq("id", driver.id)
    .select(
      `
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
      `,
    )
    .single()

  if (updateError) {
    throw updateError
  }

  setDriver(data)

  setSuccess(
    newAvailability === "ONLINE"
      ? "You are now ONLINE and available for KFM ride requests."
      : "You are now OFFLINE and will not receive new KFM ride requests.",
  )
} catch (err) {
  console.error("Availability update error:", err)

  setError(
    err instanceof Error
      ? err.message
      : "Unable to update your availability.",
  )
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
return ( <main className="min-h-screen bg-muted/40"> <div className="mx-auto max-w-5xl px-4 py-16"> <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm"> <Clock className="mx-auto h-8 w-8 animate-pulse text-primary" />

```
        <h1 className="mt-4 text-xl font-semibold">
          Loading KFM Driver Dashboard
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Please wait while we load your driver profile.
        </p>
      </div>
    </div>
  </main>
)
```

}

if (error && !driver) {
return ( <main className="min-h-screen bg-muted/40"> <div className="mx-auto max-w-3xl px-4 py-16"> <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm"> <ShieldCheck className="mx-auto h-12 w-12 text-destructive" />

```
        <h1 className="mt-4 text-2xl font-bold">
          KFM Driver Dashboard
        </h1>

        <p className="mt-4 text-sm text-destructive">
          {error}
        </p>

        <Button
          className="mt-6"
          variant="outline"
          onClick={() => {
            window.location.href = "/"
          }}
        >
          Return to KFM Transport
        </Button>
      </div>
    </div>
  </main>
)
```

}

if (!driver) {
return null
}

const isVerified = driver.status === "VERIFIED"
const isOnline = driver.availability === "ONLINE"
const isCar = driver.vehicle_type?.toLowerCase() === "car"

return ( <main className="min-h-screen bg-muted/40"> <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
{/* Header */} <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"> <div> <p className="text-sm font-semibold uppercase tracking-wider text-primary">
KFM Transport </p>

```
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Driver Dashboard
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage your driver availability and KFM ride requests.
        </p>
      </div>

      <Button
        variant="outline"
        onClick={handleSignOut}
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>

    {/* Status messages */}
    {error && (
      <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    )}

    {success && (
      <div className="mt-6 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        {success}
      </div>
    )}

    {/* Verification status */}
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              KFM Driver Verification
            </p>

            <p className="mt-1 text-xl font-bold">
              {isVerified ? "VERIFIED" : driver.status || "PENDING"}
            </p>
          </div>
        </div>

        {isVerified ? (
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Approved by KFM
          </div>
        ) : (
          <div className="rounded-full bg-muted px-4 py-2 text-sm font-medium">
            Verification required
          </div>
        )}
      </div>

      {!isVerified && (
        <p className="mt-5 text-sm text-muted-foreground">
          Your driver account must be verified by KFM before you
          can go online or receive customer ride requests.
        </p>
      )}
    </div>

    {/* Availability */}
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Driver Availability
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {isOnline ? "You are ONLINE" : "You are OFFLINE"}
          </h2>

          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {isOnline
              ? "KFM can now consider you for eligible customer ride requests."
              : "You will not receive new KFM ride requests while offline."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            size="lg"
            disabled={
              updatingAvailability ||
              !isVerified ||
              isOnline
            }
            onClick={() => updateAvailability("ONLINE")}
            className="gap-2"
          >
            <Wifi className="h-4 w-4" />
            {updatingAvailability && !isOnline
              ? "Going Online..."
              : "Go Online"}
          </Button>

          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={
              updatingAvailability ||
              !isOnline
            }
            onClick={() => updateAvailability("OFFLINE")}
            className="gap-2"
          >
            <WifiOff className="h-4 w-4" />
            {updatingAvailability && isOnline
              ? "Going Offline..."
              : "Go Offline"}
          </Button>
        </div>
      </div>
    </div>

    {/* Driver profile */}
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-primary" />

          <h2 className="text-lg font-semibold">
            Driver Profile
          </h2>
        </div>

        <div className="mt-6 space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Full Name</p>
            <p className="mt-1 font-medium">
              {driver.full_name || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Phone</p>
            <p className="mt-1 font-medium">
              {driver.phone || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="mt-1 font-medium">
              {driver.email || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">
              Operating Location
            </p>
            <p className="mt-1 font-medium">
              {driver.operating_town || "Not provided"}
              {driver.operating_area
                ? ` — ${driver.operating_area}`
                : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          {isCar ? (
            <Car className="h-5 w-5 text-primary" />
          ) : (
            <Bike className="h-5 w-5 text-primary" />
          )}

          <h2 className="text-lg font-semibold">
            Vehicle Information
          </h2>
        </div>

        <div className="mt-6 space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Vehicle Type</p>
            <p className="mt-1 font-medium">
              {driver.vehicle_type || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Vehicle</p>
            <p className="mt-1 font-medium">
              {driver.vehicle_name || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">
              Registration Number
            </p>
            <p className="mt-1 font-medium">
              {driver.vehicle_registration || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Colour</p>
            <p className="mt-1 font-medium">
              {driver.vehicle_color || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">
              Driver's Licence
            </p>
            <p className="mt-1 font-medium">
              {driver.driver_license_number || "Not provided"}
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Assigned Ride Requests */}
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Ride Requests
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Assigned Rides
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Ride requests assigned to you by the KFM driver matching system
            will appear here.
          </p>
        </div>

        <div className="hidden rounded-full bg-muted p-3 sm:block">
          <Car className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {loadingRides && rideRequests.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-6 text-center">
          <Clock className="mx-auto h-6 w-6 animate-pulse text-primary" />

          <p className="mt-3 text-sm text-muted-foreground">
            Checking for assigned ride requests...
          </p>
        </div>
      ) : rideRequests.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <Car className="mx-auto h-8 w-8 text-muted-foreground" />

          <h3 className="mt-3 font-semibold">
            No assigned rides yet
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            When the KFM matching system assigns a ride to you,
            it will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {rideRequests.map((ride) => (
            <div
              key={ride.id}
              className="rounded-xl border border-border bg-muted/20 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    KFM Booking Number
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {ride.booking_number || "Booking number unavailable"}
                  </p>
                </div>

                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium">
                  {ride.status || "ASSIGNED"}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pickup
                  </p>

                  <p className="mt-1 font-medium">
                    {ride.pickup_location || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Destination
                  </p>

                  <p className="mt-1 font-medium">
                    {ride.destination || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vehicle Requested
                  </p>

                  <p className="mt-1 font-medium">
                    {ride.vehicle_type || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Fare
                  </p>

                  <p className="mt-1 font-medium">
                    {ride.fare !== null
                      ? `GH₵ ${Number(ride.fare).toFixed(2)}`
                      : "Fare not available"}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Requested{" "}
                  {new Date(ride.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</main>
```

)
}
