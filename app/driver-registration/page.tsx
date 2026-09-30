"use client"

import { useState } from "react"

export default function DriverRegistrationPage() {
  const [started, setStarted] = useState(false)

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-sm md:p-12">
          {!started ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
                🚗
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Become a KFM Driver Partner
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Earn with KFM Transport. Register your vehicle, submit your
                documents, and join our growing driver network.
              </p>

              <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <h2 className="font-semibold">Flexible Driving</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose when you want to be available.
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <h2 className="font-semibold">KFM Support</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get connected with customers through KFM Transport.
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <h2 className="font-semibold">Driver Verification</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your information and documents are reviewed by KFM.
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <h2 className="font-semibold">Ride Opportunities</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Approved drivers can receive suitable ride requests.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStarted(true)}
                className="mt-8 rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Start Driver Registration
              </button>

              <p className="mt-4 text-xs text-muted-foreground">
                Already registered? Your KFM driver account will be connected
                to your registration profile.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold">
                KFM Driver Registration
              </h1>

              <p className="mt-2 text-muted-foreground">
                Your registration will be completed in several steps.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-xl border border-border p-5">
                  <h2 className="font-semibold">Step 1 — Account</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your KFM driver account.
                  </p>
                </div>

                <div className="rounded-xl border border-border p-5 opacity-60">
                  <h2 className="font-semibold">Step 2 — Personal Information</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your name, phone, Ghana Card and date of birth.
                  </p>
                </div>

                <div className="rounded-xl border border-border p-5 opacity-60">
                  <h2 className="font-semibold">Step 3 — Vehicle Information</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Register your Okada or car.
                  </p>
                </div>

                <div className="rounded-xl border border-border p-5 opacity-60">
                  <h2 className="font-semibold">Step 4 — Driver Information</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Licence, operating area and emergency contact.
                  </p>
                </div>

                <div className="rounded-xl border border-border p-5 opacity-60">
                  <h2 className="font-semibold">Step 5 — Payment Information</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your MoMo number and network.
                  </p>
                </div>

                <div className="rounded-xl border border-border p-5 opacity-60">
                  <h2 className="font-semibold">Step 6 — Documents</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload the documents required by KFM.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
