"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Minus, Plus, ShoppingBasket, Truck, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Product = {
  id: string
  name: string
  unit: string
  price: number
  category: string
  image: string
}

const products: Product[] = [
  { id: "tomatoes", name: "Fresh Tomatoes", unit: "per olonka", price: 25, category: "Vegetables", image: "/images/market-vegetables.png" },
  { id: "garden-eggs", name: "Garden Eggs", unit: "per olonka", price: 18, category: "Vegetables", image: "/images/market-vegetables.png" },
  { id: "pepper", name: "Green Pepper & Onions", unit: "small bag", price: 30, category: "Vegetables", image: "/images/market-vegetables.png" },
  { id: "plantain", name: "Ripe Plantain", unit: "per bunch", price: 35, category: "Fruits", image: "/images/market-fruits.png" },
  { id: "pineapple", name: "Pineapple", unit: "each", price: 12, category: "Fruits", image: "/images/market-fruits.png" },
  { id: "oranges", name: "Oranges", unit: "dozen", price: 20, category: "Fruits", image: "/images/market-fruits.png" },
  { id: "rice", name: "Local Rice", unit: "5kg bag", price: 90, category: "Staples", image: "/images/market-staples.png" },
  { id: "yam", name: "Yam Tubers", unit: "per tuber", price: 28, category: "Staples", image: "/images/market-staples.png" },
  { id: "gari", name: "Gari", unit: "per olonka", price: 22, category: "Staples", image: "/images/market-staples.png" },
  { id: "fish", name: "Fresh Fish", unit: "per kg", price: 55, category: "Protein", image: "/images/market-protein.png" },
  { id: "smoked-fish", name: "Smoked Fish", unit: "per pack", price: 40, category: "Protein", image: "/images/market-protein.png" },
  { id: "eggs", name: "Eggs", unit: "per crate", price: 48, category: "Protein", image: "/images/market-protein.png" },
]

const categories = ["All", "Vegetables", "Fruits", "Staples", "Protein"]

const DELIVERY_FEE = 15

export function NsawamMarket() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [cart, setCart] = useState<Record<string, number>>({})

  const visibleProducts = useMemo(
    () => (activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory)),
    [activeCategory],
  )

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ product: products.find((p) => p.id === id)!, qty })),
    [cart],
  )

  const subtotal = cartItems.reduce((sum, { product, qty }) => sum + product.price * qty, 0)
  const totalItems = cartItems.reduce((sum, { qty }) => sum + qty, 0)

  function addItem(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }))
  }

  function removeItem(id: string) {
    setCart((c) => {
      const next = Math.max(0, (c[id] ?? 0) - 1)
      return { ...c, [id]: next }
    })
  }

  return (
    <section id="market" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Nsawam Market</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Fresh market items delivered to your door
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Skip the crowd and the heat. Order fresh produce, staples and protein straight from Nsawam Market and our
            riders bring it to your home.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => {
                const qty = cart[product.id] ?? 0
                return (
                  <div
                    key={product.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 300px"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-sm font-semibold">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.unit}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-base font-bold">₵{product.price}</span>
                        {qty === 0 ? (
                          <Button size="sm" variant="outline" onClick={() => addItem(product.id)}>
                            <Plus className="mr-1 h-4 w-4" />
                            Add
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 bg-transparent"
                              onClick={() => removeItem(product.id)}
                              aria-label={`Remove one ${product.name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                            <Button
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => addItem(product.id)}
                              aria-label={`Add one ${product.name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Your basket</h3>
                {totalItems > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </div>

              {cartItems.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Your basket is empty. Add items from the market to get started.
                </p>
              ) : (
                <>
                  <ul className="mt-4 space-y-3">
                    {cartItems.map(({ product, qty }) => (
                      <li key={product.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {qty} × ₵{product.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">₵{product.price * qty}</span>
                          <button
                            onClick={() => setCart((c) => ({ ...c, [product.id]: 0 }))}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                            aria-label={`Remove ${product.name} from basket`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₵{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Delivery
                      </span>
                      <span>₵{DELIVERY_FEE}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span>₵{subtotal + DELIVERY_FEE}</span>
                    </div>
                  </div>
                </>
              )}

              <Button asChild className="mt-6 w-full" disabled={cartItems.length === 0}>
                <a href="#book">Checkout &amp; schedule delivery</a>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Pay on delivery or via mobile money
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
