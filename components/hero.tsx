"use client"

import { useEffect, useState } from "react"
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const slides = [
  {
    image: "/images/ride-hero.png",
    alt: "Kingdom Faith taxi ride in Ghana",
    label: "KFM Rides",
  },
  {
    image: "/images/okada-hero.png",
    alt: "Kingdom Faith okada ride in Ghana",
    label: "Okada Rides",
  },
  {
    image: "/images/market-hero.png",
    alt: "Fresh products from Nsawam Market",
    label: "Nsawam Market",
  },
  {
    image: "/images/delivery-hero.png",
    alt: "Kingdom Faith market delivery by okada",
    label: "Market Delivery",
  },
  {
    image: "/images/payment-hero.png",
    alt: "Mobile money payment for Kingdom Faith services",
    label: "Mobile Money",
  },
]

const stats = [
  { value: "50k+", label: "Rides completed" },
  { value: "4.9/5", label: "Rider rating" },
  { value: "12", label: "Towns covered" },
]

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % slides.length)
      setImageFailed(false)
    }, 6000)

    return () => window.clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((current) => (current + 1) % slides.length)
    setImageFailed(false)
  }

  const previousSlide = () => {
    setCurrentSlide(
      (current) => (current - 1 + slides.length) % slides.length
    )
    setImageFailed(false)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setImageFailed(false)
  }

  const activeSlide = slides[currentSlide]

  return (
    <section className="relative min-h-[680px] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-green-800 to-emerald-600">
        {!imageFailed && (
          <img
            key={activeSlide.image}
            src={activeSlide.image}
            alt={activeSlide.alt}
            className="h-full w-full object-cover transition-opacity duration-700"
            onError={() => setImageFailed(true)}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />

        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-yellow-400/20 blur-3xl" />

        <div className="absolute -bottom-32 right-20 h-96 w-96 rounded-full bg-green-300/20 blur-3xl" />
      </div>

      {/* Hero Content */}
      <div className="relative mx-auto flex min-h-[680px] max-w-6xl items-center px-4 py-24 md:py-32">
        <div className="max-w-2xl text-white">
          {/* Current Service */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <span className="flex h-1.5 w-1.5 rounded-full bg-green-400" />

            {activeSlide.label} · Eastern Region, Ghana
          </div>

          {/* Main Heading */}
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Order a{" "}
            <span className="text-green-300">ride</span> anywhere in the{" "}
            <span className="text-yellow-300">Eastern Region</span>
          </h1>

          {/* Description */}
          <p className="mt-5 max-w-xl text-pretty text-lg leading-8 text-white/80">
            Book cars and okada rides in minutes across Koforidua,
            Nkawkaw, Nsawam and beyond. Fair fares, trusted local
            drivers, market delivery and convenient mobile money
            payments.
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
              <a href="#rides">
                <Car className="h-4 w-4" />
                See Fares
              </a>
            </Button>
          </div>

          {/* Benefits */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-300" />
              Verified drivers
            </span>

            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-300" />
              Pickup in minutes
            </span>
          </div>

          {/* Statistics */}
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

      {/* Previous Button */}
      <button
        type="button"
        onClick={previousSlide}
        aria-label="Previous banner"
        className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Next Button */}
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next banner"
        className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.label}
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

      {/* Slide Counter */}
      <div className="absolute bottom-6 right-6 z-10 hidden rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-medium text-white backdrop-blur sm:block">
        {currentSlide + 1} / {slides.length}
      </div>
    </section>
  )
}
