import { ShieldCheck, Wallet, Gauge, Users, Navigation, MapPin } from "lucide-react"

const features = [
  {
    icon: ShieldCheck,
    title: "Verified drivers",
    description: "Every driver is background-checked and rated by riders like you.",
  },
  {
    icon: Wallet,
    title: "Mobile money & cash",
    description: "Pay easily with MTN MoMo, Telecel Cash, or good old cash.",
  },
  {
    icon: Gauge,
    title: "Fast pickups",
    description: "Get matched with the nearest driver and hit the road in minutes.",
  },
  {
    icon: Users,
    title: "Cars & okada",
    description: "From quick okada hops to comfy cars for the family — your choice.",
  },
  {
    icon: Navigation,
    title: "Live tracking",
    description: "Follow your driver to pickup and share your trip with loved ones.",
  },
  {
    icon: MapPin,
    title: "Eastern Region wide",
    description: "Koforidua, Nkawkaw, Nsawam, Suhum, Akosombo and more towns covered.",
  },
]

export function Features() {
  return (
    <section id="features" className="border-y border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Why ride with us</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Transport you can trust
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
