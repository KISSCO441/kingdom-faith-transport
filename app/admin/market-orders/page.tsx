"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  User,
} from "lucide-react"

type MarketOrder = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  delivery_location: string
  product_subtotal: number
  delivery_fee: number
  total_amount: number
  payment_status: string
  order_status: string
  payment_reference: string | null
  customer_received: boolean
  customer_problem_reported: boolean
  created_at: string
  updated_at: string
}

type MarketOrderItem = {
  id: string
  order_id: string
  product_name: string
  category: string
  quantity: number
  unit_amount: number
  line_total: number
  created_at: string
}

export default function MarketOrdersPage() {
  const [orders, setOrders] = useState<MarketOrder[]>([])
  const [items, setItems] = useState<MarketOrderItem[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  async function loadOrders(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError("")

      const response = await fetch("/api/admin/market-orders", {
        method: "GET",
        cache: "no-store",
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load market orders.")
      }

      setOrders(data.orders ?? [])
      setItems(data.items ?? [])

      setSelectedOrderId((current) => {
        if (current && data.orders?.some((order: MarketOrder) => order.id === current)) {
          return current
        }

        return data.orders?.[0]?.id ?? null
      })
    } catch (err) {
      console.error("Market orders dashboard error:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load market orders.",
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  )

  const selectedItems = useMemo(
    () =>
      selectedOrder
        ? items.filter((item) => item.order_id === selectedOrder.id)
        : [],
    [items, selectedOrder],
  )

  const newOrders = orders.filter(
    (order) => order.order_status?.toUpperCase() === "NEW",
  ).length

  const pendingPayments = orders.filter(
    (order) => order.payment_status?.toUpperCase() === "PENDING",
  ).length

  const completedOrders = orders.filter((order) =>
    ["COMPLETED", "DELIVERED"].includes(
      order.order_status?.toUpperCase(),
    ),
  ).length

  function formatCurrency(amount: number) {
    return `GH₵${Number(amount || 0).toFixed(2)}`
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-GH", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  function statusClass(status: string) {
    const normalized = status?.toUpperCase()

    if (normalized === "NEW") {
      return "bg-blue-100 text-blue-700"
    }

    if (
      normalized === "COMPLETED" ||
      normalized === "DELIVERED"
    ) {
      return "bg-green-100 text-green-700"
    }

    if (
      normalized === "CANCELLED" ||
      normalized === "FAILED"
    ) {
      return "bg-red-100 text-red-700"
    }

    return "bg-amber-100 text-amber-700"
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-slate-500" />
            <p className="text-slate-600">
              Loading KFM Market Orders...
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium uppercase tracking-wider text-amber-400">
              KFM Administration
            </p>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Market Orders
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              View and monitor customer orders from KFM Nsawam Market.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            {refreshing ? "Refreshing..." : "Refresh Orders"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Unable to load market orders
              </p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Orders
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {orders.length}
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-3">
                <ShoppingBag className="h-6 w-6 text-slate-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  New Orders
                </p>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {newOrders}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Payment
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {pendingPayments}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3">
                <Clock3 className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Completed
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {completedOrders}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Orders List */}
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-bold text-slate-900">
                Market Orders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select an order to view details.
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">
                  No market orders yet.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  New customer orders will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const selected = order.id === selectedOrderId

                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`w-full p-5 text-left transition ${
                        selected
                          ? "bg-slate-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">
                            {order.order_number}
                          </p>

                          <p className="mt-1 truncate text-sm text-slate-600">
                            {order.customer_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(order.created_at)}
                          </p>
                        </div>

                        <p className="shrink-0 font-bold text-slate-900">
                          {formatCurrency(order.total_amount)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                            order.order_status,
                          )}`}
                        >
                          {order.order_status}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                            order.payment_status,
                          )}`}
                        >
                          {order.payment_status}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Order Details */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {!selectedOrder ? (
              <div className="flex min-h-[500px] items-center justify-center text-center">
                <div>
                  <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4 font-semibold text-slate-700">
                    Select an order
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Order details will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Order Header */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Market Order
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-slate-900">
                      {selectedOrder.order_number}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Placed {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(
                        selectedOrder.order_status,
                      )}`}
                    >
                      ORDER: {selectedOrder.order_status}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(
                        selectedOrder.payment_status,
                      )}`}
                    >
                      PAYMENT: {selectedOrder.payment_status}
                    </span>
                  </div>
                </div>

                {/* Customer / Delivery */}
                <div className="grid gap-4 py-6 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-slate-600" />
                      <h3 className="font-bold text-slate-900">
                        Customer Information
                      </h3>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-slate-500">Name</p>
                        <p className="font-semibold text-slate-900">
                          {selectedOrder.customer_name}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">Phone</p>
                        <a
                          href={`tel:${selectedOrder.customer_phone}`}
                          className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {selectedOrder.customer_phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-slate-600" />
                      <h3 className="font-bold text-slate-900">
                        Delivery Information
                      </h3>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-slate-500">
                          Delivery Location
                        </p>
                        <p className="font-semibold text-slate-900">
                          {selectedOrder.delivery_location}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Customer Received
                        </p>
                        <p className="font-semibold text-slate-900">
                          {selectedOrder.customer_received
                            ? "Yes"
                            : "No"}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Problem Reported
                        </p>
                        <p
                          className={`font-semibold ${
                            selectedOrder.customer_problem_reported
                              ? "text-red-600"
                              : "text-slate-900"
                          }`}
                        >
                          {selectedOrder.customer_problem_reported
                            ? "Yes"
                            : "No"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-slate-200 pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-slate-600" />
                    <h3 className="font-bold text-slate-900">
                      Order Items
                    </h3>
                  </div>

                  {selectedItems.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                      No items found for this order.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                              Product
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-600">
                              Category
                            </th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-600">
                              Qty
                            </th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-600">
                              Unit
                            </th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-600">
                              Total
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {selectedItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {item.product_name}
                              </td>

                              <td className="px-4 py-4 text-slate-600">
                                {item.category}
                              </td>

                              <td className="px-4 py-4 text-right text-slate-700">
                                {item.quantity}
                              </td>

                              <td className="px-4 py-4 text-right text-slate-700">
                                {formatCurrency(item.unit_amount)}
                              </td>

                              <td className="px-4 py-4 text-right font-semibold text-slate-900">
                                {formatCurrency(item.line_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="mt-6 flex justify-end">
                  <div className="w-full max-w-md space-y-3 rounded-xl bg-slate-50 p-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        Product Subtotal
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(
                          selectedOrder.product_subtotal,
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        Delivery Fee
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(
                          selectedOrder.delivery_fee,
                        )}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-slate-900">
                          Total
                        </span>

                        <span className="text-xl font-bold text-slate-900">
                          {formatCurrency(
                            selectedOrder.total_amount,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Reference */}
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="font-bold text-slate-900">
                    Payment Information
                  </h3>

                  <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm">
                    <p className="text-slate-500">
                      Payment Reference
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedOrder.payment_reference ||
                        "No payment reference yet"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
