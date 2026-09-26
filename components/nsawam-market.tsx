```tsx
"use client"

import { ShoppingCart, MapPin, ArrowRight, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

type Product = {
  name: string
  description: string
  price: number
  emoji: string
  category: string
}

const products: Product[] = [
  {
    name: "Fresh Fruits",
    description:
      "Fresh seasonal fruits selected from local Nsawam market sellers.",
    price: 25,
    emoji: "🍊",
    category: "Fresh Produce",
  },
  {
    name: "Fresh Vegetables",
    description:
      "Fresh garden vegetables for your everyday meals.",
    price: 20,
    emoji: "🥬",
    category: "Fresh Produce",
  },
  {
    name: "Plantain",
    description:
      "Fresh locally sourced plantain, perfect for frying, boiling or roasting.",
    price: 30,
    emoji: "🍌",
    category: "Farm Produce",
  },
  {
    name: "Tomatoes",
    description:
      "Fresh ripe tomatoes selected for quality and freshness.",
    price: 25,
    emoji: "🍅",
    category: "Fresh Produce",
  },
  {
    name: "Onions",
    description:
      "Quality onions for your kitchen and everyday cooking.",
    price: 20,
    emoji: "🧅",
    category: "Fresh Produce",
  },
  {
    name: "Fresh Eggs",
    description:
      "Farm-fresh eggs carefully selected for your household.",
    price: 35,
    emoji: "🥚",
    category: "Groceries",
  },
  {
    name: "Chicken",
    description:
      "Quality chicken for family meals and special occasions.",
    price: 85,
    emoji: "🍗",
    category: "Meat & Poultry",
  },
  {
    name: "Drinks & Beverages",
    description:
      "Refreshing drinks and beverages available for delivery.",
    price: 15,
    emoji: "🥤",
    category: "Beverages",
  },
]

function ProductVisual({ emoji }: { emoji: string }) {
  return (
    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-green-50">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-yellow-200/40" />
      <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-green-200/40" />

      <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm">
        <span className="text-7xl drop-shadow-md">{emoji}</span>
      </div>
    </div>
  )
}

export default function NsawamMarket() {
  const handleOrder = (product: Product) => {
    const message = `Hello Kingdom Faith Transport! 👋

I would like to order:

Product: ${product.name}
Category: ${product.category}
Price: GHS ${product.price.toFixed(2)}

Please let me know the next steps for delivery. Thank you!`

    const whatsappNumber = "233240555688"

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`

    window.open(whatsappUrl, "_blank")
  }

  return (
    <section
      id="nsawam-market"
      className="w-full bg-background px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Section Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            <MapPin className="h-4 w-4" />
            Nsawam, Ghana
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Nsawam Market
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Fresh picks, everyday essentials and local products delivered
            conveniently through Kingdom Faith Transport.
          </p>
        </div>

        {/* Market Banner */}
        <div className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">

            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-green-100">
                Fresh Picks
              </p>

              <h3 className="text-2xl font-bold sm:text-3xl">
                Shop Nsawam Market
              </h3>

              <p className="mt-2 max-w-xl text-sm text-green-50 sm:text-base">
                Order your market essentials and let KFM help get them where
                you need them.
              </p>
            </div>

            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white/15 text-7xl backdrop-blur-sm">
              🛍️
            </div>

          </div>
        </div>

        {/* Product Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <article
              key={product.name}
              className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >

              <ProductVisual emoji={product.emoji} />

              <div className="p-5">

                <span className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  {product.category}
                </span>

                <h3 className="mt-1 text-lg font-bold">
                  {product.name}
                </h3>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-muted-foreground">
                  {product.description}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3">

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Starting from
                    </p>

                    <p className="text-xl font-bold text-green-700">
                      GHS {product.price.toFixed(2)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => handleOrder(product)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Order
                  </Button>

                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Customer Contact */}
        <div className="mt-10 rounded-2xl border bg-muted/40 p-6 text-center">

          <h3 className="text-lg font-bold">
            Need help with your market order?
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Contact Kingdom Faith Transport and we will help you with your
            order.
          </p>

          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">

            {/* WhatsApp */}
            <a
              href="https://wa.me/233240555688"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-green-700 hover:underline"
            >
              <ShoppingCart className="h-4 w-4" />
              WhatsApp: 024 0555 688
            </a>

            <span className="hidden text-muted-foreground sm:inline">
              •
            </span>

            {/* Phone */}
            <a
              href="tel:+233204097129"
              className="inline-flex items-center gap-2 font-semibold hover:underline"
            >
              <Phone className="h-4 w-4" />
              Call: 020 409 7129
            </a>

          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border bg-muted/40 p-6 text-center sm:flex-row sm:text-left">

          <div>
            <h3 className="font-semibold">
              Looking for something else?
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Contact KFM and tell us what you need from Nsawam Market.
            </p>
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const message =
                "Hello Kingdom Faith Transport! I would like to ask about another product from Nsawam Market."

              window.open(
                `https://wa.me/233240555688?text=${encodeURIComponent(
                  message
                )}`,
                "_blank"
              )
            }}
          >
            Ask About Products
            <ArrowRight className="h-4 w-4" />
          </Button>

        </div>

      </div>
    </section>
  )
}
```
