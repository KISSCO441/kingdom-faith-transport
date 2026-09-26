"use client"

import { useEffect, useState } from "react"
import {
  ArrowRight,
  Bike,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MapPinned,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Store,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const slides = [
  {
    id: "rides",
    label: "KFM Rides",
    title: "Move around the Eastern Region with confidence.",
    description:
      "Book reliable car and okada rides across Koforidua, Nkawkaw, Nsawam and beyond.",
  },
  {
    id: "okada",
    label: "Okada Rides",
    title: "Fast local transport when you need it.",
    description:
      "Get convenient motorcycle transportation for short trips, errands and everyday movement.",
  },
  {
    id: "market",
    label: "Nsawam Market",
    title: "Shop local. We bring it to you.",
    description:
      "Order fresh produce, groceries and everyday essentials from Nsawam Market.",
  },
  {
    id: "delivery",
    label: "Market Delivery",
    title: "Your market order, delivered to your door.",
    description:
      "KFM prepares your order and connects it with a local delivery rider.",
  },
  {
    id: "payment",
    label: "Mobile Money",
    title: "Pay conveniently with Mobile Money.",
    description:
      "A simple payment experience designed for customers in Ghana.",
  },
]

const stats = [
  { value: "50k+", label: "Rides completed" },
  { value: "4.9/5", label: "Rider rating" },
  { value: "12", label: "Towns covered" },
]

function RideVisual() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-green-800 to-green-500" />

      <div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-yellow-300/20 blur-3xl" />

      <div className="absolute bottom-0 left-0 h-40 w-full bg-black/20" />

      <div className="absolute bottom-20 left-0 h-1 w-full rotate-[-4deg] bg-white/20" />

      <div className="absolute bottom-28 right-10 h-2 w-72 rotate-[-4deg] bg-yellow-300/40" />

      <div className="absolute right-16 top-16 h-24 w-24 rounded-full border-4 border-white/10" />

      <div className="absolute right-28 top-28 h-3 w-3 rounded-full bg-yellow-300" />

      <div className="absolute bottom-28 right-24 flex h-32 w-60 items-center justify-center">
        <div className="relative h-16 w-44 rounded-[28px] bg-white shadow-2xl">
          <div className="absolute -left-5 top-6 h-8 w-8 rounded-full bg-white" />

          <div className="absolute -right-5 top-6 h-8 w-8 rounded-full bg-white" />

          <div className="absolute left-8 top-2 h-9 w-20 rounded-t-2xl bg-sky-200/80" />

          <div className="absolute right-8 top-2 h-9 w-16 rounded-t-2xl bg-sky-200/80" />

          <div className="absolute bottom-[-9px] left-7 h-5 w-5 rounded-full bg-slate-900 ring-4 ring-white" />

          <div className="absolute bottom-[-9px] right-7 h-5 w-5 rounded-full bg-slate-900 ring-4 ring-white" />

          <div className="absolute left-1/2 top-1/2 flex h-7 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-green-600 text-[9px] font-black text-white">
            KFM
          </div>
        </div>
      </div>

      <div className="absolute right-12 top-12 rounded-2xl border border-white/20 bg-black/20 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300 text-green-900">
            <Car className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-medium text-white/60">
              Available
            </p>

            <p className="font-bold text-white">
              KFM Ride
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-10 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
        Eastern Region
      </div>
    </div>
  )
}

