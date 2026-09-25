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
      </main>
      <SiteFooter />
    </div>
  )
}
