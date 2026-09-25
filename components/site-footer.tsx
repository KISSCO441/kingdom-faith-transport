import { Car, MapPin, Phone, Mail } from "lucide-react"

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
                <span className="text-sm font-bold tracking-tight">Kingdom Faith Marketplace</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Transport App &middot; Eastern Region
                </span>
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Reliable car and okada rides across the Eastern Region of Ghana. Order in minutes.
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
                <MapPin className="h-4 w-4 text-primary" />
                Koforidua, Eastern Region
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                024 123 4567
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                hello@kingdomfaithtransport.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Kingdom Faith Marketplace Transport App (Eastern Region). All rights
          reserved.
        </div>
      </div>
    </footer>
  )
}
