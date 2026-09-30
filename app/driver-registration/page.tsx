"use client"
import { FormEvent, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function DriverRegistrationPage() {
  const [started, setStarted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setMessage("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)

    if (!supabase) {
      setLoading(false)
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          "https://kingdom-faith-transport.vercel.app/driver-registration",
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setMessage(
      "Your account has been created. Please check your email and click the verification link before continuing your KFM driver registration.",
    )
  }

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
              <h1 className="text-2xl font-bold">KFM Driver Registration</h1>

              <p className="mt-2 text-muted-foreground">
                Step 1 — Create your KFM driver account.
              </p>

              <form onSubmit={handleCreateAccount} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-medium"
                  >
                    Confirm Password
                  </label>

                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Enter your password again"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-lg border border-border bg-muted p-4 text-sm">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Creating Account..."
                    : "Create KFM Driver Account"}
                </button>
              </form>

              <div className="mt-8 border-t border-border pt-6">
                <h2 className="font-semibold">Your registration journey</h2>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <strong>Step 1 — Account</strong>
                    <p className="text-muted-foreground">
                      Create and verify your KFM account.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-3 opacity-60">
                    <strong>Step 2 — Personal Information</strong>
                    <p className="text-muted-foreground">
                      Name, phone, Ghana Card and date of birth.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-3 opacity-60">
                    <strong>Step 3 — Vehicle Information</strong>
                    <p className="text-muted-foreground">
                      Register your Okada or car.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-3 opacity-60">
                    <strong>Step 4 — Driver Information</strong>
                    <p className="text-muted-foreground">
                      Licence, operating area and emergency contact.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-3 opacity-60">
                    <strong>Step 5 — Payment Information</strong>
                    <p className="text-muted-foreground">
                      MoMo number and network.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-3 opacity-60">
                    <strong>Step 6 — Documents</strong>
                    <p className="text-muted-foreground">
                      Upload the documents required by KFM.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
