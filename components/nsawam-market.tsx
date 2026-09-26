"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
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
  id: number
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
  email: string
  whatsapp: string
  deliveryLocation: string
  address: string
  instructions: string
}

const products: Product[] = [
  {
    id: 1,
    name: "Fresh Fruits",
    description:
      "Fresh seasonal fruits selected from the local market.",
    price: 25,
    image:
      "https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=900",
    category: "Fresh Produce",
  },
  {
    id: 2,
    name: "Fresh Vegetables",
    description:
      "Fresh garden vegetables for your everyday meals.",
    price: 20,
    image:
      "https://images.pexels.com/photos/165509/pexels-photo-165509.jpeg?auto=compress&cs=tinysrgb&w=900",
    category: "Fresh Produce",
  },
  {
    id: 3,
    name: "Plantain",
    description:
      "Fresh locally sourced plantain, perfect for frying, boiling or roasting.",
    price: 30,
    image:
      "https://images.pexels.com/photos/30893282/pexels-photo-30893282.jpeg?cs=srgb&dl=pexels-bertellifotografia-30893282.jpg&fm=jpg",
    category: "Farm Produce",
  },
  {
    id: 4,
    name: "Tomatoes",
    description:
      "Fresh ripe tomatoes selected for quality and freshness.",
    price: 25,
    image:
      "https://images.pexels.com/photos/7656978/pexels-photo-7656978.jpeg?cs=srgb&dl=pexels-cup-of-couple-7656978.jpg&fm=jpg",
    category: "Fresh Produce",
  },
  {
    id: 5,
    name: "Onions",
    description:
      "Quality onions for your kitchen and everyday cooking.",
    price: 20,
    image:
      "https://images.pexels.com/photos/7129171/pexels-photo-7129171.jpeg?cs=srgb&dl=pexels-michael-burrows-7129171.jpg&fm=jpg",
    category: "Fresh Produce",
  },
  {
    id: 6,
    name: "Fresh Eggs",
    description:
      "Fresh eggs suitable for home cooking and baking.",
    price: 35,
    image:
      "https://images.pexels.com/photos/162712/egg-white-food-protein-healthy-162712.jpeg?auto=compress&cs=tinysrgb&w=900",
    category: "Groceries",
  },
  {
    id: 7,
    name: "Chicken",
    description:
      "Quality chicken for your home meals.",
    price: 85,
    image:
      "https://images.pexels.com/photos/616353/pexels-photo-616353.jpeg?auto=compress&cs=tinysrgb&w=900",
    category: "Fresh Food",
  },
  {
    id: 8,
    name: "Drinks & Beverages",
    description:
      "A selection of refreshing drinks and beverages.",
    price: 15,
    image:
      "https://images.pexels.com/photos/969390/pexels-photo-969390.jpeg?auto=compress&cs=tinysrgb&w=900",
    category: "Drinks",
  },
]

/*
 * PHASE 1 KFM DELIVERY LOCATIONS
 *
 * All current Nsawam Township locations use the
 * current standard Okada delivery charge of GHS 10.
 *
 * More locations and different fees can be added later.
 */
const NSAWAM_DELIVERY_FEE = 10

const nsawamLocations = [
  "Nsawam Central",
  "Djankrom",
  "Oparekrom",
  "Asafoa Adjei",
  "Ayigbe Town",
  "Avaga",
  "Wangara",
  "Atsikope",
  "Bangalow",
  "Duaeden",
  "Asantikro",
  "Ebenezer",
]

const emptyCheckoutDetails: CheckoutDetails = {
  fullName: "",
  phone: "",
  email: "",
  whatsapp: "",
  deliveryLocation: "",
  address: "",
  instructions: "",
}

