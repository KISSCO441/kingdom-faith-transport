"use client"

import { useState } from "react"
import { Car, ChevronDown, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const transportLinks = [
  { label: "Book a Ride", href: "/#rides" },
  { label: "Track a Ride", href: "/ride-status" },
  { label: "Become a Driver", href: "/driver-registration" },
  { label: "Driver Portal", href: "/driver-dashboard" },
]

const marketplaceLinks = [
  { label: "KFM Market", href: "/market" },
  { label: "Classifieds", href: "/classifieds" },
]

function DropdownLinks({
  label,
  links,
}: {
  label: string
  links: { label: string; href: string }[]
}) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-foreground/75 transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 top-full z-50 mt-2 min-w-52 rounded-xl border border-border bg-background p-2 shadow-xl">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-primary"
          >
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

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-3"
          onClick={closeMobileMenu}
          aria-label="Kingdom Faith Marketplace home"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Car className="h-6 w-6" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-extrabold tracking-tight text-foreground sm:text-base">
              Kingdom Faith
            </span>
            <span className="truncate text-sm font-bold tracking-tight text-primary sm:text-base">
              Marketplace
            </span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground sm:text-[10px]">
              Transport &amp; Shopping · Eastern Region, Ghana
            </span>
          </span>
        </a>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 xl:flex">
          <a
            href="/"
            className="rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-foreground/75 transition-colors hover:bg-muted hover:text-primary"
          >
            Home
          </a>
          <DropdownLinks label="Transport" links={transportLinks} />
          <DropdownLinks label="Marketplace" links={marketplaceLinks} />
        </nav>

        <div className="hidden shrink-0 xl:block">
          <Button asChild className="h-11 rounded-lg px-5 text-xs font-extrabold tracking-wide shadow-sm">
            <a href="/#book">BOOK A RIDE</a>
          </Button>
        </div>

        <div className="flex shrink-0 items-center gap-2 xl:hidden">
          <Button asChild size="sm" className="hidden rounded-lg font-bold sm:inline-flex">
            <a href="/#book">BOOK A RIDE</a>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-lg"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-site-navigation" className="border-t border-border bg-background xl:hidden">
          <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            <a
              href="/"
              onClick={closeMobileMenu}
              className="rounded-lg px-3 py-3 text-sm font-bold text-foreground hover:bg-muted"
            >
              Home
            </a>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
                Transport
              </p>
              {transportLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-2 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-background hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
                Marketplace
              </p>
              {marketplaceLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="block rounded-lg px-2 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-background hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <Button asChild className="mt-2 h-11 w-full rounded-lg font-extrabold tracking-wide">
              <a href="/#book" onClick={closeMobileMenu}>
                BOOK A RIDE
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
