"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBasket, Truck, ShieldCheck, Clock3, MessageCircle } from "lucide-react"

export function NsawamMarketBanner() {
  return (
    <section id="nsawam-market" className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-lg">
          <div className="grid items-stretch lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-center p-6 sm:p-9 md:p-12">
              <div className="flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-4 text-primary-foreground shadow-md sm:px-6">
                <ShoppingBasket className="h-8 w-8 shrink-0 sm:h-10 sm:w-10" aria-hidden="true" />
                <span className="text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl md:text-4xl">
                  NSAWAM MARKET
                </span>
              </div>

              <h2 className="mt-6 max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Fresh from the market.
                <span className="mt-2 block text-primary">Delivered to you.</span>
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Shop selected fresh market essentials from Nsawam and have your order delivered to your home.
                Choose a category and let KFM make your market shopping easier.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/market"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-orange-600 bg-orange-500 px-6 text-sm font-extrabold text-white shadow transition-colors hover:border-orange-700 hover:bg-orange-600"
                >
                  SHOP THE MARKET
                </Link>
                <Link
                  href="/market#market-basket"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-orange-600 bg-orange-500 px-6 text-sm font-extrabold text-white shadow transition-colors hover:border-orange-700 hover:bg-orange-600"
                >
                  <ShoppingBasket className="mr-2 h-5 w-5" aria-hidden="true" />
                  VIEW YOUR BASKET
                </Link>
                <a
                  href={`https://wa.me/233240555688?text=${encodeURIComponent([
                    "Hello KFM, I want to place a LIVE MARKET ORDER ORDER.",
                    "",
                    "Please check availability and current prices for these items:",
                    "1. Item and quantity:",
                    "2. Item and quantity:",
                    "3. Item and quantity:",
                    "",
                    "Please send me the itemized order and delivery fee for confirmation before payment.",
                    "",
                    "Customer name:",
                    "Delivery location:",
                    "Contact number:",
                  ].join("\\n"))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-orange-600 bg-orange-500 px-5 text-sm font-extrabold text-white shadow transition-colors hover:border-orange-700 hover:bg-orange-600"
                >
                  <MessageCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                  LIVE MARKET
                </a>
              </div>

              <div className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-bold">Nsawam Delivery</p>
                    <p className="text-xs text-muted-foreground">Convenient delivery</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-bold">Easy Ordering</p>
                    <p className="text-xs text-muted-foreground">Simple shopping</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-bold">Shop from Home</p>
                    <p className="text-xs text-muted-foreground">At your convenience</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-[500px]">
              <Image
                src="/images/vegetables.jpg"
                alt="Fresh market vegetables at KFM Nsawam Market"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="rounded-2xl border border-white/20 bg-black/35 p-5 backdrop-blur-sm">
                  <p className="text-xl font-extrabold text-white sm:text-2xl">Fresh market essentials</p>
                  <p className="mt-2 text-sm text-white/85 sm:text-base">Vegetables • Fruits • Staples • Protein</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
