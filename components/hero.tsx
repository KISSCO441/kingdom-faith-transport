"use client"

import { useEffect, useState } from "react"
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const slides = [
  {
    id: "rides",
    label: "KFM Rides",
    title: "Move around the Eastern Region with confidence.",
    description:
      "Book reliable car and okada rides across Koforidua, Nkawkaw, Nsawam and beyond.",
    image:
      "https://images.pexels.com/photos/31064777/pexels-photo-31064777.png?cs=srgb&dl=pexels-zeal-creative-studios-58866141-31064777.jpg&fm=jpg",
    alt: "Ghanaian taxi driver inside a blue taxi",
  },
  {
    id: "okada",
    label: "Okada Rides",
    title: "Fast local transport when you need it.",
    description:
      "Get convenient motorcycle transportation for short trips, errands and everyday movement.",
    image:
      "https://images.pexels.com/photos/36482485/pexels-photo-36482485.jpeg?cs=srgb&dl=pexels-eons-36482485.jpg&fm=jpg",
    alt: "Motorcycle rider in Accra Ghana",
  },
  {
    id: "market",
    label: "Nsawam Market",
    title: "Shop local. We bring it to you.",
    description:
      "Order fresh produce, groceries and everyday essentials from Nsawam Market.",
    image:
      "https://images.pexels.com/photos/36537192/pexels-photo-36537192.jpeg?cs=srgb&dl=pexels-reagan-agyei-mensah-2160161940-36537192.jpg&fm=jpg",
    alt: "Busy outdoor market in Ghana",
  },
  {
    id: "delivery",
    label: "Market Delivery",
    title: "Your market order, delivered to your door.",
    description:
      "KFM prepares your order and connects it with a local delivery rider.",
    image:
      "https://images.pexels.com/photos/6869064/pexels-photo-6869064.jpeg?cs=srgb&dl=pexels-kindelmedia-6869064.jpg&fm=jpg",
    alt: "Motorcycle delivery rider carrying a parcel",
  },
  {
    id: "payment",
    label: "Mobile Money",
    title: "Pay conveniently with Mobile Money.",
    description:
      "A simple payment experience designed for customers in Ghana.",
    image:
      "https://images.pexels.com/photos/12935039/pexels-photo-12935039.jpeg?cs=srgb&dl=pexels-imin-technology-276315592-12935039.jpg&fm=jpg",
    alt: "Customer making a digital payment with a smartphone",
  },
]

const stats = [
  { value: "50k+", label: "Rides completed" },
  { value: "4.9/5", label: "Rider rating" },
  { value: "12", label: "Towns covered" },
]

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
    <section className="relative min-h-[680px] overflow-hidden">
      {/* Real photograph */}
      <div className="absolute inset-0 bg-green-950">
        <img
          key={activeSlide.image}
          src={activeSlide.image}
          alt={activeSlide.alt}
          className="h-full w-full object-cover object-center transition-opacity duration-700"
          referrerPolicy="no-referrer"
        />

        {/* Dark overlay for readable text */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/20" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
      </div>

      {/* Main content */}
      <div className="relative mx-auto flex min-h-[680px] max-w-6xl items-center px-4 py-24 md:py-32">
        <div className="max-w-2xl text-white">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
            <span className="flex h-1.5 w-1.5 rounded-full bg-green-400" />

            {activeSlide.label} · Eastern Region, Ghana
          </div>

          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            {activeSlide.title}
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-lg leading-8 text-white/85">
            {activeSlide.description}
          </p>

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
              <Smartphone className="h-4 w-4 text-yellow-300" />
              Mobile Money
            </span>
          </div>

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
        className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Next */}
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next banner"
        className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
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
      <div className="absolute bottom-6 right-6 z-20 hidden rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-medium text-white backdrop-blur-md sm:block">
        {currentSlide + 1} / {slides.length}
      </div>
    </section>
  )
}
