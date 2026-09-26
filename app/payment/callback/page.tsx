"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type PaymentState = "verifying" | "success" | "failed"

export default function PaymentCallbackPage() {
  const [paymentState, setPaymentState] =
    useState<PaymentState>("verifying")
  const [message, setMessage] = useState(
    "Please wait while we confirm your payment."
  )
  const [reference, setReference] = useState("")

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const paymentReference = params.get("reference")

        if (!paymentReference) {
          setPaymentState("failed")
          setMessage("No payment reference was found.")
          return
        }

        setReference(paymentReference)

        const response = await fetch(
          `/api/paystack/verify?reference=${encodeURIComponent(
            paymentReference
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        )

        const data = await response.json()

        if (!response.ok || !data.status) {
          setPaymentState("failed")
          setMessage(
            data?.message ||
              "We could not confirm your payment. Please contact KFM if money was deducted."
          )
          return
        }

        setPaymentState("success")
        setMessage("Your payment has been confirmed successfully.")

        const pendingOrder = sessionStorage.getItem("kfm_pending_order")

        if (pendingOrder) {
          try {
            const order = JSON.parse(pendingOrder)

            sessionStorage.setItem(
              "kfm_completed_order",
              JSON.stringify({
                ...order,
                paymentStatus: "PAID",
                paymentReference,
                paymentChannel: data.data?.channel || "",
                paidAt: data.data?.paidAt || "",
              })
            )

            sessionStorage.removeItem("kfm_pending_order")
          } catch (storageError) {
            console.error(
              "Unable to save completed order:",
              storageError
            )
          }
        }
      } catch (error) {
        console.error("Payment verification error:", error)

        setPaymentState("failed")
        setMessage(
          "We could not confirm the payment at this time. Please contact KFM before making another payment."
        )
      }
    }

    verifyPayment()
  }, [])

  const continueToMarket = () => {
    window.location.href = "/#nsawam-market"
  }

  const contactKfm = () => {
    const text = reference
      ? `Hello KFM, I completed a payment and need help confirming my order. Paystack reference: ${reference}`
      : "Hello KFM, I completed a payment and need help confirming my order."

    window.open(
      `https://wa.me/233240555688?text=${encodeURIComponent(text)}`,
      "_blank"
    )
  }

  if (paymentState === "verifying") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>

          <h1 className="text-2xl font-bold">
            Confirming Your Payment
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {message}
          </p>

          <p className="mt-6 text-xs text-muted-foreground">
            Please do not close this page.
          </p>
        </div>
      </main>
    )
  }

  if (paymentState === "success") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold">
            Payment Successful
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {message}
          </p>

          {reference && (
            <div className="mt-6 rounded-lg bg-muted p-4 text-left">
              <p className="text-xs font-medium text-muted-foreground">
                Payment Reference
              </p>

              <p className="mt-1 break-all text-sm font-semibold">
                {reference}
              </p>
            </div>
          )}

          <div className="mt-6 rounded-lg border border-border p-4 text-left">
            <p className="text-sm font-semibold">
              What happens next?
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              KFM can now prepare your market order for delivery.
              Keep your payment reference for your records.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={continueToMarket}>
              Continue Shopping
            </Button>

            <Button variant="outline" onClick={contactKfm}>
              Contact KFM on WhatsApp
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-9 w-9 text-destructive" />
        </div>

        <h1 className="text-2xl font-bold">
          Payment Not Confirmed
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {message}
        </p>

        {reference && (
          <div className="mt-6 rounded-lg bg-muted p-4 text-left">
            <p className="text-xs font-medium text-muted-foreground">
              Payment Reference
            </p>

            <p className="mt-1 break-all text-sm font-semibold">
              {reference}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={continueToMarket}>
            Return to Market
          </Button>

          <Button variant="outline" onClick={contactKfm}>
            Contact KFM on WhatsApp
          </Button>
        </div>
      </div>
    </main>
  )
}
