import { Wrench, Droplets, Battery, Gauge, ShieldCheck, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const packages = [
  {
    name: "Minor Service",
    price: "₵180",
    duration: "About 1 hour",
    icon: Droplets,
    description: "Essential upkeep to keep your car and okada running smoothly.",
    includes: ["Engine oil & filter change", "Fluid top-up", "Tyre pressure check", "20-point inspection"],
  },
  {
    name: "Major Service",
    price: "₵420",
    duration: "Half day",
    icon: Wrench,
    description: "A thorough service covering the parts that wear out over time.",
    includes: ["Everything in Minor Service", "Brake pads & discs check", "Air & fuel filters", "Spark plugs", "Full diagnostics"],
    popular: true,
  },
  {
    name: "Diagnostics & Repair",
    price: "From ₵120",
    duration: "Same day",
    icon: Gauge,
    description: "Computer diagnostics and expert repairs for any fault.",
    includes: ["Full computer scan", "Fault report & quote", "Genuine parts", "Warranty on repairs"],
  },
]

const perks = [
  { icon: ShieldCheck, label: "Certified mechanics" },
  { icon: Battery, label: "Genuine spare parts" },
  { icon: Wrench, label: "Free pickup & drop-off" },
]

export function CarServicing() {
  return (
    <section id="servicing" className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Vehicle Servicing</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Keep your vehicle road-ready
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Beyond rides, we service and maintain cars and okadas across the Eastern Region. Book a slot and our
            certified mechanics handle the rest.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {perks.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </span>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {packages.map((pkg) => {
            const Icon = pkg.icon
            return (
              <div
                key={pkg.name}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${
                  pkg.popular ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most booked
                  </span>
                )}
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{pkg.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{pkg.price}</span>
                  <span className="text-sm text-muted-foreground">{pkg.duration}</span>
                </div>

                <ul className="mt-6 space-y-3">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="mt-6 w-full" variant={pkg.popular ? "default" : "outline"}>
                  <a href="#book">Book {pkg.name}</a>
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
