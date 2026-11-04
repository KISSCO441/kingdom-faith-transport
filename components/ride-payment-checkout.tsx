"use client";

import { useEffect, useState } from "react";

type PaymentDetails = {
  booking_code: string;
  amount: number;
  currency: string;
  paid: boolean;
};

export function RidePaymentCheckout({ token }: { token: string }) {
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const params = new URLSearchParams(window.location.search);
        const reference = params.get("reference");
        if (reference) {
          setProcessing(true);
          const verify = await fetch("/api/ride-payment/verify/" + token, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
            cache: "no-store",
          });
          const result = await verify.json();
          if (!verify.ok || !result.success) throw new Error(result.error || "Payment verification is pending.");
          if (!cancelled) {
            setSuccess(true);
            setPayment((current) => current ? { ...current, paid: true } : current);
            window.history.replaceState({}, "", window.location.pathname);
          }
        }

        const response = await fetch("/api/ride-payment/" + token, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load this payment link.");
        if (!cancelled) {
          setPayment({
            booking_code: data.booking_code,
            amount: Number(data.amount || 0),
            currency: data.currency || "GHS",
            paid: Boolean(data.paid) || success,
          });
          if (data.paid) setSuccess(true);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load payment.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setProcessing(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  async function payNow() {
    try {
      setProcessing(true);
      setError("");
      const response = await fetch("/api/ride-payment/" + token, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.authorization_url) throw new Error(data.error || "Unable to start Paystack checkout.");
      window.location.assign(data.authorization_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment.");
      setProcessing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-lg rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">KFM Transport</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Ride payment</h1>
        <p className="mt-2 text-sm text-slate-600">Secure payment for your completed KFM ride.</p>

        {loading || processing ? (
          <div className="mt-8 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-600">
            {processing ? "Confirming your payment with Paystack..." : "Loading your payment details..."}
          </div>
        ) : null}

        {error ? <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        {payment ? (
          <div className="mt-7 space-y-5">
            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-xs font-medium uppercase text-slate-500">Booking number</p>
              <p className="mt-1 font-semibold text-slate-900">{payment.booking_code}</p>
              <p className="mt-5 text-xs font-medium uppercase text-slate-500">Amount due</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {payment.currency} {payment.amount.toFixed(2)}
              </p>
            </div>

            {success || payment.paid ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                <p className="font-semibold text-green-800">Payment confirmed</p>
                <p className="mt-1 text-sm text-green-700">KFM has verified your payment. Thank you for riding with us.</p>
              </div>
            ) : (
              <>
                <p className="text-xs leading-5 text-slate-500">Payments are processed securely by Paystack. KFM will only mark this ride as paid after server-side verification.</p>
                <button
                  type="button"
                  onClick={payNow}
                  disabled={processing}
                  className="w-full rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processing ? "Please wait..." : "Pay securely with Paystack"}
                </button>
              </>
            )}
          </div>
        ) : null}
        <p className="mt-8 text-center text-xs text-slate-400">If you need help, contact KFM Transport and quote your booking number.</p>
      </div>
    </main>
  );
}
