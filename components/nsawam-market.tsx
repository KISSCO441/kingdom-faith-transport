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
  amountOptions: number[]
}

type CartItem = {
  productId: string
  quantity: number
  selectedAmount?: number
}

function createAmountOptions(start: number) {
  const options: number[] = []

  for (let amount = start; amount <= 50; amount += 5) {
    options.push(amount)
  }

  return options
}

const products: Product[] = [
  {
    id: "tomatoes",
    name: "Fresh Tomatoes",
    unit: "select your amount",
    price: 10,
    category: "Vegetables",
    image: "/images/market-vegetables.png",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "garden-eggs",
    name: "Garden Eggs",
    unit: "select your amount",
    price: 5,
    category: "Vegetables",
    image: "/images/market-vegetables.png",
    amountOptions: createAmountOptions(5),
  },
  {
    id: "pepper",
    name: "Pepper",
    unit: "select your amount",
    price: 5,
    category: "Vegetables",
    image: "/images/market-vegetables.png",
    amountOptions: createAmountOptions(5),
  },
  {
    id: "plantain",
    name: "Ripe Plantain",
    unit: "select your amount",
    price: 10,
    category: "Fruits",
    image: "/images/market-fruits.png",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "pineapple",
    name: "Pineapple",
    unit: "select your amount",
    price: 10,
    category: "Fruits",
    image: "/images/market-fruits.png",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "oranges",
    name: "Oranges",
    unit: "select your amount",
    price: 5,
    category: "Fruits",
    image: "/images/market-fruits.png",
    amountOptions: createAmountOptions(5),
  },
  {
    id: "rice",
    name: "Local Rice",
    unit: "select your amount",
    price: 10,
    category: "Staples",
    image: "/images/market-staples.png",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "yam",
    name: "Yam Tubers",
    unit: "select your amount",
    price: 30,
    category: "Staples",
    image: "/images/market-staples.png",
    amountOptions: createAmountOptions(30),
  },
  {
    id: "gari",
    name: "Gari",
    unit: "select your amount",
    price: 10,
    category: "Staples",
    image: "/images/market-staples.png",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "fish",
    name: "Fresh Fish",
    unit: "select your amount",
    price: 15,
    category: "Protein",
    image: "/images/market-protein.png",
    amountOptions: createAmountOptions(15),
  },
  {
    id: "smoked-fish",
    name: "Smoked Fish",
    unit: "select your amount",
    price: 10,
    category: "Protein",
    image: "/images/market-protein.png",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "eggs",
    name: "Eggs",
    unit: "select your amount",
    price: 10,
    category: "Protein",
    image: "/images/market-protein.png",
    amountOptions: createAmountOptions(10),
  },
]

const categories = ["All", "Vegetables", "Fruits", "Staples", "Protein"]

const MINIMUM_ORDER = 50
const DELIVERY_FEE = 20

