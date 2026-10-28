import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Car, Search } from "lucide-react"
import { BookingForm } from "@/components/booking-form"

export const metadata: Metadata = {
  title: "Book a Ride | KFM Transport",
  description:
    "Request a KFM car or Okada ride in Nsawam and across supported areas of Ghana.",
}

export default function BookRidePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">Back to KFM Transport</span>
          </Link>

          <Link
            href="/ride-status"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
          >
            <Search className="h-4 w-4" />
            Track ride
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-4 pt-8 sm:px-6 sm:pt-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Car className="h-6 w-6" />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            KFM Transport
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Book your ride
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Choose a car or Okada, enter your pickup and destination, and submit
            your request. Keep your KFM booking number to check your ride status.
          </p>
        </div>
      </section>

      <BookingForm />

      <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">
        <p>Kingdom Faith Marketplace Transport · Nsawam, Eastern Region, Ghana</p>
        <p className="mt-2">
          Need help?{" "}
          <a className="font-medium text-foreground underline underline-offset-4" href="tel:+233240555688">
            Call or WhatsApp 0240 555 688
          </a>
        </p>
      </footer>
    </main>
  )
}