function OkadaVisual() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-emerald-800 to-yellow-600" />

      <div className="absolute right-0 top-0 h-full w-1/2 bg-yellow-300/10" />

      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-green-300/20 blur-3xl" />

      <div className="absolute bottom-0 h-48 w-full bg-black/25" />

      <div className="absolute bottom-24 left-10 h-1 w-full rotate-[-6deg] bg-white/20" />

      {/* Rider */}
      <div className="absolute bottom-28 right-24">
        <div className="relative">
          {/* Head */}
          <div className="absolute -top-24 left-16 h-12 w-12 rounded-full bg-amber-700" />

          {/* Helmet */}
          <div className="absolute -top-27 left-13 h-10 w-20 rounded-t-full bg-slate-900" />

          {/* Body */}
          <div className="absolute -top-12 left-10 h-20 w-16 rotate-[-12deg] rounded-2xl bg-green-500" />

          {/* Arm */}
          <div className="absolute -top-5 left-2 h-4 w-20 rotate-[-12deg] rounded-full bg-amber-700" />

          {/* Motorcycle */}
          <div className="mt-10 h-8 w-56 rounded-full bg-slate-900" />

          <div className="absolute bottom-[-28px] left-8 h-16 w-16 rounded-full border-[10px] border-slate-900 bg-slate-300" />

          <div className="absolute bottom-[-28px] right-3 h-16 w-16 rounded-full border-[10px] border-slate-900 bg-slate-300" />

          <div className="absolute bottom-1 left-20 h-8 w-24 rotate-[-12deg] rounded-full bg-yellow-400" />
        </div>
      </div>

      <div className="absolute right-12 top-12 rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300 text-green-900">
            <Bike className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs text-white/60">
              Quick transport
            </p>

            <p className="font-bold text-white">
              KFM Okada
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-10 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
        Fast local rides
      </div>
    </div>
  )
}

function MarketVisual() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-green-700 to-lime-500" />

      <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-yellow-300/25 blur-3xl" />

      <div className="absolute bottom-0 left-0 h-48 w-full bg-green-950/40" />

      {/* Market stall */}
      <div className="absolute bottom-20 right-16 w-72">
        <div className="h-7 rounded-xl bg-yellow-400 shadow-lg" />

        <div className="grid grid-cols-4 gap-3 rounded-b-2xl bg-amber-900/80 p-5">
          <div className="flex h-16 items-center justify-center rounded-xl bg-red-500 text-4xl">
            🍅
          </div>

          <div className="flex h-16 items-center justify-center rounded-xl bg-yellow-400 text-4xl">
            🍌
          </div>

          <div className="flex h-16 items-center justify-center rounded-xl bg-green-500 text-4xl">
            🥬
          </div>

          <div className="flex h-16 items-center justify-center rounded-xl bg-orange-400 text-4xl">
            🍊
          </div>
        </div>
      </div>

      {/* Shopping basket */}
      <div className="absolute bottom-12 left-16 flex h-32 w-44 items-center justify-center rounded-b-[45px] border-8 border-amber-800 bg-amber-500/80">
        <div className="text-5xl">
          🛒
        </div>
      </div>

      <div className="absolute right-12 top-12 rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300 text-green-900">
            <ShoppingBasket className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs text-white/60">
              Fresh products
            </p>

            <p className="font-bold text-white">
              Nsawam Market
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-10 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
        Shop local
      </div>
    </div>
  )
}

function DeliveryVisual() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-emerald-800 to-teal-500" />

      <div className="absolute left-0 top-0 h-full w-1/2 bg-white/5" />

      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-yellow-300/20 blur-3xl" />

      {/* Route */}
      <div className="absolute left-10 top-28 h-72 w-72 rounded-full border-4 border-dashed border-yellow-300/60" />

      <div className="absolute left-28 top-40 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-300 text-green-900 shadow-xl">
        <Store className="h-6 w-6" />
      </div>

      <div className="absolute bottom-20 right-20 flex h-14 w-14 items-center justify-center rounded-full bg-white text-green-700 shadow-xl">
        <MapPinned className="h-6 w-6" />
      </div>

      {/* Delivery box */}
      <div className="absolute bottom-28 right-40 flex h-28 w-40 rotate-[-8deg] items-center justify-center rounded-2xl bg-amber-600 shadow-2xl">
        <Package className="h-16 w-16 text-amber-100" />

        <div className="absolute bottom-2 rounded bg-green-700 px-3 py-1 text-[10px] font-black text-white">
          KFM
        </div>
      </div>

      {/* Rider */}
      <div className="absolute bottom-20 right-16">
        <Bike className="h-20 w-20 text-slate-900" />
      </div>

      <div className="absolute right-12 top-12 rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300 text-green-900">
            <Package className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs text-white/60">
              Delivery service
            </p>

            <p className="font-bold text-white">
              Order on the way
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-10 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
        Market → Door
      </div>
    </div>
  )
}

