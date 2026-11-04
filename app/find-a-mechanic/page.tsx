import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CarServicing } from "@/components/car-servicing"

export const metadata = {
  title: "Find a Mechanic | NSAWAM MARKET",
  description:
    "Browse car repair, servicing, battery and tyre contacts around Nsawam and nearby communities.",
}

export default function FindAMechanicPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">
                NSAWAM MARKET • LOCAL SERVICES
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Find a Mechanic
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-200 sm:text-lg">
                Browse existing car repair, vehicle maintenance, battery and tyre
                service contacts around Nsawam, Adoagyiri and nearby communities.
                Search by provider, service or area, then contact providers directly.
              </p>
              <a
                href="#mechanic-directory"
                className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Browse listed mechanics
              </a>
            </div>
          </div>
        </section>

        <div id="mechanic-directory">
          <CarServicing />
        </div>

        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-xl font-extrabold">For mechanics and service providers</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Existing listings are being made easier for customers to discover.
              For now, providers do not need to create an account or pay a listing
              fee. KFM may introduce optional account access and listing plans later,
              with advance notice and clear terms.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              To correct a listing or enquire about being included, contact KFM at{" "}
              <a
                className="font-semibold text-foreground underline underline-offset-4"
                href="mailto:kingdomfaithtransport@gmail.com?subject=Mechanic%20Directory%20Enquiry"
              >
                kingdomfaithtransport@gmail.com
              </a>{" "}
              or call{" "}
              <a className="font-semibold text-foreground" href="tel:+233240555688">
                0240 555 688
              </a>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
