"use client"

import { Car } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Rides", href: "#rides" },
  { label: "Servicing", href: "#servicing" },
  { label: "Market", href: "#nsawam-market" },
  { label: "Why Us", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Order", href: "#book" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="#" className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Car className="h-5 w-5" />
          </span>

          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight sm:text-base">
              Kingdom Faith Marketplace
            </span>

            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              Transport App &middot; Eastern Region
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Button asChild size="sm">
          <a href="#book">Order a Ride</a>
        </Button>
      </div>
    </header>
  )
}
