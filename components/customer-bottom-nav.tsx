"use client"

import { usePathname } from "next/navigation"
import { UserRound, House, History } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Account", href: "/account", icon: UserRound },
  { label: "Home", href: "/#book", icon: House },
  { label: "Activity", href: "/activity", icon: History },
]

export function CustomerBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Customer navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(0,0,0,0.06)] backdrop-blur-md"
    >
      <div className="mx-auto grid h-16 max-w-xl grid-cols-3">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active =
            label === "Home"
              ? pathname === "/"
              : label === "Activity"
                ? pathname === "/activity" || pathname === "/ride-status"
                : pathname === "/account"

          return (
            <a
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
