"use client"

import { useState } from "react"
import { ChevronDown, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const marketplaceLinks = [
  { label: "NSAWAM MARKET", href: "/market" },
  { label: "BOOKS & PUBLICATIONS", href: "/books" },
  { label: "FIND A MECHANIC", href: "/find-a-mechanic" },
]

function MarketplaceDropdown() {
  return (
    <details className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-xs font-extrabold uppercase tracking-[0.1em] text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        MARKETPLACE
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 min-w-56 rounded-xl border border-border bg-background p-2 shadow-xl">
        {marketplaceLinks.map((link) => (
          <a key={link.href} href={link.href} className="mb-1 block min-h-11 rounded-lg bg-primary px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-primary-foreground transition-colors last:mb-0 hover:bg-primary/90">
            {link.label}
          </a>
        ))}
      </div>
    </details>
  )
}

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeMobileMenu = () => setMobileMenuOpen(false)
  const navLinkClass = "flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-3 text-xs font-extrabold uppercase tracking-[0.1em] text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex min-h-[84px] max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <a href="/" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3" onClick={closeMobileMenu} aria-label="Kingdom Faith Transport and Marketplace home">
          <img
            src="/kfm-brand-logo.webp"
            alt="Kingdom Faith Ghana-coloured car logo"
            width={128}
            height={128}
            className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-yellow-500/60 sm:h-14 sm:w-14"
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-sm font-black uppercase tracking-tight text-foreground sm:text-lg">KINGDOM FAITH</span>
            <span className="text-[11px] font-extrabold uppercase tracking-tight text-primary sm:text-sm">TRANSPORT &amp; MARKETPLACE</span>
            <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.04em] text-foreground sm:text-[10px] sm:tracking-[0.08em]">
              BOOK A RIDE <span className="px-0.5 text-green-700">·</span> SHOP A MARKET
            </span>
          </span>
        </a>
        <nav aria-label="Main navigation" className="hidden items-center gap-3 xl:flex">
          <a href="/" className={navLinkClass}>HOME</a>
          <details className="group relative">
            <summary className={navLinkClass + " cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden"}>
              BOOK A RIDE
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-full z-50 mt-2 min-w-52 rounded-xl border border-border bg-background p-2 shadow-xl">
              <a href="/book-ride" className="mb-1 block min-h-11 rounded-lg bg-primary px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-primary-foreground hover:bg-primary/90">BOOK A RIDE</a>
              <a href="/ride-status" className="block min-h-11 rounded-lg bg-primary px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-primary-foreground hover:bg-primary/90">CHECK YOUR RIDE</a>
            </div>
          </details>
          <a href="/driver-registration" className={navLinkClass}>BECOME A DRIVER</a>
          <a href="/classifieds" className={navLinkClass}>CLASSIFIEDS</a>
          <MarketplaceDropdown />
        </nav>
        <div className="flex shrink-0 items-center xl:hidden">
          <Button variant="default" size="icon" className="h-11 w-11 rounded-lg" aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-site-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div id="mobile-site-navigation" className="border-t border-border bg-background xl:hidden">
          <nav aria-label="Mobile navigation" className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-4 sm:px-6">
            <a href="/" onClick={closeMobileMenu} className={navLinkClass}>HOME</a>
            <details className="group relative">
              <summary className={navLinkClass + " cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden"}>
                BOOK A RIDE
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="col-span-2 mt-2 grid gap-2">
                <a href="/book-ride" onClick={closeMobileMenu} className={navLinkClass}>BOOK A RIDE</a>
                <a href="/ride-status" onClick={closeMobileMenu} className={navLinkClass}>CHECK YOUR RIDE</a>
              </div>
            </details>
            <a href="/driver-registration" onClick={closeMobileMenu} className={navLinkClass}>BECOME A DRIVER</a>
            <a href="/classifieds" onClick={closeMobileMenu} className={navLinkClass}>CLASSIFIEDS</a>
            <details className="group relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-center text-xs font-extrabold uppercase tracking-[0.08em] text-primary-foreground shadow-sm [&::-webkit-details-marker]:hidden">
                MARKETPLACE
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="col-span-2 mt-2 grid gap-2">
                {marketplaceLinks.map((link) => <a key={link.href} href={link.href} onClick={closeMobileMenu} className="flex min-h-11 items-center justify-center rounded-lg bg-primary px-3 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-primary-foreground hover:bg-primary/90">{link.label}</a>)}
              </div>
            </details>
          </nav>
        </div>
      )}
    </header>
  )
}
