"use client"

import { useState } from "react"
import { Car, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Ride", href: "#rides" },
  { label: "Track Ride", href: "/ride-status" },
  { label: "KFM Market", href: "#nsawam-market" },
  { label: "Become a Driver", href: "/driver-registration" },
  { label: "About", href: "#features" },
  { label: "Driver Portal", href: "/driver-dashboard" },
  { label: "Contact", href: "#contact" },
]

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* KFM Brand */}
        <a
          href="#"
          className="flex shrink-0 items-center gap-2"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Car className="h-5 w-5" />
          </span>

          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight sm:text-base">
              Kingdom Faith Marketplace
            </span>

            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              Transport App · Eastern Region
            </span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Book a Ride */}
        <div className="hidden items-center lg:flex">
          <Button asChild size="sm" className="font-semibold">
            <a href="#book">BOOK A RIDE</a>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button asChild size="sm" className="hidden font-semibold sm:flex">
            <a href="#book">BOOK A RIDE</a>
          </Button>

          <Button
            variant="outline"
            size="icon"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-border/60 py-3 text-sm font-medium text-muted-foreground transition-colors last:border-b-0 hover:text-primary"
              >
                {link.label}
              </a>
            ))}

            <Button asChild className="mt-3 w-full font-semibold">
              <a
                href="#book"
                onClick={() => setMobileMenuOpen(false)}
              >
                BOOK A RIDE
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
