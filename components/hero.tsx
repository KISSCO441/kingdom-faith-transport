import { Car, MapPin, ShieldCheck, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { value: "50k+", label: "Rides completed" },
  { value: "4.9/5", label: "Rider rating" },
  { value: "12", label: "Towns covered" },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/ride-hero.png"
          alt="A taxi and motorbike rider on a sunny road in a Ghanaian town"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32">
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            Kingdom Faith Marketplace &middot; Eastern Region, Ghana
          </div>

          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Order a <span className="text-primary">ride</span> anywhere in the{" "}
            <span className="text-primary">Eastern Region</span>
          </h1>

          <p className="mt-5 text-pretty text-lg text-muted-foreground">
            Book cars and okada rides in minutes across Koforidua, Nkawkaw, Nsawam and beyond.
            Fair fares, trusted local drivers, and mobile money payments.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href="#book">
                <MapPin className="h-4 w-4" />
                Order a Ride
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#rides">
                <Car className="h-4 w-4" />
                See Fares
              </a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Verified drivers
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Pickup in minutes
            </span>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-2xl font-bold text-foreground">{stat.value}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
