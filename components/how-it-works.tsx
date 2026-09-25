import { MapPin, Car, CircleCheckBig } from "lucide-react"

const steps = [
  {
    icon: MapPin,
    title: "Set your trip",
    description: "Enter your pickup and destination, then pick a car or okada that suits you.",
  },
  {
    icon: Car,
    title: "Get matched",
    description: "We connect you with the nearest verified driver and show your fare upfront.",
  },
  {
    icon: CircleCheckBig,
    title: "Ride & pay",
    description: "Track your driver, enjoy the trip, and pay with mobile money or cash.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
        <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
          Three simple steps
        </h2>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="relative text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <step.icon className="h-6 w-6" />
            </div>
            <div className="mt-4 text-sm font-semibold text-primary">Step {index + 1}</div>
            <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
