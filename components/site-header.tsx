"use client"

import { useState } from "react"
import Link from "next/link"
import { Car, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "RIDE OPTIONS", href: "#rides" },
  { label: "TRACK RIDE", href: "/ride-status" },
  { label: "KFM MARKET", href: "#nsawam-market" },
  { label: "BECOME A DRIVER", href: "/driver-registration" },
  { label: "ABOUT", href: "#features" },
  { label: "DRIVER PORTAL", href: "/driver-dashboard" },
  { label: "CONTACT", href: "#contact" },
]

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-2"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="KFM Transport home"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Car className="h-5 w-5" />
          </span>

          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-xs font-bold tracking-tight sm:text-base">
              Kingdom Faith Marketplace
            </span>
            <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              Transport App · Eastern Region
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="whitespace-nowrap text-xs font-bold tracking-wide text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center lg:flex">
          <Button asChild size="sm" className="font-bold tracking-wide">
            <Link href="/book-ride">BOOK A RIDE</Link>
          </Button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
          <Button asChild size="sm" className="px-2.5 text-xs font-bold tracking-wide sm:px-3 sm:text-sm">
            <Link href="/book-ride">
              <span className="sm:hidden">BOOK</span>
              <span className="hidden sm:inline">BOOK A RIDE</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="icon"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
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

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {navLinks.map((link) => {
              const isSectionLink = link.href.startsWith("#")
              const href = isSectionLink ? `/${link.href}` : link.href

              return (
                <Link
                  key={link.label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-border/60 py-3 text-sm font-bold tracking-wide text-muted-foreground transition-colors last:border-b-0 hover:text-primary"
                >
                  {link.label}
                </Link>
              )
            })}

            <Button asChild className="mt-3 w-full font-bold tracking-wide">
              <Link
                href="/book-ride"
                onClick={() => setMobileMenuOpen(false)}
              >
                BOOK A RIDE
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
