import { Car, MapPin, Phone, Mail, LayoutDashboard, ShieldCheck } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Car className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-bold tracking-tight">
                  Kingdom Faith Marketplace
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Transport App &middot; Eastern Region
                </span>
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Reliable car and okada rides across the Eastern Region of Ghana.
              Order in minutes.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Rides</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#rides" className="hover:text-foreground">KFM Go</a></li>
              <li><a href="#rides" className="hover:text-foreground">KFM Comfort</a></li>
              <li><a href="#rides" className="hover:text-foreground">KFM XL</a></li>
              <li><a href="#rides" className="hover:text-foreground">Okada</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Why us</a></li>
              <li><a href="#how-it-works" className="hover:text-foreground">How it works</a></li>
              <li><a href="#book" className="hover:text-foreground">Order a ride</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                NSAWAM-Eastern Region
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:0240555688" className="hover:text-foreground">
                  0240 555 688
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:0204097129" className="hover:text-foreground">
                  020 409 7129
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href="mailto:kingdomfaithtransport@gmail.com"
                  className="break-all hover:text-foreground"
                >
                  kingdomfaithtransport@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Kingdom Faith Marketplace
            Transport App (Eastern Region). All rights reserved.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              KFM Admin Dashboard
            </a>

            <span aria-hidden="true">|</span>

            <a
              href="/admin/drivers"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <ShieldCheck className="h-4 w-4" />
              Driver Verification
            </a>

            <span aria-hidden="true">|</span>

              <a
              href="/admin"
              className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              KFM Admin Dashboard
            </a>

            <a
              href="/admin/drivers"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <ShieldCheck className="h-4 w-4" />
              Driver Verification
            </a>
  
          </div>
        </div>
      </div>
    </footer>
  )
}
