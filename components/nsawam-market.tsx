"use client"

import { useMemo, useState } from "react"
import {
  ArrowRight,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"

type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
}

type CartItem = Product & {
  quantity: number
}

const products: Product[] = [
  {
    id: "fresh-fruits",
    name: "Fresh Fruits",
    description:
      "Fresh seasonal fruits selected from local Nsawam market sellers.",
    price: 25,
    image:
      "https://images.pexels.com/photos/36537192/pexels-photo-36537192.jpeg?cs=srgb&dl=pexels-reagan-agyei-mensah-2160161940-36537192.jpg&fm=jpg",
    category: "Fresh Produce",
  },
  {
    id: "fresh-vegetables",
    name: "Fresh Vegetables",
    description:
      "Fresh garden vegetables for your everyday meals.",
    price: 20,
    image:
      "https://images.pexels.com/photos/19534771/pexels-photo-19534771.jpeg?cs=srgb&dl=pexels-tkirkgoz-19534771.jpg&fm=jpg",
    category: "Fresh Produce",
  },
  {
    id: "plantain",
    name: "Plantain",
    description:
      "Fresh locally sourced plantain, perfect for frying, boiling or roasting.",
    price: 30,
    image:
      "https://images.pexels.com/photos/30893282/pexels-photo-30893282.jpeg?cs=srgb&dl=pexels-bertellifotografia-30893282.jpg&fm=jpg",
    category: "Farm Produce",
  },
  {
    id: "tomatoes",
    name: "Tomatoes",
    description:
      "Fresh ripe tomatoes selected for quality and freshness.",
    price: 25,
    image:
      "https://images.pexels.com/photos/7656978/pexels-photo-7656978.jpeg?cs=srgb&dl=pexels-cup-of-couple-7656978.jpg&fm=jpg",
    category: "Fresh Produce",
  },
  {
    id: "onions",
    name: "Onions",
    description:
      "Quality onions for your kitchen and everyday cooking.",
    price: 20,
    image:
      "https://images.pexels.com/photos/7129171/pexels-photo-7129171.jpeg?cs=srgb&dl=pexels-michael-burrows-7129171.jpg&fm=jpg",
    category: "Fresh Produce",
  },
  {
    id: "fresh-eggs",
    name: "Fresh Eggs",
    description:
      "Farm-fresh eggs carefully selected for your household.",
    price: 35,
    image:
      "https://images.pexels.com/photos/35484359/pexels-photo-35484359.jpeg?cs=srgb&dl=pexels-ivett-35484359.jpg&fm=jpg",
    category: "Groceries",
  },
  {
    id: "chicken",
    name: "Chicken",
    description:
      "Quality chicken for family meals and special occasions.",
    price: 85,
    image:
      "https://images.pexels.com/photos/12381147/pexels-photo-12381147.jpeg?cs=srgb&dl=pexels-sonic-230970541-12381147.jpg&fm=jpg",
    category: "Meat & Poultry",
  },
  {
    id: "drinks",
    name: "Drinks & Beverages",
    description:
      "Refreshing drinks and beverages available for delivery.",
    price: 15,
    image:
      "https://images.pexels.com/photos/15974934/pexels-photo-15974934.jpeg?cs=srgb&dl=pexels-efnanphotography-15974934.jpg&fm=jpg",
    category: "Beverages",
  },
]

