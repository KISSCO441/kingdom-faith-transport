"use client"

import { useState, type FormEvent } from "react"
import { Car, Bike, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type VehicleType = "car" | "motorbike"

type OkadaZone = {
  label: string
  fare: number
}

const okadaZones: OkadaZone[] = [
  { label: "Nsawam Central", fare: 15 },
  { label: "Adoagyiri / Close Areas", fare: 25 },
  { label: "Ntoaso / Nsumia Area", fare: 40 },
  { label: "Sakyikrom / Ahodwo Area", fare: 60 },
  { label: "Fotobi / Outer Local Area", fare: 80 },
]

const townAreas: Record<string, string[]> = {
  Nsawam: [
    "Nsawam Station",
    "Adoagyiri",
    "Zongo",
    "Fotobi",
    "Ntoaso",
    "Nsumia",
    "Sakyikrom",
    "Ahodwo",
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
    "Accra Central",
    "Circle",
    "Madina",
    "Lapaz",
    "Achimota",
    "Airport",
    "Other Area",
  ],
}

const carTowns = Object.keys(townAreas)

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"

export function BookingForm() {
  const [vehicle, setVehicle] = useState<VehicleType>("car")
  const [submitted, setSubmitted] = useState(false)
  const [bookingCode, setBookingCode] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [pickupTown, setPickupTown] = useState("Nsawam")
  const [pickupArea, setPickupArea] = useState("Nsawam Station")

  const [destinationTown, setDestinationTown] = useState("Koforidua")
  const [destinationArea, setDestinationArea] =
    useState("Central Market")

  const [okadaZone, setOkadaZone] = useState("")

  const isOkada = vehicle === "motorbike"

  const selectedOkadaZone = okadaZones.find(
    (zone) => zone.label === okadaZone,
  )

  const displayedOkadaFare = selectedOkadaZone?.fare ?? null

  function changeVehicle(type: VehicleType) {
    setVehicle(type)
    setError("")

    if (type === "motorbike") {
      setPickupTown("Nsawam")
      setPickupArea("Nsawam Station")
      setDestinationTown("Nsawam")
      setDestinationArea("")
      setOkadaZone("")
    } else {
      setPickupTown("Nsawam")
      setPickupArea("Nsawam Station")
      setDestinationTown("Koforidua")
      setDestinationArea("Central Market")
      setOkadaZone("")
    }
  }

  function handlePickupTownChange(value: string) {
    setPickupTown(value)
    setPickupArea(townAreas[value]?.[0] || "")
  }

  function handleDestinationTownChange(value: string) {
    setDestinationTown(value)
    setDestinationArea(townAreas[value]?.[0] || "")
  }

  function handleOkadaDestinationChange(value: string) {
    setOkadaZone(value)
    setDestinationArea(value)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (isOkada && !okadaZone) {
      setError("Please select an Okada destination area.")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    const bookingData = {
      customer_name: String(formData.get("name") || ""),
      customer_phone: String(formData.get("phone") || ""),
      vehicle_type: vehicle,
      ride_option: isOkada ? "KFM Okada" : "KFM Car",
      pickup_town: String(formData.get("pickup") || ""),
      pickup_area: String(formData.get("pickupArea") || ""),
      destination_town: String(formData.get("destination") || ""),
      destination_area: String(
        formData.get("destinationArea") || "",
      ),
      when_option: String(formData.get("when") || ""),
      notes: String(formData.get("notes") || ""),
      fare_estimate: isOkada ? displayedOkadaFare : null,
      okada_zone: isOkada ? okadaZone : null,
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
        throw new Error(
          data.error || "Unable to submit your ride request.",
        )
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
            Choose Okada for approved local Nsawam-area trips or Car
            for local, regional and longer-distance journeys.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              "Choose Okada or Car",
              "Select your pickup and destination",
              "Receive a unique KFM booking number",
              "KFM can assign a driver to your request",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {item}
              </li>
            ))}
          </ul>
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

              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                Keep your booking number. KFM can use it to identify
                and manage your ride request.
              </p>

              <Button
                className="mt-6"
                variant="outline"
                onClick={() => {
                  setSubmitted(false)
                  setBookingCode("")
                  setError("")
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
                      {
                        key: "motorbike",
                        label: "Okada",
                        icon: Bike,
                      },
                    ] as const
                  ).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => changeVehicle(key)}
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="pickup"
                    className="text-sm font-medium"
                  >
                    Pickup town
                  </label>

                  <select
                    id="pickup"
                    name="pickup"
                    required
                    className={fieldClass}
                    value={pickupTown}
                    onChange={(e) =>
                      handlePickupTownChange(e.target.value)
                    }
                  >
                    {(isOkada ? ["Nsawam"] : carTowns).map(
                      (town) => (
                        <option key={town} value={town}>
                          {town}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="pickupArea"
                    className="text-sm font-medium"
                  >
                    Pickup area
                  </label>

                  <select
                    id="pickupArea"
                    name="pickupArea"
                    required
                    className={fieldClass}
                    value={pickupArea}
                    onChange={(e) =>
                      setPickupArea(e.target.value)
                    }
                  >
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
  required
  disabled={isOkada}
  className={fieldClass}
  value={destinationTown}
  onChange={(e) =>
    handleDestinationTownChange(e.target.value)
  }
>
  {isOkada ? (
    <option value="Nsawam">Nsawam</option>
  ) : (
    carTowns.map((town) => (
      <option key={town} value={town}>
        {town}
      </option>
  ))
    )}
</select>
 {isOkada && (
  <input
    type="hidden"
    name="destination"
    value="Nsawam"
  />
)}                 

{isOkada && (
  <input
    type="hidden"
    name="destination"
    value="Nsawam"
  />
)}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="destinationArea"
                    className="text-sm font-medium"
                  >
                    Destination area
                  </label>

                  {isOkada ? (
                    <select
                      id="destinationArea"
                      name="destinationArea"
                      required
                      className={fieldClass}
                      value={okadaZone}
                      onChange={(e) =>
                        handleOkadaDestinationChange(
                          e.target.value,
                        )
                      }
                    >
                      <option value="">
                        Select destination area
                      </option>

                      {okadaZones.map((zone) => (
                        <option
                          key={zone.label}
                          value={zone.label}
                        >
                          {zone.label} — GH₵{zone.fare}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      id="destinationArea"
                      name="destinationArea"
                      required
                      className={fieldClass}
                      value={destinationArea}
                      onChange={(e) =>
                        setDestinationArea(e.target.value)
                      }
                    >
                      {(townAreas[destinationTown] || []).map(
                        (area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ),
                      )}
                    </select>
                  )}
                </div>
              </div>

              {isOkada && displayedOkadaFare !== null && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Estimated fare
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    GH₵{displayedOkadaFare}
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium"
                  >
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
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium"
                  >
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

              <div className="space-y-2">
                <label
                  htmlFor="when"
                  className="text-sm font-medium"
                >
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
                  <option value="schedule">
                    Schedule for later
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="notes"
                  className="text-sm font-medium"
                >
                  Notes for driver{" "}
                  <span className="text-muted-foreground">
                    (optional)
                  </span>
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
                {isSubmitting
                  ? "Submitting ride request..."
                  : "Request ride"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