export function NsawamMarket() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [cart, setCart] = useState<Record<string, CartItem>>({})

  const visibleProducts = useMemo(
    () =>
      activeCategory === "All"
        ? products
        : products.filter((product) => product.category === activeCategory),
    [activeCategory],
  )

  const cartItems = useMemo(
    () =>
      Object.values(cart)
        .map((item) => {
          const product = products.find((p) => p.id === item.productId)

          if (!product) return null

          const unitPrice = item.selectedAmount ?? product.price

          return {
            ...item,
            product,
            unitPrice,
            total: unitPrice * item.quantity,
          }
        })
        .filter(Boolean) as Array<
        CartItem & {
          product: Product
          unitPrice: number
          total: number
        }
      >,
    [cart],
  )

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0)

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  )

  const minimumOrderReached = subtotal >= MINIMUM_ORDER

  const grandTotal = subtotal > 0 ? subtotal + DELIVERY_FEE : 0

  function selectAmount(product: Product, amount: number) {
    setCart((current) => {
      const existing = current[product.id]

      return {
        ...current,
        [product.id]: {
          productId: product.id,
          quantity: existing?.quantity ?? 1,
          selectedAmount: amount,
        },
      }
    })
  }

  function addItem(product: Product) {
    setCart((current) => {
      const existing = current[product.id]

      return {
        ...current,
        [product.id]: {
          productId: product.id,
          quantity: (existing?.quantity ?? 0) + 1,
          selectedAmount:
            existing?.selectedAmount ?? product.amountOptions[0],
        },
      }
    })
  }

  function removeItemQuantity(id: string) {
    setCart((current) => {
      const existing = current[id]

      if (!existing) return current

      const nextQuantity = Math.max(0, existing.quantity - 1)

      if (nextQuantity === 0) {
        const next = { ...current }
        delete next[id]
        return next
      }

      return {
        ...current,
        [id]: {
          ...existing,
          quantity: nextQuantity,
        },
      }
    })
  }

  function removeItem(id: string) {
    setCart((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  return (
    <section id="market" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Nsawam Market
          </p>

          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Fresh market items delivered to your door
          </h2>

          <p className="mt-4 text-pretty text-muted-foreground">
            Skip the crowd and the heat. Order fresh produce, staples and
            protein straight from Nsawam Market and our riders bring them
            to your home.
          </p>

          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-semibold">KFM Market Ordering</p>

            <p className="mt-1 text-muted-foreground">
              Minimum product order:{" "}
              <span className="font-semibold text-foreground">
                GH₵{MINIMUM_ORDER}
              </span>{" "}
              • Nsawam delivery:{" "}
              <span className="font-semibold text-foreground">
                GH₵{DELIVERY_FEE}
              </span>
            </p>
          </div>
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
                const cartItem = cart[product.id]
                const quantity = cartItem?.quantity ?? 0

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
                      <h3 className="text-sm font-semibold">
                        {product.name}
                      </h3>

                      <p className="text-xs text-muted-foreground">
                        {product.unit}
                      </p>

                      <div className="mt-3">
                        <label
                          htmlFor={`${product.id}-amount`}
                          className="text-xs font-medium"
                        >
                          Choose amount
                        </label>

                        <select
                          id={`${product.id}-amount`}
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                          value={cartItem?.selectedAmount ?? ""}
                          onChange={(event) => {
                            const amount = Number(event.target.value)

                            if (!amount) return

                            selectAmount(product, amount)
                          }}
                        >
                          <option value="">
                            Select GH₵ amount
                          </option>

                          {product.amountOptions.map((amount) => (
                            <option key={amount} value={amount}>
                              GH₵{amount}
                            </option>
                          ))}
                        </select>

                        {quantity > 0 && cartItem?.selectedAmount ? (
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm font-bold">
                              GH₵{cartItem.selectedAmount}
                            </span>

                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 bg-transparent"
                                onClick={() =>
                                  removeItemQuantity(product.id)
                                }
                                aria-label={`Remove one ${product.name}`}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>

                              <span className="w-5 text-center text-sm font-semibold">
                                {quantity}
                              </span>

                              <Button
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => addItem(product)}
                                aria-label={`Add another ${product.name}`}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : null}
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

                <h3 className="text-lg font-semibold">
                  Your basket
                </h3>

                {totalItems > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </div>

              {cartItems.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Your basket is empty. Add items from the market to get
                  started.
                </p>
              ) : (
                <>
                  <ul className="mt-4 space-y-3">
                    {cartItems.map(
                      ({
                        product,
                        quantity,
                        unitPrice,
                        total,
                      }) => (
                        <li
                          key={product.id}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {product.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {quantity} × GH₵{unitPrice}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              GH₵{total}
                            </span>

                            <button
                              onClick={() =>
                                removeItem(product.id)
                              }
                              className="text-muted-foreground transition-colors hover:text-destructive"
                              aria-label={`Remove ${product.name} from basket`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ),
                    )}
                  </ul>

                  <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Products subtotal</span>
                      <span>GH₵{subtotal}</span>
                    </div>

                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Nsawam delivery
                      </span>

                      <span>GH₵{DELIVERY_FEE}</span>
                    </div>

                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span>GH₵{grandTotal}</span>
                    </div>
                  </div>

                  {!minimumOrderReached && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      Add GH₵
                      {MINIMUM_ORDER - subtotal} more in products
                      to reach the GH₵{MINIMUM_ORDER} minimum order.
                    </div>
                  )}

                  {minimumOrderReached && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                      Minimum order reached. Your basket is ready for
                      checkout.
                    </div>
                  )}
                </>
              )}

              <Button
                asChild={minimumOrderReached}
                className="mt-6 w-full"
                disabled={
                  cartItems.length === 0 ||
                  !minimumOrderReached
                }
              >
                {minimumOrderReached ? (
                  <a href="#book">
                    Checkout &amp; schedule delivery
                  </a>
                ) : (
                  <span>
                    Minimum GH₵{MINIMUM_ORDER} Required
                  </span>
                )}
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Delivery within Nsawam: GH₵{DELIVERY_FEE}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
