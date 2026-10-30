import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { NsawamMarket } from "@/components/nsawam-market"

export const metadata = {
  title: "NSAWAM MARKET | Shop More. We Deliver!",
  description:
    "Shop fresh market essentials through NSAWAM MARKET by Kingdom Faith Marketplace.",
}

export default function MarketPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="border-b bg-muted/30">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <h1 className="text-lg font-bold">Shop with NSAWAM MARKET</h1>
              <p className="text-sm text-muted-foreground">Want to sell on the marketplace? Set up your seller account using email verification.</p>
            </div>
            <a href="/market/account" className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
              Become a Seller
            </a>
          </div>
        </section>
        <NsawamMarket />
      </main>
      <SiteFooter />
    </div>
  )
}
