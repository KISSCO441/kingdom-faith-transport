"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  Clock3,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBasket,
  Truck,
  X,
} from "lucide-react"
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
    image: "/images/vegetables.jpg",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "garden-eggs",
    name: "Garden Eggs",
    unit: "select your amount",
    price: 5,
    category: "Vegetables",
    image: "/images/vegetables.jpg",
    amountOptions: createAmountOptions(5),
  },
  {
    id: "pepper",
    name: "Pepper",
    unit: "select your amount",
    price: 5,
    category: "Vegetables",
    image: "/images/vegetables.jpg",
    amountOptions: createAmountOptions(5),
  },
  {
    id: "plantain",
    name: "Ripe Plantain",
    unit: "select your amount",
    price: 10,
    category: "Fruits",
    image: "/images/fruits.jpg",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "pineapple",
    name: "Pineapple",
    unit: "select your amount",
    price: 10,
    category: "Fruits",
    image: "/images/fruits.jpg",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "oranges",
    name: "Oranges",
    unit: "select your amount",
    price: 5,
    category: "Fruits",
    image: "/images/fruits.jpg",
    amountOptions: createAmountOptions(5),
  },
  {
    id: "rice",
    name: "Local Rice",
    unit: "select your amount",
    price: 10,
    category: "Staples",
    image: "/images/Staples.jpg",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "yam",
    name: "Yam Tubers",
    unit: "select your amount",
    price: 30,
    category: "Staples",
    image: "/images/Staples.jpg",
    amountOptions: createAmountOptions(30),
  },
  {
    id: "gari",
    name: "Gari",
    unit: "select your amount",
    price: 10,
    category: "Staples",
    image: "/images/Staples.jpg",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "fish",
    name: "Fresh Fish",
    unit: "select your amount",
    price: 15,
    category: "Protein",
    image: "/images/Proteins.jpg",
    amountOptions: createAmountOptions(15),
  },
  {
    id: "smoked-fish",
    name: "Smoked Fish",
    unit: "select your amount",
    price: 10,
    category: "Protein",
    image: "/images/Proteins.jpg",
    amountOptions: createAmountOptions(10),
  },
  {
    id: "eggs",
    name: "Eggs",
    unit: "select your amount",
    price: 10,
    category: "Protein",
    image: "/images/Proteins.jpg",
    amountOptions: createAmountOptions(10),
  },
]

const categories = ["All", "Vegetables", "Fruits", "Staples", "Protein"]

const MINIMUM_ORDER = 50
const DELIVERY_FEE = 20

const WHATSAPP_NUMBER = "233240555688"
const KFM_PHONE_1 = "024 0555 688"
const KFM_PHONE_2 = "020 409 7129"

