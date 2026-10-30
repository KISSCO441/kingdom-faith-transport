import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Wrench, Car, Bike, ClipboardCheck, MapPin, Phone } from "lucide-react"

const services = [
  {
    title: "Car repairs & servicing",
    description: "Find help with routine servicing, engine concerns, brakes, tyres and general vehicle repairs.",
    icon: Car,
  },
  {
    title: "Motorbike & okada repairs",
    description: "Connect with mechanics for motorbike maintenance, troubleshooting and repairs.",
    icon: Bike,
  },
  {
    title: "Diagnostics & inspections",
    description: "Arrange an inspection or discuss a vehicle problem with a mechanic before authorising work.",
    icon: ClipboardCheck,
  },
]

export const metadata = {
  title: "Find a Mechanic | Kingdom Faith Marketplace",
  description: "Find vehicle repair and servicing support through Kingdom Faith Marketplace in Nsawam and surrounding communities.",
}

export default function FindAMechanicPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">KFM Transport Services</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Find a Mechanic</h1>
              <p className="mt-4 text-base leading-7 text-slate-200 sm:text-lg">
                Looking for help with your car or motorbike? KFM is preparing a local directory
                to help customers connect with vehicle repair and servicing professionals in
                Nsawam and nearby communities.
              </p>
              <a href="#mechanic-services" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600">
                Explore mechanic services
              </a>
            </div>
          </div>
        </section>

        <section id="mechanic-services" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Vehicle services</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Browse the types of services that will be available through the KFM mechanic directory.
            </p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {services.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
            <div>
              <h2 className="text-2xl font-extrabold">Are you a mechanic?</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                KFM plans to welcome mechanics who want to make their services easier for local
                customers to discover. Mechanic registration and profile listings are not open yet.
              </p>
              <a href="mailto:kingdomfaithtransport@gmail.com?subject=KFM%20Mechanic%20Registration%20Enquiry" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
                Enquire about registering
              </a>
            </div>
            <div className="rounded-2xl border bg-background p-6">
              <h3 className="font-bold">KFM service area</h3>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Nsawam and surrounding communities, Eastern Region, Ghana
              </p>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>For enquiries: <a className="font-semibold text-foreground hover:text-primary" href="tel:0240555688">0240 555 688</a> or <a className="font-semibold text-foreground hover:text-primary" href="tel:0204097129">020 409 7129</a></span>
              </p>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Always agree on the inspection, repair work and cost directly with the mechanic.
                Check qualifications and vehicle-work guarantees before proceeding.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
