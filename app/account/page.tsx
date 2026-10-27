"use client"

import { CustomerBottomNav } from "@/components/customer-bottom-nav"
import {
  UserRound,
  CreditCard,
  MapPin,
  LifeBuoy,
  ShieldCheck,
  Settings,
  ChevronRight,
} from "lucide-react"

const accountItems = [
  { label: "Payments", description: "Payment methods and ride payment records", icon: CreditCard },
  { label: "Saved places", description: "Quickly choose places you visit often", icon: MapPin },
  { label: "Support", description: "Get help with a booking or payment", icon: LifeBuoy },
  { label: "Safety", description: "Ride safety information and assistance", icon: ShieldCheck },
  { label: "Settings", description: "Account preferences", icon: Settings },
]

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 pb-28 pt-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          KFM Transport
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Account</h1>
        <p className="mt-2 text-muted-foreground">
          Your profile, payments and customer preferences.
        </p>

        <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold">Your KFM profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Secure customer account access is being prepared.
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-semibold">Your privacy matters</p>
            <p className="mt-1 text-muted-foreground">
              KFM will show your personal profile and full ride history only after a secure sign-in or phone verification process is in place. We have not enabled customer account access yet.
            </p>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm" aria-label="Account options">
          {accountItems.map(({ label, description, icon: Icon }, index) => (
            <div
              key={label}
              className={`flex items-center gap-3 p-4 ${index ? "border-t border-border" : ""}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
          ))}
        </section>
      </div>
      <CustomerBottomNav />
    </main>
  )
}
