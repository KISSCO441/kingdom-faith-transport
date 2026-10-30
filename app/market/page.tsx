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
        <NsawamMarket />
      </main>
      <SiteFooter />
    </div>
  )
}
