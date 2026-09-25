"use client"

import { useState, type FormEvent } from "react"
import { Car, Bike, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type VehicleType = "car" | "motorbike"

const rideOptions: Record<VehicleType, string[]> = {
  car: ["KFM Go", "KFM Comfort", "KFM XL"],
  motorbike: ["Okada", "Okada Express", "Okada Delivery"],
}

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
  Suhum: ["Suhum Roundabout", "Zongo", "Kraboa Coaltar", "Nankese", "Densuso", "Anum Apapam"],
  Akosombo: ["Akosombo Township", "Atimpoku", "Combone", "Old Akrade", "New Akrade", "Dam Site"],
  Begoro: ["Begoro Central", "Zongo", "Osino Road", "Nkubem", "Ehiamankyene"],
  Kibi: ["Kibi Central", "Apedwa", "Asiakwa", "Kwabeng Road", "Bunso"],
  Mpraeso: ["Mpraeso Central", "Nkwatia", "Abetifi Road", "Bepong", "Kwahu Pepease"],
  "Akim Oda": ["Oda Central Market", "Zongo", "Akwatia Road", "Swedru Junction", "Ofoase"],
  Kade: ["Kade Township", "Akwatia Road", "Asuom", "Takrowase", "Otwereso"],
  Somanya: ["Somanya Central", "Kpong Road", "Mangoase", "Huhunya", "Bueryonye"],
  Akropong: ["Akropong Central", "Akuapem Ridge", "Amanokrom", "Abiriw", "Dawu"],
}

const towns = Object.keys(townAreas)

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"

export function BookingForm() {
  const [vehicle, setVehicle] = useState<VehicleType>("car")
  const [submitted, setSubmitted] = useState(false)
  const [pickupTown, setPickupTown] = useState("Koforidua")
  const [destinationTown, setDestinationTown] = useState("Nkawkaw")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="book" className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Order a ride</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Where are you going?
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Set your pickup and destination, choose your ride, and we&apos;ll match you with the
            nearest verified driver. You&apos;ll get your fare estimate before you confirm.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              "Upfront fare estimate, no surprises",
              "Pay with mobile money or cash",
              "Live driver tracking to your pickup",
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
              <h3 className="mt-4 text-xl font-semibold">Ride requested</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                We&apos;re matching you with the nearest driver. You&apos;ll get a call or SMS with
                your driver&apos;s details and fare shortly.
              </p>
              <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>
                Order another ride
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <span className="mb-2 block text-sm font-medium">Ride type</span>
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
                      onClick={() => setVehicle(key)}
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
                  <label htmlFor="pickup" className="text-sm font-medium">
                    Pickup town
                  </label>
                  <select
                    id="pickup"
                    name="pickup"
                    required
                    className={fieldClass}
                    value={pickupTown}
                    onChange={(e) => setPickupTown(e.target.value)}
                  >
                    {towns.map((town) => (
                      <option key={town} value={town}>
                        {town}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="pickupArea" className="text-sm font-medium">
                    Local area in {pickupTown}
                  </label>
                  <select id="pickupArea" name="pickupArea" required className={fieldClass} key={pickupTown}>
                    {townAreas[pickupTown].map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="destination" className="text-sm font-medium">
                    Destination town
                  </label>
                  <select
                    id="destination"
                    name="destination"
                    required
                    className={fieldClass}
                    value={destinationTown}
                    onChange={(e) => setDestinationTown(e.target.value)}
                  >
                    {towns.map((town) => (
                      <option key={town} value={town}>
                        {town}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="destinationArea" className="text-sm font-medium">
                    Local area in {destinationTown}
                  </label>
                  <select
                    id="destinationArea"
                    name="destinationArea"
                    required
                    className={fieldClass}
                    key={destinationTown}
                  >
                    {townAreas[destinationTown].map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full name
                  </label>
                  <input id="name" name="name" required className={fieldClass} placeholder="Ama Mensah" />
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
                  <select id="ride" name="ride" required className={fieldClass}>
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
                  <select id="when" name="when" required className={fieldClass}>
                    <option value="now">Pick me up now</option>
                    <option value="15">In 15 minutes</option>
                    <option value="30">In 30 minutes</option>
                    <option value="schedule">Schedule for later</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes for driver <span className="text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className={cn(fieldClass, "resize-none")}
                  placeholder="Any landmark details or special requests?"
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Request ride
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