export function NsawamMarket() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const [checkoutDetails, setCheckoutDetails] =
    useState<CheckoutDetails>(emptyCheckoutDetails)

  const [orderNumber, setOrderNumber] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentError, setPaymentError] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] =
    useState(false)

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    [cart]
  )

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      ),
    [cart]
  )

  /*
   * Delivery is calculated from the selected location.
   *
   * All currently supported Nsawam Township locations
   * have a GHS 10 delivery fee.
   */
  const deliveryFee = checkoutDetails.deliveryLocation
    ? NSAWAM_DELIVERY_FEE
    : 0

  const estimatedTotal = cartTotal + deliveryFee

  const formatCurrency = (amount: number) =>
    `GHS ${amount.toFixed(2)}`

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

  /*
   * ORDER NOW
   *
   * Add the product to the cart and open the cart.
   */
  const orderProductNow = (product: Product) => {
    addToCart(product)
    setCartOpen(true)
  }

  const increaseQuantity = (productId: number) => {
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

  const decreaseQuantity = (productId: number) => {
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

  const removeFromCart = (productId: number) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== productId
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const openCheckout = () => {
    if (cart.length === 0) {
      return
    }

    setPaymentError("")
    setCartOpen(false)
    setCheckoutOpen(true)
  }

  const closeCheckout = () => {
    if (isProcessingPayment) {
      return
    }

    setCheckoutOpen(false)
    setPaymentError("")
  }

  const updateCheckoutField = (
    field: keyof CheckoutDetails,
    value: string
  ) => {
    setCheckoutDetails((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const submitCheckout = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setPaymentError("")

    if (checkoutDetails.fullName.trim().length < 2) {
      setPaymentError(
        "Please enter your full name."
      )
      return
    }

    if (checkoutDetails.phone.trim().length < 9) {
      setPaymentError(
        "Please enter a valid phone number."
      )
      return
    }

    if (!checkoutDetails.email.includes("@")) {
      setPaymentError(
        "Please enter a valid email address."
      )
      return
    }

    if (!checkoutDetails.deliveryLocation) {
      setPaymentError(
        "Please select your delivery location."
      )
      return
    }

    if (checkoutDetails.address.trim().length < 5) {
      setPaymentError(
        "Please enter your delivery address."
      )
      return
    }

    if (cart.length === 0) {
      setPaymentError("Your cart is empty.")
      return
    }

    setIsProcessingPayment(true)

    try {
      const newOrderNumber = `KFM-${Date.now()
        .toString()
        .slice(-8)}`

      setOrderNumber(newOrderNumber)

      const orderItems = cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      }))

      const pendingOrder = {
        orderNumber: newOrderNumber,
        customer: checkoutDetails,
        deliveryLocation:
          checkoutDetails.deliveryLocation,
        items: orderItems,
        subtotal: cartTotal,
        deliveryFee,
        total: estimatedTotal,
        paymentStatus: "PENDING",
        createdAt: new Date().toISOString(),
      }

      sessionStorage.setItem(
        "kfm_pending_order",
        JSON.stringify(pendingOrder)
      )

      const response = await fetch(
        "/api/paystack/initialize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: checkoutDetails.email.trim(),
            amount: estimatedTotal,
            reference: newOrderNumber,
            customerName:
              checkoutDetails.fullName.trim(),
            phone: checkoutDetails.phone.trim(),
            whatsapp:
              checkoutDetails.whatsapp.trim(),
            deliveryLocation:
              checkoutDetails.deliveryLocation,
            address:
              checkoutDetails.address.trim(),
            instructions:
              checkoutDetails.instructions.trim(),
            items: orderItems,
            subtotal: cartTotal,
            deliveryFee,
            total: estimatedTotal,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data?.status) {
        throw new Error(
          data?.message ||
            "Unable to connect to Paystack. Please try again."
        )
      }

      const authorizationUrl =
        data?.data?.authorization_url

      const returnedReference =
        data?.data?.reference

      if (returnedReference) {
        setPaymentReference(returnedReference)
      }

      if (!authorizationUrl) {
        throw new Error(
          "Paystack did not return a payment page."
        )
      }

      window.location.href = authorizationUrl
    } catch (error) {
      console.error("Checkout error:", error)

      setPaymentError(
        error instanceof Error
          ? error.message
          : "An unexpected payment error occurred. Please try again."
      )

      setIsProcessingPayment(false)
    }
  }

  const contactKfm = () => {
    const message =
      "Hello KFM, I need help with a Nsawam Market order."

    window.open(
      `https://wa.me/233240555688?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    )
  }

  const callKfm = () => {
    window.location.href = "tel:+233204097129"
  }

  return (
    <section
      id="nsawam-market"
      className="border-t border-border bg-muted/30 py-20"
    >
      <div className="mx-auto max-w-6xl px-4">

        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Nsawam Market
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Shop Fresh Products From Nsawam
          </h2>

          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Choose products from the local market, add them
            to your order, pay securely with Paystack, and
            have your order prepared for delivery.
          </p>
        </div>

        {/* Information cards */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>

            <h3 className="mt-4 font-semibold">
              Local Market Products
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Shop everyday food and household products
              sourced through the Nsawam market.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>

            <h3 className="mt-4 font-semibold">
              Simple Ordering
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Select a product or add several products to
              your cart before checkout.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <h3 className="mt-4 font-semibold">
              Secure Payment
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pay through Paystack using supported Ghana
              Mobile Money options or a bank card.
            </p>
          </div>

        </div>

        {/* Products */}
        <div className="mt-12">

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h3 className="text-xl font-bold">
                Available Products
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Select a product to start your order.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setCartOpen(true)}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              My Cart

              {cartCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Button>

          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {products.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >

                <div className="relative aspect-[4/3] overflow-hidden bg-muted">

                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                    {product.category}
                  </span>

                </div>

                <div className="p-4">

                  <h4 className="font-semibold">
                    {product.name}
                  </h4>

                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-muted-foreground">
                    {product.description}
                  </p>

                  <div className="mt-4">

                    <span className="text-xs text-muted-foreground">
                      Starting from
                    </span>

                    <div className="mt-1 flex items-center justify-between gap-3">

                      <span className="text-lg font-bold">
                        {formatCurrency(product.price)}
                      </span>

                      <Button
                        size="sm"
                        onClick={() =>
                          orderProductNow(product)
                        }
                      >
                        Order Now
                      </Button>

                    </div>

                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() =>
                      addToCart(product)
                    }
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>

                </div>

              </article>
            ))}

          </div>
        </div>

        {/* Contact KFM */}
        <div className="mt-12 rounded-2xl border border-border bg-background p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h3 className="text-lg font-bold">
                Need help with your order?
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Contact KFM directly if you need help selecting
                a product or completing your market order.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <Button
                variant="outline"
                onClick={contactKfm}
                className="gap-2"
              >
                WhatsApp KFM
              </Button>

              <Button
                variant="outline"
                onClick={callKfm}
                className="gap-2"
              >
                <Phone className="h-4 w-4" />
                Call KFM
              </Button>

            </div>

          </div>
        </div>

      </div>

      {/* CART */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100]">

          <button
            type="button"
            aria-label="Close cart"
            className="absolute inset-0 bg-black/50"
            onClick={() => setCartOpen(false)}
          />

          <div className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-background shadow-2xl">

            <div className="flex items-center justify-between border-b border-border p-5">

              <div>
                <h2 className="text-xl font-bold">
                  Your Cart
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {cartCount}{" "}
                  {cartCount === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCartOpen(false)
                }
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </Button>

            </div>

            <div className="flex-1 overflow-y-auto p-5">

              {cart.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <ShoppingCart className="h-7 w-7 text-muted-foreground" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    Your cart is empty
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    Choose products from the Nsawam Market
                    to start your order.
                  </p>

                  <Button
                    className="mt-5"
                    onClick={() =>
                      setCartOpen(false)
                    }
                  >
                    Continue Shopping
                  </Button>

                </div>
              ) : (

                <div className="space-y-4">

                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border p-4"
                    >

                      <div className="flex gap-4">

                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-20 w-20 shrink-0 rounded-lg object-cover"
                        />

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-3">

                            <div>
                              <h3 className="font-semibold">
                                {item.name}
                              </h3>

                              <p className="mt-1 text-sm text-muted-foreground">
                                {formatCurrency(
                                  item.price
                                )}{" "}
                                each
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(
                                  item.id
                                )
                              }
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                          </div>

                          <div className="mt-3 flex items-center justify-between">

                            <div className="flex items-center rounded-lg border border-border">

                              <button
                                type="button"
                                onClick={() =>
                                  decreaseQuantity(
                                    item.id
                                  )
                                }
                                className="p-2 hover:bg-muted"
                              >
                                <Minus className="h-4 w-4" />
                              </button>

                              <span className="min-w-10 text-center text-sm font-semibold">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  increaseQuantity(
                                    item.id
                                  )
                                }
                                className="p-2 hover:bg-muted"
                              >
                                <Plus className="h-4 w-4" />
                              </button>

                            </div>

                            <span className="font-bold">
                              {formatCurrency(
                                item.price *
                                  item.quantity
                              )}
                            </span>

                          </div>

                        </div>
                      </div>
                    </div>
                  ))}

                </div>
              )}

            </div>

            {cart.length > 0 && (
              <div className="border-t border-border bg-background p-5">

                <div className="space-y-3">

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Subtotal
                    </span>

                    <span className="font-medium">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Delivery
                    </span>

                    <span className="font-medium">
                      Calculated at checkout
                    </span>
                  </div>

                  <div className="border-t border-border pt-3">

                    <div className="flex justify-between">

                      <span className="font-semibold">
                        Estimated Total
                      </span>

                      <span className="text-lg font-bold">
                        {formatCurrency(cartTotal)}
                      </span>

                    </div>

                  </div>

                </div>

                <Button
                  className="mt-5 w-full"
                  size="lg"
                  onClick={openCheckout}
                >
                  Continue to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>

              </div>
            )}

          </div>
        </div>
      )}

      {/* CHECKOUT */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-background">

          <div className="min-h-screen">

            <div className="border-b border-border bg-background/95 backdrop-blur">

              <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">

                <Button
                  variant="ghost"
                  onClick={closeCheckout}
                  disabled={isProcessingPayment}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                <div className="text-center">

                  <h2 className="font-bold">
                    Checkout
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Secure Paystack Payment
                  </p>

                </div>

                <div className="w-16" />

              </div>

            </div>

            <div className="mx-auto max-w-3xl px-4 py-8">

              <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

                {/* Checkout form */}
                <div>

                  <div className="mb-6">

                    <h1 className="text-2xl font-bold">
                      Delivery Details
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Enter your details so KFM can prepare
                      and arrange delivery of your market order.
                    </p>

                  </div>

                  <form
                    onSubmit={submitCheckout}
                    className="space-y-5"
                  >

                    <div>

                      <label
                        htmlFor="fullName"
                        className="mb-2 block text-sm font-medium"
                      >
                        Full Name
                      </label>

                      <div className="relative">

                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                          id="fullName"
                          type="text"
                          value={
                            checkoutDetails.fullName
                          }
                          onChange={(event) =>
                            updateCheckoutField(
                              "fullName",
                              event.target.value
                            )
                          }
                          placeholder="Your full name"
                          className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          disabled={
                            isProcessingPayment
                          }
                        />

                      </div>

                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">

                      <div>

                        <label
                          htmlFor="phone"
                          className="mb-2 block text-sm font-medium"
                        >
                          Phone Number
                        </label>

                        <div className="relative">

                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <input
                            id="phone"
                            type="tel"
                            value={
                              checkoutDetails.phone
                            }
                            onChange={(event) =>
                              updateCheckoutField(
                                "phone",
                                event.target.value
                              )
                            }
                            placeholder="024 000 0000"
                            className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            disabled={
                              isProcessingPayment
                            }
                          />

                        </div>

                      </div>

                      <div>

                        <label
                          htmlFor="email"
                          className="mb-2 block text-sm font-medium"
                        >
                          Email Address
                        </label>

                        <div className="relative">

                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <input
                            id="email"
                            type="email"
                            value={
                              checkoutDetails.email
                            }
                            onChange={(event) =>
                              updateCheckoutField(
                                "email",
                                event.target.value
                              )
                            }
                            placeholder="you@example.com"
                            className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            disabled={
                              isProcessingPayment
                            }
                          />

                        </div>

                      </div>

                    </div>

                    <div>

                      <label
                        htmlFor="whatsapp"
                        className="mb-2 block text-sm font-medium"
                      >
                        WhatsApp Number{" "}
                        <span className="font-normal text-muted-foreground">
                          (Optional)
                        </span>
                      </label>

                      <input
                        id="whatsapp"
                        type="tel"
                        value={
                          checkoutDetails.whatsapp
                        }
                        onChange={(event) =>
                          updateCheckoutField(
                            "whatsapp",
                            event.target.value
                          )
                        }
                        placeholder="024 000 0000"
                        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        disabled={
                          isProcessingPayment
                        }
                      />

                    </div>

                    {/* Delivery Location */}
                    <div>

                      <label
                        htmlFor="deliveryLocation"
                        className="mb-2 block text-sm font-medium"
                      >
                        Delivery Location
                      </label>

                      <div className="relative">

                        <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <select
                          id="deliveryLocation"
                          value={
                            checkoutDetails.deliveryLocation
                          }
                          onChange={(event) =>
                            updateCheckoutField(
                              "deliveryLocation",
                              event.target.value
                            )
                          }
                          className="h-11 w-full appearance-none rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          disabled={
                            isProcessingPayment
                          }
                        >
                          <option value="">
                            Select your Nsawam location
                          </option>

                          {nsawamLocations.map(
                            (location) => (
                              <option
                                key={location}
                                value={location}
                              >
                                {location}
                              </option>
                            )
                          )}
                        </select>

                      </div>

                      <p className="mt-2 text-xs text-muted-foreground">
                        Delivery within the listed Nsawam
                        Township locations is currently{" "}
                        <span className="font-semibold">
                          GHS 10.00
                        </span>
                        .
                      </p>

                    </div>

                    {/* Delivery Address */}
                    <div>

                      <label
                        htmlFor="address"
                        className="mb-2 block text-sm font-medium"
                      >
                        Delivery Address
                      </label>

                      <div className="relative">

                        <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                        <textarea
                          id="address"
                          value={
                            checkoutDetails.address
                          }
                          onChange={(event) =>
                            updateCheckoutField(
                              "address",
                              event.target.value
                            )
                          }
                          placeholder="Enter your house number, street, landmark or other details"
                          rows={3}
                          className="w-full resize-none rounded-lg border border-border bg-background px-10 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          disabled={
                            isProcessingPayment
                          }
                        />

                      </div>

                    </div>

                    <div>

                      <label
                        htmlFor="instructions"
                        className="mb-2 block text-sm font-medium"
                      >
                        Delivery Instructions{" "}
                        <span className="font-normal text-muted-foreground">
                          (Optional)
                        </span>
                      </label>

                      <textarea
                        id="instructions"
                        value={
                          checkoutDetails.instructions
                        }
                        onChange={(event) =>
                          updateCheckoutField(
                            "instructions",
                            event.target.value
                          )
                        }
                        placeholder="Any additional information for the delivery rider?"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        disabled={
                          isProcessingPayment
                        }
                      />

                    </div>

                    {paymentError && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
                        {paymentError}
                      </div>
                    )}

                    <div className="rounded-xl border border-border bg-muted/40 p-4">

                      <div className="flex items-start gap-3">

                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>

                        <div>

                          <p className="text-sm font-semibold">
                            Secure Paystack Payment
                          </p>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Pay securely with Mobile Money or
                            Card through Paystack. Available Ghana
                            Mobile Money options include MTN,
                            Telecel and AirtelTigo.
                          </p>

                        </div>

                      </div>

                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={
                        isProcessingPayment
                      }
                    >
                      {isProcessingPayment
                        ? "Connecting to Paystack..."
                        : `Pay ${formatCurrency(
                            estimatedTotal
                          )} with Paystack`}
                    </Button>

                    <p className="text-center text-xs leading-5 text-muted-foreground">
                      You will be redirected to Paystack to
                      securely complete your payment.
                    </p>

                  </form>

                </div>

                {/* Summary */}
                <aside className="h-fit rounded-2xl border border-border bg-muted/30 p-5 lg:sticky lg:top-6">

                  <h2 className="font-bold">
                    Order Summary
                  </h2>

                  <div className="mt-5 space-y-4">

                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3"
                      >

                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-14 w-14 rounded-lg object-cover"
                        />

                        <div className="min-w-0 flex-1">

                          <p className="text-sm font-medium">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </p>

                        </div>

                        <span className="text-sm font-semibold">
                          {formatCurrency(
                            item.price *
                              item.quantity
                          )}
                        </span>

                      </div>
                    ))}

                  </div>

                  <div className="mt-5 border-t border-border pt-4">

                    <div className="flex justify-between text-sm">

                      <span className="text-muted-foreground">
                        Subtotal
                      </span>

                      <span>
                        {formatCurrency(cartTotal)}
                      </span>

                    </div>

                    <div className="mt-2 flex justify-between text-sm">

                      <span className="text-muted-foreground">
                        Delivery
                      </span>

                      <span>
                        {checkoutDetails.deliveryLocation
                          ? formatCurrency(
                              deliveryFee
                            )
                          : "Select location"}
                      </span>

                    </div>

                    {checkoutDetails.deliveryLocation && (
                      <div className="mt-2 rounded-lg bg-primary/5 p-3">

                        <div className="flex items-start gap-2">

                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                          <div>

                            <p className="text-xs text-muted-foreground">
                              Delivering to
                            </p>

                            <p className="mt-0.5 text-sm font-semibold">
                              {
                                checkoutDetails.deliveryLocation
                              }
                            </p>

                          </div>

                        </div>

                      </div>
                    )}

                    <div className="mt-4 border-t border-border pt-4">

                      <div className="flex justify-between">

                        <span className="font-bold">
                          Total
                        </span>

                        <span className="text-xl font-bold">
                          {formatCurrency(
                            estimatedTotal
                          )}
                        </span>

                      </div>

                    </div>

                  </div>

                </aside>

              </div>

            </div>

          </div>

        </div>
      )}
    </section>
  )
}
