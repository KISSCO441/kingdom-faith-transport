"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  CarFront,
  Users,
  ShoppingBag,
  Wallet,
  UserRoundSearch,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const sections = [
  {
    title: "All Rides",
    description: "View customer bookings for Cars and Okada, ride statuses, fares, and assigned drivers.",
    href: "/admin/rides",
    icon: CarFront,
  },
  {
    title: "Unassigned Rides",
    description: "Review bookings that are still waiting for a driver. Assignment tools can be added after verification.",
    href: "/admin/rides",
    icon: UserRoundSearch,
  },
  {
    title: "Drivers",
    description: "Review driver registrations, submitted documents, verification decisions, and availability.",
    href: "/admin/drivers",
    icon: Users,
  },
  {
    title: "Market Orders",
    description: "Open the existing KFM Marketplace order-management page.",
    href: "/admin/market-orders",
    icon: ShoppingBag,
  },
  {
    title: "Ride Payments",
    description: "Review ride fares and recorded cash or online payment information.",
    href: "/admin/rides",
    icon: Wallet,
  },
];

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-2xl bg-slate-900 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-slate-300">
                <ShieldCheck className="h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  Kingdom Faith Transport
                </span>
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">
                Admin Control Centre
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Manage rides, drivers, Marketplace orders, and ride-payment
                records from one central location.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3">
              <LayoutDashboard className="h-5 w-5 text-slate-300" />
              <span className="font-semibold">Administration</span>
            </div>
          </div>
        </header>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Management Sections
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Select a section to open its existing management page.
          </p>
        </div>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                key={section.title}
                href={section.href}
                className="group flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-400 hover:shadow-md"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="rounded-xl bg-slate-100 p-3 text-slate-800">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-900" />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {section.title}
                </h3>

                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                  {section.description}
                </p>

                <span className="mt-4 text-sm font-semibold text-slate-900">
                  Open section →
                </span>
              </Link>
            );
          })}
        </section>

        <footer className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">
            KFM Administration
          </p>
          <p className="mt-1">
            Existing management pages remain separate. This home page provides
            central navigation; it does not replace sign-in security or
            independently verify payments.
          </p>
          <Link
            href="/admin/login"
            className="mt-3 inline-flex items-center gap-2 font-semibold text-slate-900 underline underline-offset-4"
          >
            Admin Login
          </Link>
        </footer>
      </div>
    </main>
  );
}