function PaymentVisual() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-green-800 to-emerald-500" />

      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-yellow-300/20 blur-3xl" />

      <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-green-300/20 blur-3xl" />

      {/* Phone */}
      <div className="absolute bottom-16 right-24 h-80 w-44 rotate-[6deg] rounded-[32px] border-8 border-slate-900 bg-white shadow-2xl">
        <div className="absolute left-1/2 top-3 h-2 w-16 -translate-x-1/2 rounded-full bg-slate-800" />

        <div className="absolute inset-x-4 top-16 rounded-2xl bg-green-700 p-4 text-white">
          <p className="text-[10px] text-green-100">
            KFM PAYMENT
          </p>

          <p className="mt-2 text-xl font-black">
            GHS 85.00
          </p>
        </div>

        <div className="absolute inset-x-4 bottom-10 rounded-xl bg-green-100 p-3 text-center">
          <p className="text-xs font-bold text-green-800">
            Payment Ready
          </p>

          <div className="mt-2 flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* Payment card */}
      <div className="absolute left-20 top-28 rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <Wallet className="h-10 w-10 text-yellow-300" />

        <p className="mt-4 text-sm text-white/60">
          Secure checkout
        </p>

        <p className="mt-1 text-xl font-bold text-white">
          Mobile Money
        </p>
      </div>

      <div className="absolute right-12 top-12 rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300 text-green-900">
            <Smartphone className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs text-white/60">
              Easy payment
            </p>

            <p className="font-bold text-white">
              Mobile Money
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-10 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
        Simple · Fast · Convenient
      </div>
    </div>
  )
}

function HeroVisual({ slideId }: { slideId: string }) {
  if (slideId === "okada") {
    return <OkadaVisual />
  }

  if (slideId === "market") {
    return <MarketVisual />
  }

  if (slideId === "delivery") {
    return <DeliveryVisual />
  }

  if (slideId === "payment") {
    return <PaymentVisual />
  }

  return <RideVisual />
}

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % slides.length)
    }, 6000)

    return () => window.clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((current) => (current + 1) % slides.length)
  }

  const previousSlide = () => {
    setCurrentSlide(
      (current) => (current - 1 + slides.length) % slides.length
    )
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const activeSlide = slides[currentSlide]

  return (
    <section className="relative min-h-[680px] overflow-hidden bg-green-950">
      {/* Visual banner */}
      <div className="absolute inset-0">
        <HeroVisual slideId={activeSlide.id} />

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex min-h-[680px] max-w-6xl items-center px-4 py-24 md:py-32">
        <div className="max-w-2xl text-white">
          {/* Label */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <span className="flex h-1.5 w-1.5 rounded-full bg-green-400" />

            {activeSlide.label} · Eastern Region, Ghana
          </div>

          {/* Heading */}
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            {activeSlide.title}
          </h1>

          {/* Description */}
          <p className="mt-5 max-w-xl text-pretty text-lg leading-8 text-white/80">
            {activeSlide.description}
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <a href="#book">
                <MapPin className="h-4 w-4" />
                Order a Ride
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <a href="#nsawam-market">
                <ShoppingBasket className="h-4 w-4" />
                Visit Market
              </a>
            </Button>
          </div>

          {/* Benefits */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-300" />
              Trusted local service
            </span>

            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-300" />
              Convenient service
            </span>

            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              One KFM platform
            </span>
          </div>

          {/* Stats */}
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-2xl font-bold text-white">
                  {stat.value}
                </dt>

                <dd className="mt-1 text-xs text-white/70">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Previous */}
      <button
        type="button"
        onClick={previousSlide}
        aria-label="Previous banner"
        className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Next */}
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next banner"
        className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => goToSlide(index)}
            aria-label={"Show " + slide.label + " banner"}
            className={
              "h-2.5 rounded-full transition-all duration-300 " +
              (index === currentSlide
                ? "w-8 bg-white"
                : "w-2.5 bg-white/50 hover:bg-white/80")
            }
          />
        ))}
      </div>

      {/* Counter */}
      <div className="absolute bottom-6 right-6 z-20 hidden rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-medium text-white backdrop-blur-md sm:block">
        {currentSlide + 1} / {slides.length}
      </div>
    </section>
  )
}
