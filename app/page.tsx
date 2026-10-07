import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Services } from "@/components/services"
import { CarServicing } from "@/components/car-servicing"
import { NsawamMarket } from "@/components/nsawam-market"
import { Features } from "@/components/features"
import { HowItWorks } from "@/components/how-it-works"
import { BookingForm } from "@/components/booking-form"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        <Hero />
        <Services />
        <CarServicing />
        <NsawamMarket />
        <Features />
        <HowItWorks />
        <BookingForm />

        {/* Contact KFM */}
        <section
          id="contact"
          className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">
              CONTACT KFM
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              We&apos;re here to help
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Have a question about a ride, delivery, market order, or KFM
              service? Get in touch with us.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {/* Phone / WhatsApp */}
              <a
                href="tel:+233240555688"
                className="rounded-xl border border-border bg-background p-6 transition-colors hover:border-primary hover:text-primary"
              >
                <div className="text-sm font-bold uppercase tracking-wide">
                  PHONE / WHATSAPP
                </div>

                <div className="mt-3 text-lg font-bold">
                  0240 555 688
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  Call or WhatsApp KFM
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:kingdomfaithtransport@gmail.com"
                className="rounded-xl border border-border bg-background p-6 transition-colors hover:border-primary hover:text-primary"
              >
                <div className="text-sm font-bold uppercase tracking-wide">
                  EMAIL
                </div>

                <div className="mt-3 break-words text-lg font-bold">
                  kingdomfaithtransport@gmail.com
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  Send us an email
                </div>
              </a>

              {/* Location */}
              <div className="rounded-xl border border-border bg-background p-6">
                <div className="text-sm font-bold uppercase tracking-wide">
                  LOCATION
                </div>

                <div className="mt-3 text-lg font-bold">
                  Nsawam
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  Eastern Region, Ghana
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
