
"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Mail,
  RefreshCw,
  CreditCard,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

type Order = {
  id: string
  order_number: string
  total_amount: number | string
  payment_status: string
  order_status: string
  created_at?: string
}

export default function MyOrdersPage() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"email" | "verify" | "orders">("email")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function requestCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/my-orders/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Unable to request a verification code.")
      }

      setStep("verify")
      setMessage(
        data.message ||
          "If orders are associated with this email, verification instructions will be sent."
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/my-orders/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed. Please try again.")
      }

      setOrders(Array.isArray(data.orders) ? data.orders : [])
      setStep("orders")
      setMessage("")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify your email. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  async function payNow(orderId: string) {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/my-orders/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      const data = await response.json()

      if (!response.ok || !data.paymentUrl) {
        throw new Error(data.error || "Unable to continue payment.")
      }

      window.location.assign(data.paymentUrl)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to continue payment. Please try again."
      )
      setLoading(false)
    }
  }

  function startAgain() {
    setStep("email")
    setCode("")
    setOrders([])
    setMessage("")
    setError("")
  }

  function formatAmount(amount: number | string) {
    const value = Number(amount)
    return `GH₵${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`
  }

  function formatDate(date?: string) {
    if (!date) return "Date unavailable"

    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime())
      ? "Date unavailable"
      : parsed.toLocaleDateString("en-GH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
  }

  return (
    <main className="min-h-screen bg-orange-50/50 text-gray-900">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-700"
          >
            <ArrowLeft size={18} />
            Back to Marketplace
          </Link>

          <div className="flex items-center gap-2 font-bold text-orange-700">
            <ShoppingBag size={22} />
            KFM Marketplace
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-700">
            <Package size={30} />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            My Orders
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            View your purchases, check payment status, and continue payment
            for an unpaid order.
          </p>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-8">
          {step !== "orders" && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <ShieldCheck
                className="mt-0.5 shrink-0 text-green-700"
                size={23}
              />
              <div>
                <h2 className="font-semibold">Your orders stay private</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Verify the email address used at checkout before viewing
                  order details. You do not need to create a password.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle className="shrink-0" size={19} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
            >
              {message}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={requestCode} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email used when placing your order
                </label>

                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={19}
                  />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={254}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={19} />
                ) : (
                  <Mail size={19} />
                )}
                {loading ? "Please wait..." : "Send Verification Code"}
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={verifyCode} className="space-y-5">
              <div>
                <p className="mb-1 text-sm text-gray-600">
                  Verification email address
                </p>
                <p className="break-all font-semibold">{email}</p>
              </div>

              <div>
                <label
                  htmlFor="code"
                  className="mb-2 block text-sm font-semibold"
                >
                  Verification code
                </label>

                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  required
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl tracking-[0.4em] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <RefreshCw className="animate-spin" size={19} />
                )}
                Verify and View Orders
              </button>

              <button
                type="button"
                onClick={startAgain}
                className="w-full text-sm font-medium text-gray-600 hover:text-orange-700"
              >
                Use a different email address
              </button>
            </form>
          )}

          {step === "orders" && (
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Your order history</h2>
                  <p className="mt-1 break-all text-sm text-gray-600">
                    Verified email: {email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startAgain}
                  className="text-sm font-semibold text-orange-700 hover:underline"
                >
                  Sign out
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="rounded-xl bg-gray-50 px-4 py-10 text-center">
                  <ShoppingBag
                    className="mx-auto mb-3 text-gray-400"
                    size={34}
                  />
                  <h3 className="font-bold">No orders found</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    No orders were returned for this verified email address.
                  </p>
                  <Link
                    href="/"
                    className="mt-5 inline-flex rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700"
                  >
                    Shop the Marketplace
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const paid =
                      order.payment_status?.toUpperCase() === "PAID"

                    return (
                      <article
                        key={order.id}
                        className="rounded-xl border border-gray-200 p-4 sm:p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">{order.order_number}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                              <Clock size={15} />
                              {formatDate(order.created_at)}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              paid
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {paid ? "PAID" : order.payment_status}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Order status: {order.order_status}
                            </p>
                            <p className="mt-1 text-lg font-extrabold">
                              {formatAmount(order.total_amount)}
                            </p>
                          </div>

                          {!paid ? (
                            <button
                              type="button"
                              onClick={() => payNow(order.id)}
                              disabled={loading}
                              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                            >
                              <CreditCard size={18} />
                              Pay Now
                            </button>
                          ) : (
                            <span className="flex items-center gap-2 text-sm font-semibold text-green-700">
                              <CheckCircle2 size={18} />
                              Payment confirmed
                            </span>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm leading-6 text-gray-500">
          Need help with an order? Contact KFM Marketplace customer support.
        </p>
      </section>
    </main>
  )
}
