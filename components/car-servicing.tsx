
"use client"

import { useMemo, useState } from "react"
import {
  Battery,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type Mechanic = {
  name: string
  area: string
  phone?: string
  services: string[]
  mapQuery: string
  note: string
}

const mechanics: Mechanic[] = [
  {
    name: "Nsawam Mechanic Shop",
    area: "Nsawam–Aburi Road",
    phone: "+233247940097",
    services: ["General repairs", "Vehicle maintenance"],
    mapQuery: "Nsawam Mechanic Shop, Nsawam, Ghana",
    note: "Public listing; contact details and current services need confirmation.",
  },
  {
    name: "Kahlmahn Ghana",
    area: "Nsawam",
    phone: "+233269993452",
    services: ["Car repairs", "Vehicle maintenance"],
    mapQuery: "Kahlmahn Ghana, Nsawam, Ghana",
    note: "Public listing; confirm services and WhatsApp availability.",
  },
  {
    name: "Automobile Heavy Duty Mechanic",
    area: "Nsawam",
    phone: "+233500275188",
    services: ["Mechanical repairs"],
    mapQuery: "EG-065-0632, Nsawam, Ghana",
    note: "Confirm workshop location and passenger-car services before visiting.",
  },
  {
    name: "Car Mechanic",
    area: "Nsawam Adoagyiri",
    phone: "+233594172149",
    services: ["Mechanical repairs"],
    mapQuery: "RJ9X+QFP, Nsawam Adoagyiri, Ghana",
    note: "Public listing; business name, location and services need confirmation.",
  },
  {
    name: "Traction zone",
    area: "Adodi Roundabout, Nsawam",
    phone: "+233540412945",
    services: ["Battery services"],
    mapQuery: "Traction Zone, Adodi Roundabout, Nsawam, Ghana",
    note: "Listed as a battery store; confirm available vehicle services.",
  },
  {
    name: "SIMPAT LIMITED",
    area: "Dobro, Nsawam Road",
    phone: "+233201444561",
    services: ["Tyres"],
    mapQuery: "SIMPAT LIMITED, Dobro, Nsawam Road, Ghana",
    note: "Listed as a tyre shop; confirm current contact details and services.",
  },
  {
    name: "Kujo Mechanic",
    area: "Nsawam–Suhum Road",
    services: ["Mechanical services"],
    mapQuery: "Kujo Mechanic, Nsawam-Suhum Road, Ghana",
    note: "Public listing; phone number and workshop details not yet confirmed.",
  },
]

const categories = [
  "All services",
  "General repairs",
  "Vehicle maintenance",
  "Mechanical repairs",
  "Battery services",
  "Tyres",
]

export function CarServicing() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All services")
  const [view, setView] = useState<"list" | "map">("list")

  const filteredMechanics = useMemo(() => {
    const query = search.trim().toLowerCase()

    return mechanics.filter((mechanic) => {
      const matchesSearch =
        !query ||
        mechanic.name.toLowerCase().includes(query) ||
        mechanic.area.toLowerCase().includes(query) ||
        mechanic.services.some((service) =>
          service.toLowerCase().includes(query),
        )

      const matchesCategory =
        category === "All services" ||
        mechanic.services.includes(category)

      return matchesSearch && matchesCategory
    })
  }, [search, category])

  return (
    <section id="servicing" className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            KFM Vehicle Servicing
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Find a Mechanic Near You
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Find vehicle repair and maintenance contacts around Nsawam,
            Adoagyiri, and nearby communities. Contact providers directly
            to discuss services, availability, and prices.
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search mechanic, service, or area..."
            aria-label="Search mechanics by name, service, or area"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {categories.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={category === item ? "default" : "outline"}
              onClick={() => setCategory(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filteredMechanics.length} listing
            {filteredMechanics.length === 1 ? "" : "s"} found
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={view === "list" ? "default" : "outline"}
              onClick={() => setView("list")}
            >
              <Wrench className="mr-2 h-4 w-4" />
              List
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "map" ? "default" : "outline"}
              onClick={() => setView("map")}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Map
            </Button>
          </div>
        </div>

{view === "map" && (
  <div className="mt-5">
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <h3 className="font-semibold">Mechanic Locations Around Nsawam</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Explore a separate Google Maps view for each matching listing.
        Locations come from public search descriptions and may need
        confirmation with the provider before you travel.
      </p>
    </div>

    {filteredMechanics.length > 0 ? (
      <div className="grid gap-5 md:grid-cols-2">
        {filteredMechanics.map((mechanic) => (
          <article
            key={mechanic.name}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="p-4">
              <h4 className="font-semibold">{mechanic.name}</h4>
              <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {mechanic.area}
              </p>
            </div>

            <iframe
              title={`Google Maps search for ${mechanic.name}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                mechanic.mapQuery,
              )}&output=embed`}
              width="100%"
              height="260"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />

            <div className="p-4">
              <p className="text-xs text-muted-foreground">
                {mechanic.note}
              </p>

              <Button asChild variant="outline" className="mt-3 w-full">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    mechanic.mapQuery,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Open location in Google Maps
                </a>
              </Button>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="font-semibold">No matching locations found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Change your search or select another service category.
        </p>
      </div>
    )}
  </div>
)}
        
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {filteredMechanics.map((mechanic) => (
            <article
              key={mechanic.name}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  {mechanic.services.includes("Battery services") ? (
                    <Battery className="h-6 w-6" />
                  ) : (
                    <Wrench className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{mechanic.name}</h3>
                  <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {mechanic.area}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {mechanic.services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                  >
                    {service}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {mechanic.note}
              </p>

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                {mechanic.phone ? (
                  <Button asChild className="flex-1">
                    <a href={`tel:${mechanic.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </a>
                  </Button>
                ) : (
                  <Button className="flex-1" disabled>
                    Phone not confirmed
                  </Button>
                )}

                {mechanic.phone && (
                  <Button asChild variant="outline" className="flex-1">
                    <a
                      href={`https://wa.me/${mechanic.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Hello, I found your listing on KFM Car Servicing. Are you available for ${mechanic.services.join(", ")} near ${mechanic.area}? Please share your current services and prices.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                )}

                <Button asChild variant="ghost" className="w-full">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mechanic.mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Directions / Location
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>

        {filteredMechanics.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="font-semibold">No matching mechanics found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different service or area.
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Listings are based on publicly available information and have not
          yet been verified or endorsed by KFM. Confirm the provider,
          location, availability, and price before travelling or agreeing
          to any work. WhatsApp availability is not independently confirmed.
        </p>
      </div>
    </section>
  )
}