export function NsawamMarket() {
const [activeCategory, setActiveCategory] = useState("All")
const [cart, setCart] = useState<Record<string, CartItem>>({})

const [customerName, setCustomerName] = useState("")
const [customerPhone, setCustomerPhone] = useState("")
const [deliveryLocation, setDeliveryLocation] = useState("")
const [showOrderOptions, setShowOrderOptions] = useState(false)

const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
const [orderNumber, setOrderNumber] = useState("")
const [orderError, setOrderError] = useState("")

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

  function scrollToProducts() {
    document
      .getElementById("market-products")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
  }

  function scrollToBasket() {
    document
      .getElementById("market-basket")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
  }

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

    setShowOrderOptions(false)
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

    setShowOrderOptions(false)
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

    setShowOrderOptions(false)
  }

  function removeItem(id: string) {
    setCart((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })

    setShowOrderOptions(false)
  }

 async function prepareOrder() {
  if (!minimumOrderReached) {
    alert(`Minimum market order is GH₵${MINIMUM_ORDER}.`)
    return
  }

  if (
    !customerName.trim() ||
    !customerPhone.trim() ||
    !deliveryLocation.trim()
  ) {
    alert(
      "Please enter your name, phone number and delivery location before placing your order.",
    )
    return
  }

  if (cartItems.length === 0) {
    alert("Your basket is empty.")
    return
  }

  setIsSubmittingOrder(true)
  setOrderError("")
  setOrderNumber("")
  setShowOrderOptions(false)

  try {
    const response = await fetch("/api/market-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryLocation: deliveryLocation.trim(),
        productSubtotal: subtotal,
        deliveryFee: DELIVERY_FEE,
        totalAmount: grandTotal,
        items: cartItems.map(
          ({ product, quantity, unitPrice, total }) => ({
            productName: product.name,
            category: product.category,
            quantity,
            unitAmount: unitPrice,
            lineTotal: total,
          }),
        ),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data?.error || "Unable to create your market order.",
      )
    }

    setOrderNumber(data.order.orderNumber)
    setShowOrderOptions(true)

    setTimeout(() => {
      document
        .getElementById("market-order-options")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
    }, 100)
  } catch (error) {
    console.error("KFM Market order submission error:", error)

    setOrderError(
      error instanceof Error
        ? error.message
        : "Unable to create your market order. Please try again.",
    )
  } finally {
    setIsSubmittingOrder(false)
  }
}
  function createWhatsAppMessage() {
    const orderLines = cartItems
      .map(
        ({ product, quantity, unitPrice, total }) =>
          `${product.name}: ${quantity} × GH₵${unitPrice} = GH₵${total}`,
      )
      .join("\n")

    return [
      "KFM NSAWAM MARKET ORDER",
      "",
      `Customer: ${customerName.trim()}`,
      `Phone: ${customerPhone.trim()}`,
      `Delivery Location: ${deliveryLocation.trim()}`,
      "",
      "ORDER ITEMS:",
      orderLines,
      "",
      `Products Subtotal: GH₵${subtotal}`,
      `Nsawam Delivery: GH₵${DELIVERY_FEE}`,
      `TOTAL: GH₵${grandTotal}`,
      "",
      "Please confirm this order with the customer.",
    ].join("\n")
  }

  function sendWhatsAppOrder() {
    const message = createWhatsAppMessage()

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
  }

  function callKFM(phoneNumber: string) {
    window.location.href = `tel:${phoneNumber.replace(/\s/g, "")}`
  }

  return (
    <section
      id="nsawam-market"
      className="border-t border-border bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
       {/* MARKET HERO */}
<div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-lg">
  <div className="grid items-stretch lg:grid-cols-[1.05fr_0.95fr]">
    {/* HERO CONTENT */}
    <div className="flex flex-col justify-center p-7 sm:p-10 md:p-14 lg:p-16">
      <div className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary">
        🛒 KFM Nsawam Market
      </div>

      <h2 className="mt-6 max-w-3xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
        Fresh from the market.
        <span className="mt-2 block text-primary">
          Delivered to you.
        </span>
      </h2>

      <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg md:text-xl">
        Shop selected fresh market essentials from Nsawam and have
        your order delivered to your home. Choose your amount, build
        your basket and let KFM make your market shopping easier.
      </p>

      {/* HERO ACTIONS */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          size="lg"
          className="h-12 px-7 text-base font-bold"
          onClick={scrollToProducts}
        >
          Shop the Market
        </Button>

        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 px-7 text-base font-bold"
          onClick={scrollToBasket}
        >
          <ShoppingBasket className="mr-2 h-5 w-5" />
          View Basket
          {totalItems > 0 ? ` (${totalItems})` : ""}
        </Button>
      </div>

      {/* HERO BENEFITS */}
      <div className="mt-10 grid gap-4 border-t border-border pt-7 sm:grid-cols-3">
        <div className="flex gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Truck className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="text-sm font-bold">
              Nsawam Delivery
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              GH₵{DELIVERY_FEE}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="text-sm font-bold">
              Easy Ordering
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Choose your amount
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Clock3 className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="text-sm font-bold">
              Convenient
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Order from home
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* HERO IMAGE */}
    <div className="relative min-h-[380px] lg:min-h-[620px]">
      <Image
        src="/images/vegetables.jpg"
        alt="Fresh market vegetables at KFM Nsawam Market"
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
      />

      {/* IMAGE OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
        <div className="rounded-2xl border border-white/20 bg-black/35 p-5 backdrop-blur-sm">
          <p className="text-xl font-extrabold text-white sm:text-2xl">
            Fresh market essentials
          </p>

          <p className="mt-2 text-sm text-white/85 sm:text-base">
            Vegetables • Fruits • Staples • Protein
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
              Fresh
            </span>

            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
              Convenient
            </span>

            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
              Nsawam Delivery
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

        {/* MARKET INFORMATION */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <MapPin className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Nsawam Delivery
                </h3>
                <p className="text-sm text-muted-foreground">
                  Delivery within Nsawam
                </p>
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold">
              GH₵{DELIVERY_FEE}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <ShoppingBasket className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Minimum Order
                </h3>
                <p className="text-sm text-muted-foreground">
                  Products subtotal
                </p>
              </div>
            </div>

            <p className="mt-4 text-2xl font-bold">
              GH₵{MINIMUM_ORDER}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <Phone className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Need Help?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Call KFM Market
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1 text-sm font-semibold">
              <p>{KFM_PHONE_1}</p>
              <p>{KFM_PHONE_2}</p>
            </div>
          </div>
        </div>

        {/* MARKET INTRO */}
        <div className="mx-auto mt-16 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Shop Nsawam Market
          </p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Choose what you need
          </h3>

          <p className="mt-4 text-muted-foreground">
            Select a category, choose the amount you want, and add it to
            your basket. You can mix products until you reach the minimum
            order.
          </p>
        </div>

        {/* PRODUCTS */}
        <div
          id="market-products"
          className="mt-10 scroll-mt-24"
        >
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">
                Market Categories
              </p>

              <p className="text-xs text-muted-foreground">
                Browse the products currently available
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product) => {
              const cartItem = cart[product.id]
              const quantity = cartItem?.quantity ?? 0

              return (
                <div
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />

                    {quantity > 0 && (
                      <div className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow">
                        {quantity} in basket
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h4 className="text-base font-semibold">
                      {product.name}
                    </h4>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.unit}
                    </p>

                    <div className="mt-4">
                      <label
                        htmlFor={`${product.id}-amount`}
                        className="text-xs font-medium"
                      >
                        Choose amount
                      </label>

                      <select
                        id={`${product.id}-amount`}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
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
                    </div>

                    {quantity > 0 && cartItem?.selectedAmount ? (
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 p-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Selected
                          </p>

                          <p className="font-bold">
                            GH₵{cartItem.selectedAmount}
                          </p>
                        </div>

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
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Select an amount to add this item to your basket.
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* BASKET */}
        <div
          id="market-basket"
          className="mt-14 scroll-mt-24"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <ShoppingBasket className="h-6 w-6 text-primary" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Your Shopping Basket
                  </p>

                  <h3 className="mt-1 text-2xl font-bold">
                    Review your market items
                  </h3>
                </div>

                {totalItems > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    {totalItems} item
                    {totalItems === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
                  <ShoppingBasket className="mx-auto h-10 w-10 text-muted-foreground" />

                  <p className="mt-4 font-semibold">
                    Your basket is empty
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Select products above to start building your market
                    order.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5"
                    onClick={scrollToProducts}
                  >
                    Browse Market
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {cartItems.map(
                    ({
                      product,
                      quantity,
                      unitPrice,
                      total,
                    }) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {quantity} × GH₵{unitPrice}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold">
                            GH₵{total}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(product.id)
                            }
                            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                            aria-label={`Remove ${product.name} from basket`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            <aside className="lg:sticky lg:top-20 lg:h-fit">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-bold">
                  Basket Summary
                </h3>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Products subtotal</span>
                    <span>GH₵{subtotal}</span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      Nsawam delivery
                    </span>

                    <span>GH₵{subtotal > 0 ? DELIVERY_FEE : 0}</span>
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>GH₵{grandTotal}</span>
                    </div>
                  </div>
                </div>

                {!minimumOrderReached && subtotal > 0 && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Add GH₵
                    {MINIMUM_ORDER - subtotal} more in products to reach
                    the GH₵{MINIMUM_ORDER} minimum order.
                  </div>
                )}

                {minimumOrderReached && (
                  <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    Your minimum order has been reached. You can continue
                    to checkout.
                  </div>
                )}

                <Button
                  type="button"
                  className="mt-5 w-full"
                  disabled={
                    cartItems.length === 0 ||
                    !minimumOrderReached
                  }
                  onClick={() => {
                    if (!minimumOrderReached) return

                    document
                      .getElementById("market-checkout")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                  }}
                >
                  {minimumOrderReached
                    ? "Checkout & schedule delivery"
                    : `Minimum GH₵${MINIMUM_ORDER} Required`}
                </Button>
              </div>
            </aside>
          </div>
        </div>

        {/* CHECKOUT */}
        {minimumOrderReached && (
          <div
            id="market-checkout"
            className="mx-auto mt-14 max-w-3xl scroll-mt-24 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8"
          >
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Market Checkout
              </p>

              <h3 className="mt-2 text-3xl font-bold">
                Complete Your Market Order
              </h3>

              <p className="mt-3 text-sm text-muted-foreground">
                Enter your details below to continue with your order.
              </p>
            </div>

            <div className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="market-customer-name"
                  className="text-sm font-medium"
                >
                  Customer Name
                </label>

                <input
                  id="market-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(event) => {
                    setCustomerName(event.target.value)
                    setShowOrderOptions(false)
                  }}
                  placeholder="Enter your name"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>

              <div>
                <label
                  htmlFor="market-customer-phone"
                  className="text-sm font-medium"
                >
                  Phone Number
                </label>

                <input
                  id="market-customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => {
                    setCustomerPhone(event.target.value)
                    setShowOrderOptions(false)
                  }}
                  placeholder="e.g. 024 000 0000"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>

              <div>
                <label
                  htmlFor="market-delivery-location"
                  className="text-sm font-medium"
                >
                  Delivery Location
                </label>

                <input
                  id="market-delivery-location"
                  type="text"
                  value={deliveryLocation}
                  onChange={(event) => {
                    setDeliveryLocation(event.target.value)
                    setShowOrderOptions(false)
                  }}
                  placeholder="Enter your delivery location in Nsawam"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>

              <div className="rounded-2xl border border-border bg-muted/40 p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">
                    Order Summary
                  </h4>

                  <span className="text-sm font-semibold text-primary">
                    {totalItems} item
                    {totalItems === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  {cartItems.map(
                    ({
                      product,
                      quantity,
                      unitPrice,
                      total,
                    }) => (
                      <div
                        key={product.id}
                        className="flex justify-between gap-4"
                      >
                        <span>
                          {product.name} ({quantity} × GH₵
                          {unitPrice})
                        </span>

                        <span className="font-medium">
                          GH₵{total}
                        </span>
                      </div>
                    ),
                  )}

                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span>Products subtotal</span>
                      <span>GH₵{subtotal}</span>
                    </div>

                    <div className="mt-1 flex justify-between">
                      <span>Nsawam delivery</span>
                      <span>GH₵{DELIVERY_FEE}</span>
                    </div>

                    <div className="mt-2 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>GH₵{grandTotal}</span>
                    </div>
                  </div>
                </div>
              </div>

             <Button
  type="button"
  className="w-full"
  size="lg"
  onClick={prepareOrder}
  disabled={isSubmittingOrder}
>
  {isSubmittingOrder
    ? "Creating Your KFM Order..."
    : "Place Market Order"}
</Button>

  {showOrderOptions && orderNumber && (
  <div
    id="market-order-options"
    className="rounded-2xl border border-green-200 bg-green-50 p-6"
  >
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
        ✓
      </div>

      <h4 className="mt-4 text-xl font-bold text-green-900">
        Order Received Successfully
      </h4>

      <p className="mt-2 text-sm text-green-800">
        Your KFM Market order has been saved successfully.
      </p>

      <div className="mt-5 rounded-xl border border-green-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your KFM Order Number
        </p>

        <p className="mt-2 text-2xl font-extrabold tracking-wide text-primary">
          {orderNumber}
        </p>
      </div>

      <div className="mt-5 space-y-2 text-sm text-green-800">
        <p>
          <strong>Products:</strong> GH₵{subtotal}
        </p>

        <p>
          <strong>Delivery:</strong> GH₵{DELIVERY_FEE}
        </p>

        <p>
          <strong>Total:</strong> GH₵{grandTotal}
        </p>
      </div>

      <p className="mt-5 text-sm text-green-800">
        Please keep your order number. We will use it to track your
        KFM Market order.
      </p>
    </div>
  </div>
)}
{orderError && (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
    <p className="font-bold">
      We could not create your order.
    </p>

    <p className="mt-2">
      {orderError}
    </p>

    <p className="mt-2">
      Please check your information and try again.
    </p>
  </div>
)}
  </div>
        )}

        {/* MARKET FOOTER */}
        <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="font-semibold">
            KFM Nsawam Market
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Fresh market essentials. Convenient ordering. Nsawam delivery.
          </p>

          <div className="mt-4 flex flex-col items-center justify-center gap-2 text-sm font-medium sm:flex-row sm:gap-5">
            <span>{KFM_PHONE_1}</span>
            <span className="hidden text-muted-foreground sm:inline">
              •
            </span>
            <span>{KFM_PHONE_2}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
