"use client"

import { useState } from "react"
import { Car, Bike, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type VehicleType = "car" | "motorbike"

type Ride = {
  name: string
  description: string
  baseFare: string
  perKm: string
  seats: string
  includes: string[]
  popular?: boolean
}

const rideData: Record<VehicleType, Ride[]> = {
  car: [
    {
      name: "KFM Go",
      description: "Affordable everyday rides for getting around town.",
      baseFare: "₵5",
      perKm: "₵2.5",
      seats: "Up to 4 seats",
      includes: ["Air-conditioned saloon car", "Verified driver", "Mobile money or cash", "Live trip tracking"],
    },
    {
      name: "KFM Comfort",
      description: "Newer, roomier cars for a smoother journey.",
      baseFare: "₵8",
      perKm: "₵3.5",
      seats: "Up to 4 seats",
      includes: ["Premium saloon car", "Top-rated drivers", "Extra legroom", "Priority pickup"],
      popular: true,
    },
    {
      name: "KFM XL",
      description: "Spacious vans and SUVs for groups and luggage.",
      baseFare: "₵12",
      perKm: "₵4.5",
      seats: "Up to 6 seats",
      includes: ["SUV or minivan", "Ample luggage space", "Group travel", "Airport & long trips"],
    },
  ],
  motorbike: [
    {
      name: "Okada",
      description: "The fastest way to beat traffic on short trips.",
      baseFare: "₵3",
      perKm: "₵1.5",
      seats: "1 passenger",
      includes: ["Motorbike taxi", "Free helmet", "Quick pickup", "Cash or mobile money"],
    },
    {
      name: "Okada Express",
      description: "Priority okada with our fastest, closest riders.",
      baseFare: "₵4",
      perKm: "₵2",
      seats: "1 passenger",
      includes: ["Fastest rider match", "Free helmet", "Priority dispatch", "Live tracking"],
      popular: true,
    },
    {
      name: "Okada Delivery",
      description: "Send parcels and packages across town in a flash.",
      baseFare: "₵4",
      perKm: "₵1.8",
      seats: "Parcels only",
      includes: ["Same-town delivery", "Photo confirmation", "Secure handling", "Real-time updates"],
    },
  ],
}

export function Services() {
  const [vehicle, setVehicle] = useState<VehicleType>("car")
  const rides = rideData[vehicle]

  return (
    <section id="rides" className="mx-auto max-w-6xl px-4 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Ride Options</p>
        <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
          Fair fares for every trip
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Choose a car or okada to see upfront pricing. You always see the estimate before you book.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-muted p-1">
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
                "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors",
                vehicle === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {rides.map((ride) => (
          <div
            key={ride.name}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md",
              ride.popular ? "border-primary ring-1 ring-primary" : "border-border",
            )}
          >
            {ride.popular && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold">{ride.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{ride.description}</p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold">{ride.baseFare}</span>
              <span className="text-sm text-muted-foreground">base + {ride.perKm}/km</span>
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{ride.seats}</p>

            <ul className="mt-6 space-y-3">
              {ride.includes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              className="mt-6 w-full"
              variant={ride.popular ? "default" : "outline"}
            >
              <a href="#book">Order {ride.name}</a>
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
