"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShoppingCart,
  Trash2,
  User,
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

type CheckoutDetails = {
  fullName: string
  phone: string
  whatsapp: string
  address: string
  instructions: string
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

const initialCheckoutDetails: CheckoutDetails = {
  fullName: "",
  phone: "",
  whatsapp: "",
  address: "",
  instructions: "",
}

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
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutDetails, setCheckoutDetails] = useState<CheckoutDetails>(
    initialCheckoutDetails
  )
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")

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

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [cart]
  )

  /*
 * Delivery is deliberately kept at GHS 0 for now.
 *
 * When we connect the real KFM delivery pricing system,
 * this value can be calculated from the customer's location.
 */
  const deliveryFee: number = 0

  const cartTotal = cartSubtotal + deliveryFee

  const updateCheckoutField = (
    field: keyof CheckoutDetails,
    value: string
  ) => {
    setCheckoutDetails((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const openCheckout = () => {
    if (cart.length === 0) {
      return
    }

    setCartOpen(false)
    setOrderSubmitted(false)
    setCheckoutOpen(true)
  }

  const closeCheckout = () => {
    setCheckoutOpen(false)
  }

  const isCheckoutValid =
    checkoutDetails.fullName.trim().length >= 2 &&
    checkoutDetails.phone.trim().length >= 9 &&
    checkoutDetails.address.trim().length >= 5

  const createOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-8)

    return `KFM-${timestamp}`
  }

  const handleCheckoutSubmit = () => {
    if (!isCheckoutValid || cart.length === 0) {
      return
    }

    const newOrderNumber = createOrderNumber()

    setOrderNumber(newOrderNumber)
    setOrderSubmitted(true)

    /*
     * This is intentionally not clearing the cart yet.
     *
     * Once Paystack is connected, the cart should only be cleared
     * after successful payment confirmation.
     */
  }

  const handleWhatsAppFromCheckout = () => {
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
      "NEW MARKET ORDER\n\n" +
      "Order: " +
      (orderNumber || "Checkout Order") +
      "\n\n" +
      "CUSTOMER DETAILS\n" +
      "Name: " +
      checkoutDetails.fullName +
      "\n" +
      "Phone: " +
      checkoutDetails.phone +
      "\n" +
      "WhatsApp: " +
      (checkoutDetails.whatsapp || checkoutDetails.phone) +
      "\n" +
      "Delivery Address: " +
      checkoutDetails.address +
      "\n" +
      "Instructions: " +
      (checkoutDetails.instructions || "None") +
      "\n\n" +
      "ORDER ITEMS\n" +
      orderLines +
      "\n\n" +
      "SUBTOTAL: GHS " +
      cartSubtotal.toFixed(2) +
      "\n" +
      "DELIVERY: " +
      (deliveryFee === 0
        ? "To be confirmed"
        : "GHS " + deliveryFee.toFixed(2)) +
      "\n" +
      "TOTAL: GHS " +
      cartTotal.toFixed(2) +
      "\n\n" +
      "PAYMENT STATUS: Awaiting payment\n\n" +
      "Please confirm the order and payment instructions. Thank you!"

    const whatsappUrl =
      "https://wa.me/233240555688?text=" +
      encodeURIComponent(message)

    window.open(whatsappUrl, "_blank")
  }

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

  const handleGeneralOrder = () => {
    const message =
      "Hello Kingdom Faith Transport! I would like to ask about another product from Nsawam Market."

    const whatsappUrl =
      "https://wa.me/233240555688?text=" +
      encodeURIComponent(message)

    window.open(whatsappUrl, "_blank")
  }

  const resetOrder = () => {
    setCart([])
    setCheckoutOpen(false)
    setCartOpen(false)
    setOrderSubmitted(false)
    setOrderNumber("")
    setCheckoutDetails(initialCheckoutDetails)
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
                Choose your products, add them to your cart and continue
                to checkout.
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Subtotal
                      </span>

                      <span>
                        GHS {cartSubtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Delivery
                      </span>

                      <span className="text-muted-foreground">
                        To be confirmed
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="font-semibold">
                        Estimated Total
                      </span>

                      <span className="text-2xl font-bold text-green-700">
                        GHS {cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="mt-5 w-full gap-2"
                    size="lg"
                    onClick={openCheckout}
                  >
                    Continue to Checkout
                    <ArrowRight className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    className="mt-2 w-full"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>

                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Delivery charges will be confirmed based on your
                    delivery location.
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Checkout */}
        {checkoutOpen && (
          <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 p-0 sm:p-6">
            <div className="min-h-full bg-background sm:mx-auto sm:max-w-5xl sm:rounded-3xl sm:shadow-2xl">
              {/* Checkout Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-5 py-4 backdrop-blur-md sm:rounded-t-3xl sm:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-green-600">
                    KFM Market
                  </p>

                  <h2 className="text-xl font-bold sm:text-2xl">
                    {orderSubmitted
                      ? "Order Received"
                      : "Customer Checkout"}
                  </h2>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeCheckout}
                  aria-label="Close checkout"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {orderSubmitted ? (
                /* Confirmation */
                <div className="px-5 py-16 sm:px-8">
                  <div className="mx-auto max-w-xl text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>

                    <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-green-600">
                      Order Created
                    </p>

                    <h3 className="mt-2 text-3xl font-bold">
                      Thank you, {checkoutDetails.fullName.split(" ")[0]}!
                    </h3>

                    <p className="mt-4 text-muted-foreground">
                      Your market order has been prepared for the next
                      payment step.
                    </p>

                    <div className="mt-8 rounded-2xl border bg-muted/40 p-6 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Order Number
                        </span>

                        <span className="font-bold">
                          {orderNumber}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <span className="font-semibold">
                          Order Total
                        </span>

                        <span className="text-xl font-bold text-green-700">
                          GHS {cartTotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                        <p className="text-sm font-semibold text-yellow-800">
                          Payment status
                        </p>

                        <p className="mt-1 text-sm text-yellow-700">
                          Awaiting Mobile Money payment.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Button
                        size="lg"
                        className="gap-2"
                        onClick={handleWhatsAppFromCheckout}
                      >
                        <ShoppingCart className="h-5 w-5" />
                        Send Order to KFM
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        onClick={resetOrder}
                      >
                        Continue Shopping
                      </Button>
                    </div>

                    <p className="mt-5 text-xs leading-5 text-muted-foreground">
                      Mobile Money payment will be connected in the next
                      stage. Do not treat this screen as confirmation of
                      payment yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_380px]">
                  {/* Customer Form */}
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                          <User className="h-5 w-5 text-green-700" />
                        </div>

                        <div>
                          <h3 className="text-xl font-bold">
                            Your Details
                          </h3>

                          <p className="text-sm text-muted-foreground">
                            Tell us where to deliver your order.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label
                          htmlFor="kfm-full-name"
                          className="mb-2 block text-sm font-semibold"
                        >
                          Full Name
                        </label>

                        <input
                          id="kfm-full-name"
                          type="text"
                          value={checkoutDetails.fullName}
                          onChange={(event) =>
                            updateCheckoutField(
                              "fullName",
                              event.target.value
                            )
                          }
                          placeholder="Enter your full name"
                          autoComplete="name"
                          className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="kfm-phone"
                            className="mb-2 block text-sm font-semibold"
                          >
                            Phone Number
                          </label>

                          <input
                            id="kfm-phone"
                            type="tel"
                            value={checkoutDetails.phone}
                            onChange={(event) =>
                              updateCheckoutField(
                                "phone",
                                event.target.value
                              )
                            }
                            placeholder="024 000 0000"
                            autoComplete="tel"
                            className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="kfm-whatsapp"
                            className="mb-2 block text-sm font-semibold"
                          >
                            WhatsApp Number
                            <span className="ml-1 font-normal text-muted-foreground">
                              (optional)
                            </span>
                          </label>

                          <input
                            id="kfm-whatsapp"
                            type="tel"
                            value={checkoutDetails.whatsapp}
                            onChange={(event) =>
                              updateCheckoutField(
                                "whatsapp",
                                event.target.value
                              )
                            }
                            placeholder="024 000 0000"
                            autoComplete="tel"
                            className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="kfm-address"
                          className="mb-2 flex items-center gap-2 text-sm font-semibold"
                        >
                          <MapPin className="h-4 w-4 text-green-600" />
                          Delivery Address
                        </label>

                        <textarea
                          id="kfm-address"
                          value={checkoutDetails.address}
                          onChange={(event) =>
                            updateCheckoutField(
                              "address",
                              event.target.value
                            )
                          }
                          placeholder="Enter your delivery location, house number, landmark or directions"
                          rows={4}
                          autoComplete="street-address"
                          className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="kfm-instructions"
                          className="mb-2 block text-sm font-semibold"
                        >
                          Delivery Instructions
                          <span className="ml-1 font-normal text-muted-foreground">
                            (optional)
                          </span>
                        </label>

                        <textarea
                          id="kfm-instructions"
                          value={checkoutDetails.instructions}
                          onChange={(event) =>
                            updateCheckoutField(
                              "instructions",
                              event.target.value
                            )
                          }
                          placeholder="Example: Call me when the rider arrives."
                          rows={3}
                          className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>
                    </div>

                    {/* Payment Placeholder */}
                    <div className="mt-8 rounded-2xl border border-dashed border-green-300 bg-green-50/50 p-5">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                          <Phone className="h-5 w-5 text-green-700" />
                        </div>

                        <div>
                          <h3 className="font-bold">
                            Mobile Money Payment
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Mobile Money payment will be available here
                            after the secure Paystack payment connection is
                            added.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          setCheckoutOpen(false)
                          setCartOpen(true)
                        }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Cart
                      </Button>

                      <Button
                        className="flex-1 gap-2"
                        size="lg"
                        disabled={!isCheckoutValid}
                        onClick={handleCheckoutSubmit}
                      >
                        Continue
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>

                    {!isCheckoutValid && (
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        Please enter your name, phone number and delivery
                        address to continue.
                      </p>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border bg-muted/30 p-5">
                      <h3 className="text-lg font-bold">
                        Order Summary
                      </h3>

                      <div className="mt-5 space-y-4">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-3"
                          >
                            <div className="relative">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-16 w-16 rounded-xl object-cover"
                              />

                              <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-green-700 px-1 text-xs font-bold text-white">
                                {item.quantity}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">
                                {item.name}
                              </p>

                              <p className="mt-1 text-sm text-muted-foreground">
                                GHS {item.price.toFixed(2)} each
                              </p>
                            </div>

                            <p className="font-semibold">
                              GHS{" "}
                              {(
                                item.price * item.quantity
                              ).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 space-y-3 border-t pt-5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Subtotal
                          </span>

                          <span>
                            GHS {cartSubtotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Delivery
                          </span>

                          <span className="text-muted-foreground">
                            To be confirmed
                          </span>
                        </div>

                        <div className="flex justify-between border-t pt-4">
                          <span className="font-bold">
                            Estimated Total
                          </span>

                          <span className="text-xl font-bold text-green-700">
                            GHS {cartTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl bg-background p-4">
                        <p className="text-xs leading-5 text-muted-foreground">
                          Your order will be prepared by KFM and arranged
                          for local delivery after payment confirmation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