function ProductVisual({
  image,
  name,
}: {
  image: string
  name: string
}) {
  return (
    <div className="relative h-48 overflow-hidden bg-muted">
      <img
        src={image}
        alt={name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        referrerPolicy="no-referrer"
      />

      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />

      <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
        Fresh selection
      </div>
    </div>
  )
}

export function NsawamMarket() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      )

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ]
    })
  }

  const increaseQuantity = (productId: string) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    )
  }

  const decreaseQuantity = (productId: string) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const cartItemCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  )

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [cart]
  )

  const handleProductOrder = (product: Product) => {
    const message =
      "Hello Kingdom Faith Transport! 👋\n\n" +
      "I would like to order:\n\n" +
      "Product: " +
      product.name +
      "\n" +
      "Category: " +
      product.category +
      "\n" +
      "Quantity: 1\n" +
      "Price: GHS " +
      product.price.toFixed(2) +
      "\n\n" +
      "Please let me know the next steps for delivery. Thank you!"

    const whatsappUrl =
      "https://wa.me/233240555688?text=" +
      encodeURIComponent(message)

    window.open(whatsappUrl, "_blank")
  }

  const handleCartOrder = () => {
    if (cart.length === 0) {
      return
    }

    const orderLines = cart
      .map(
        (item) =>
          "- " +
          item.name +
          " x " +
          item.quantity +
          " = GHS " +
          (item.price * item.quantity).toFixed(2)
      )
      .join("\n")

    const message =
      "Hello Kingdom Faith Transport! 👋\n\n" +
      "I would like to place a Nsawam Market order.\n\n" +
      "ORDER DETAILS\n" +
      orderLines +
      "\n\n" +
      "TOTAL: GHS " +
      cartTotal.toFixed(2) +
      "\n\n" +
      "Please confirm availability and let me know the delivery arrangements.\n\n" +
      "Thank you!"

    const whatsappUrl =
      "https://wa.me/233240555688?text=" +
      encodeURIComponent(message)

    window.open(whatsappUrl, "_blank")
  }

  const handleGeneralOrder = () => {
    const message =
      "Hello Kingdom Faith Transport! I would like to ask about another product from Nsawam Market."

    const whatsappUrl =
      "https://wa.me/233240555688?text=" +
      encodeURIComponent(message)

    window.open(whatsappUrl, "_blank")
  }

  return (
    <section
      id="nsawam-market"
      className="w-full bg-background px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
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
                Choose your products, add them to your cart and send your
                complete order to KFM through WhatsApp.
              </p>
            </div>

            <div className="h-28 w-40 shrink-0 overflow-hidden rounded-2xl border border-white/20 shadow-xl">
              <img
                src="https://images.pexels.com/photos/36537192/pexels-photo-36537192.jpeg?cs=srgb&dl=pexels-reagan-agyei-mensah-2160161940-36537192.jpg&fm=jpg"
                alt="Ghanaian outdoor market"
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Cart Button */}
        <div className="mb-8 flex justify-end">
          <Button
            onClick={() => setCartOpen(true)}
            className="relative gap-2"
          >
            <ShoppingCart className="h-5 w-5" />
            My Cart

            {cartItemCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-green-700">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>

        {/* Products */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const cartItem = cart.find(
              (item) => item.id === product.id
            )

            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <ProductVisual
                  image={product.image}
                  name={product.name}
                />

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

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Starting from
                      </p>

                      <p className="text-xl font-bold text-green-700">
                        GHS {product.price.toFixed(2)}
                      </p>
                    </div>

                    {cartItem ? (
                      <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            decreaseQuantity(product.id)
                          }
                          aria-label={"Decrease " + product.name}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <span className="min-w-6 text-center text-sm font-bold">
                          {cartItem.quantity}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            increaseQuantity(product.id)
                          }
                          aria-label={"Increase " + product.name}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => addToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => handleProductOrder(product)}
                  >
                    Order Now
                  </Button>
                </div>
              </article>
            )
          })}
        </div>

        {/* Cart Drawer */}
        {cartOpen && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close cart"
              className="absolute inset-0 h-full w-full bg-black/50"
              onClick={() => setCartOpen(false)}
            />

            <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="text-xl font-bold">
                    Your Market Cart
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {cartItemCount} item
                    {cartItemCount === 1 ? "" : "s"}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCartOpen(false)}
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                      <ShoppingCart className="h-9 w-9 text-muted-foreground" />
                    </div>

                    <h3 className="font-semibold">
                      Your cart is empty
                    </h3>

                    <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                      Add products from Nsawam Market to create your order.
                    </p>

                    <Button
                      className="mt-5"
                      onClick={() => setCartOpen(false)}
                    >
                      Continue Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border p-4"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold">
                                  {item.name}
                                </h3>

                                <p className="text-sm text-muted-foreground">
                                  GHS {item.price.toFixed(2)} each
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeFromCart(item.id)
                                }
                                className="text-muted-foreground transition-colors hover:text-destructive"
                                aria-label={"Remove " + item.name}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    decreaseQuantity(item.id)
                                  }
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>

                                <span className="min-w-7 text-center text-sm font-bold">
                                  {item.quantity}
                                </span>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    increaseQuantity(item.id)
                                  }
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              <p className="font-bold">
                                GHS{" "}
                                {(
                                  item.price * item.quantity
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t bg-muted/30 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-semibold">
                      Order Total
                    </span>

                    <span className="text-2xl font-bold text-green-700">
                      GHS {cartTotal.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleCartOrder}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Order Cart on WhatsApp
                  </Button>

                  <Button
                    variant="ghost"
                    className="mt-2 w-full"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>

                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Delivery charges and final availability will be
                    confirmed through WhatsApp.
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Contact */}
        <div className="mt-10 rounded-2xl border bg-muted/40 p-6 text-center">
          <h3 className="text-lg font-bold">
            Need help with your market order?
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Contact Kingdom Faith Transport and we will help you with
            your order.
          </p>

          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
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

            <a
              href="tel:+233204097129"
              className="inline-flex items-center gap-2 font-semibold hover:underline"
            >
              <Phone className="h-4 w-4" />
              Call: 020 409 7129
            </a>
          </div>
        </div>

        {/* More Products */}
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
            onClick={handleGeneralOrder}
          >
            Ask About Products
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
