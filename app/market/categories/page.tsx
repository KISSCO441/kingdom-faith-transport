import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ArrowRight, ShoppingBasket } from "lucide-react"

const categories = [
  {
    name: "Vegetables",
    description: "Fresh vegetables and garden essentials",
    image: "/images/vegetables.jpg",
  },
  {
    name: "Fruits",
    description: "Fresh fruits for your home",
    image: "/images/fruits.jpg",
  },
  {
    name: "Staples",
    description: "Rice, yam, gari and everyday staples",
    image: "/images/Staples.jpg",
  },
  {
    name: "Protein",
    description: "Fish, smoked fish, eggs and more",
    image: "/images/Proteins.jpg",
  },
]

export const metadata = {
  title: "Market Categories | NSAWAM MARKET",
  description: "Choose a category and shop fresh market essentials from NSAWAM MARKET.",
}

export default function MarketCategoriesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="border-b border-border bg-muted/30 px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShoppingBasket className="h-6 w-6" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">NSAWAM MARKET</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Shop by Category</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Choose a market category below to browse available products and build your basket.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/market?category=${encodeURIComponent(category.name)}#market-products`}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="relative aspect-[5/3] w-full overflow-hidden bg-muted">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 320px"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <h2 className="text-sm font-bold sm:text-base">{category.name}</h2>
                  <p className="mt-1 min-h-8 text-[11px] leading-4 text-muted-foreground sm:text-sm sm:leading-5">
                    {category.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary sm:text-sm">
                    Browse category <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-7 text-center">
            <Link href="/market" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              View all market products
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
