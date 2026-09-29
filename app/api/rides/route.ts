```tsx
"use client"

import { useState, type FormEvent } from "react"
import { Car, Bike, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type VehicleType = "car" | "motorbike"

const rideOptions: Record<VehicleType, string[]> = {
  car: ["KFM Go", "KFM Comfort", "KFM XL"],
  motorbike: ["Okada"],
}

/*
 * KFM OKADA LAUNCH ZONES
 * Customer-facing fare only.
 * Driver share, fuel allowance and KFM commission remain internal.
 */
const okadaZones = [
  {
    label: "Zone 1 — Nsawam Central",
    area: "Nsawam Central",
    fare: 15,
  },
  {
    label: "Zone 2 — Adoagyiri / close areas",
    area: "Adoagyiri / close areas",
    fare: 25,
  },
  {
    label: "Zone 3 — Ntoaso / Nsumia area",
    area: "Ntoaso / Nsumia area",
    fare: 40,
  },
  {
    label: "Zone 4 — Sakyikrom / Ahodwo area",
    area: "Sakyikrom / Ahodwo area",
    fare: 60,
  },
  {
    label: "Zone 5 — Fotobi / outer local area",
    area: "Fotobi / outer local area",
    fare: 80,
  },
] as const

const townAreas: Record<string, string[]> = {
  Koforidua: [
    "Central Market",
    "Adweso",
    "Srodae",
    "Zongo",
    "Effiduase",
    "Betom",
    "Two Streams",
    "Galloway",
    "Oyoko",
  ],

  Nkawkaw: [
    "Nkawkaw Station",
    "Zongo",
    "Kwahu Tafo Road",
    "Domeabra",
    "Chief Palace Area",
    "Praso",
    "Nsuta",
  ],

  Nsawam: [
    "Nsawam Station",
    "Adoagyiri",
    "Zongo",
    "Fotobi",
    "Djankrom",
    "Mangoase Road",
    "Old Town",
    "Newtown",
  ],

  Suhum: [
    "Suhum Roundabout",
    "Zongo",
    "Kraboa Coaltar",
    "Nankese",
    "Densuso",
    "Anum Apapam",
  ],

  Akosombo: [
    "Akosombo Township",
    "Atimpoku",
    "Combone",
    "Old Akrade",
    "New Akrade",
    "Dam Site",
  ],

  Begoro: [
    "Begoro Central",
    "Zongo",
    "Osino Road",
    "Nkubem",
    "Ehiamankyene",
  ],

  Kibi: [
    "Kibi Central",
    "Apedwa",
    "Asiakwa",
    "Kwabeng Road",
    "Bunso",
  ],

  Mpraeso: [
    "Mpraeso Central",
    "Nkwatia",
    "Abetifi Road",
    "Bepong",
    "Kwahu Pepease",
  ],

  "Akim Oda": [
    "Oda Central Market",
    "Zongo",
    "Akwatia Road",
    "Swedru Junction",
    "Ofoase",
  ],

  Kade: [
    "Kade Township",
    "Akwatia Road",
    "Asuom",
    "Takrowase",
    "Otwereso",
  ],

  Somanya: [
    "Somanya Central",
    "Kpong Road",
    "Mangoase",
    "Huhunya",
    "Bueryonye",
  ],

  Akropong: [
    "Akropong Central",
    "Akuapem Ridge",
    "Amanokrom",
    "Abiriw",
    "Dawu",
  ],

  Accra: [
    "Central Accra",
    "Madina",
    "Adenta",
    "Abeka",
    "Circle",
    "Airport",
    "Other Accra area",
  ],

  "Other Eastern Region": ["Destination by arrangement"],

  "Other Destination": ["Long-distance trip by arrangement"],
}

const towns = Object.keys(townAreas)

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"

export function BookingForm() {
  const [vehicle, setVehicle] = useState<VehicleType>("car")
  const [submitted, setSubmitted] = useState(false)
  const [bookingCode, setBookingCode] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [pickupTown, setPickupTown] = useState("Nsawam")
  const [destinationTown, setDestinationTown] = useState("Koforidua")

  const [pickupArea, setPickupArea] = useState("")
  const [destinationArea, setDestinationArea] = useState("")

  /*
   * Okada always starts from Nsawam and uses
   * the five approved local destination zones.
   */
  const isOkada = vehicle === "motorbike"

  const availablePickupAreas = isOkada
    ? okadaZones.map((zone) => zone.area)
    : townAreas[pickupTown] || []

  const availableDestinationAreas = isOkada
    ? okadaZones.map((zone) => zone.area)
    : townAreas[destinationTown] || []

  const selectedOkadaZone = isOkada
    ? okadaZones.find((zone) => zone.area === destinationArea)
    : null

  const estimatedFare = selectedOkadaZone?.fare ?? null

  function handleVehicleChange(nextVehicle: VehicleType) {
    setVehicle(nextVehicle)
    setError("")

    if (nextVehicle === "motorbike") {
      setPickupTown("Nsawam")
      setDestinationTown("Nsawam")
      setPickupArea(okadaZones[0].area)
      setDestinationArea(okadaZones[0].area)
    } else {
      setPickupTown("Nsawam")
      setDestinationTown("Koforidua")
      setPickupArea("")
      setDestinationArea("")
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    const bookingData = {
      customer_name: String(formData.get("name") || ""),
      customer_phone: String(formData.get("phone") || ""),
      vehicle_type: vehicle,
      ride_option: String(formData.get("ride") || ""),
      pickup_town: String(formData.get("pickup") || ""),
      pickup_area: String(formData.get("pickupArea") || ""),
      destination_town: String(formData.get("destination") || ""),
      destination_area: String(formData.get("destinationArea") || ""),
      when_option: String(formData.get("when") || ""),
      notes: String(formData.get("notes") || ""),
      fare_estimate: estimatedFare,
    }

    try {
      const response = await fetch("/api/rides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit your ride request.")
      }

      setBookingCode(data.booking?.booking_code || "")
      setSubmitted(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your ride request. Please try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="book" className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Order a ride
          </p>

          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Where are you going?
          </h2>

          <p className="mt-4 text-pretty text-muted-foreground">
            Set your pickup and destination, choose your vehicle, and request
            your KFM trip.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              "Submit your ride request",
              "Receive a unique KFM booking number",
              "KFM can assign a driver to your request",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {item}
              </li>
            ))}
          </ul>

          {isOkada && (
            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold">KFM Okada service area</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Okada service is currently limited to approved Nsawam-area
                destinations.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="h-14 w-14 text-primary" />

              <h3 className="mt-4 text-xl font-semibold">
                Ride request received
              </h3>

              {bookingCode && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your KFM booking number
                  </p>

                  <p className="mt-1 text-2xl font-bold tracking-wide">
                    {bookingCode}
                  </p>
                </div>
              )}

              {estimatedFare !== null && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Estimated fare
                  </p>
                  <p className="text-2xl font-bold">
                    GH₵{estimatedFare}
                  </p>
                </div>
              )}

              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                Keep your booking number. KFM can use it to identify and manage
                your ride request.
              </p>

              <Button
                className="mt-6"
                variant="outline"
                onClick={() => {
                  setSubmitted(false)
                  setBookingCode("")
                  setError("")
                  setEstimatedFareReset()
                }}
              >
                Order another ride
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <span className="mb-2 block text-sm font-medium">
                  Vehicle type
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { key: "car", label: "Car", icon: Car },
                      { key: "motorbike", label: "Okada", icon: Bike },
                    ] as const
                  ).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleVehicleChange(key)}
                      aria-pressed={vehicle === key}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                        vehicle === key
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-input text-muted-foreground hover:border-ring",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {isOkada ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="pickup" className="text-sm font-medium">
                      Pickup area
                    </label>

                    <select
                      id="pickup"
                      name="pickup"
                      required
                      className={fieldClass}
                      value={pickupArea}
                      onChange={(e) => setPickupArea(e.target.value)}
                    >
                      <option value="">Select pickup area</option>
                      {availablePickupAreas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input type="hidden" name="pickupTown" value="Nsawam" />

                  <div className="space-y-2">
                    <label
                      htmlFor="destinationArea"
                      className="text-sm font-medium"
                    >
                      Okada destination
                    </label>

                    <select
                      id="destinationArea"
                      name="destinationArea"
                      required
                      className={fieldClass}
                      value={destinationArea}
                      onChange={(e) => setDestinationArea(e.target.value)}
                    >
                      <option value="">Select destination</option>
                      {okadaZones.map((zone) => (
                        <option key={zone.area} value={zone.area}>
                          {zone.label} — GH₵{zone.fare}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="hidden"
                    name="destination"
                    value="Nsawam"
                  />

                  {estimatedFare !== null && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
                      <p className="text-sm text-muted-foreground">
                        Estimated fare
                      </p>
                      <p className="mt-1 text-3xl font-bold">
                        GH₵{estimatedFare}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="pickup" className="text-sm font-medium">
                        Pickup town
                      </label>

                      <select
                        id="pickup"
                        name="pickup"
                        required
                        className={fieldClass}
                        value={pickupTown}
                        onChange={(e) => {
                          setPickupTown(e.target.value)
                          setPickupArea("")
                        }}
                      >
                        {towns.map((town) => (
                          <option key={town} value={town}>
                            {town}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="pickupArea"
                        className="text-sm font-medium"
                      >
                        Local area in {pickupTown}
                      </label>

                      <select
                        id="pickupArea"
                        name="pickupArea"
                        required
                        className={fieldClass}
                        value={pickupArea}
                        onChange={(e) => setPickupArea(e.target.value)}
                      >
                        <option value="">Select area</option>
                        {(townAreas[pickupTown] || []).map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="destination"
                        className="text-sm font-medium"
                      >
                        Destination town
                      </label>

                      <select
                        id="destination"
                        name="destination"
                        required
                        className={fieldClass}
                        value={destinationTown}
                        onChange={(e) => {
                          setDestinationTown(e.target.value)
                          setDestinationArea("")
                        }}
                      >
                        {towns.map((town) => (
                          <option key={town} value={town}>
                            {town}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="destinationArea"
                        className="text-sm font-medium"
                      >
                        Local area in {destinationTown}
                      </label>

                      <select
                        id="destinationArea"
                        name="destinationArea"
                        required
                        className={fieldClass}
                        value={destinationArea}
                        onChange={(e) => setDestinationArea(e.target.value)}
                      >
                        <option value="">Select area</option>
                        {(townAreas[destinationTown] || []).map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full name
                  </label>

                  <input
                    id="name"
                    name="name"
                    required
                    className={fieldClass}
                    placeholder="Ama Mensah"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className={fieldClass}
                    placeholder="024 123 4567"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="ride" className="text-sm font-medium">
                    Ride option
                  </label>

                  <select
                    id="ride"
                    name="ride"
                    required
                    className={fieldClass}
                  >
                    {rideOptions[vehicle].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="when" className="text-sm font-medium">
                    When
                  </label>

                  <select
                    id="when"
                    name="when"
                    required
                    className={fieldClass}
                  >
                    <option value="now">Pick me up now</option>
                    <option value="15">In 15 minutes</option>
                    <option value="30">In 30 minutes</option>
                    <option value="schedule">Schedule for later</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes for driver{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className={cn(fieldClass, "resize-none")}
                  placeholder="Any landmark details or special requests?"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting ride request..." : "Request ride"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
```
