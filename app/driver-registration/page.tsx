"use client"

import { FormEvent, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function DriverRegistrationPage() {
  const [started, setStarted] = useState(false)
  const [verified, setVerified] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function checkSession() {
      if (!supabase) {
        if (mounted) setCheckingSession(false)
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      const user = session?.user

      if (user?.email_confirmed_at) {
        setVerified(true)
        setStarted(true)
        setEmail(user.email ?? "")
      }

      setCheckingSession(false)
    }

    checkSession()

    if (!supabase) {
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user

      if (user?.email_confirmed_at) {
        setVerified(true)
        setStarted(true)
        setEmail(user.email ?? "")
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setMessage("")

    if (!email || !password || !confirmPassword) {
      setError("Please complete all account fields.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (!supabase) {
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
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

    if (data.session?.user?.email_confirmed_at) {
      setVerified(true)
      setStarted(true)
      setMessage("Your email has been verified.")
      return
    }

    setMessage(
      "Your account has been created. Please check your email and click the verification link before continuing your KFM driver registration.",
    )
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="text-3xl font-bold">KFM Driver Registration</h1>
          <p className="mt-4 text-muted-foreground">
            Checking your registration status...
          </p>
        </section>
      </main>
    )
  }

  if (!started) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">
            Become a KFM Driver Partner
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">
            Earn with KFM Transport. Register your vehicle, submit your
            documents, and join our growing driver network.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-6">
              <h2 className="font-semibold">Flexible Driving</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose when you want to be available.
              </p>
            </div>

            <div className="rounded-xl border p-6">
              <h2 className="font-semibold">KFM Support</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Get connected with customers through KFM Transport.
              </p>
            </div>

            <div className="rounded-xl border p-6">
              <h2 className="font-semibold">Driver Verification</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your information and documents are reviewed by KFM.
              </p>
            </div>

            <div className="rounded-xl border p-6">
              <h2 className="font-semibold">Ride Opportunities</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Approved drivers can receive suitable ride requests.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-10 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground"
          >
            Start Driver Registration
          </button>
        </section>
      </main>
    )
  }

  if (verified) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">KFM Driver Registration</h1>

          <div className="mt-8 rounded-xl border p-6">
            <h2 className="text-2xl font-bold text-green-600">
              ✓ Email Verified
            </h2>

            <p className="mt-3">
              Your KFM driver account has been verified successfully.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Account: {email}
            </p>
          </div>

          <div className="mt-8 rounded-xl border p-6">
            <h2 className="text-2xl font-bold">
              Step 2 — Personal Information
            </h2>

            <p className="mt-3 text-muted-foreground">
              Your email account is verified. Your personal information form
              will be completed next.
            </p>

            <div className="mt-6 rounded-lg bg-muted p-5">
              <p className="font-medium">
                ✓ Step 1 — Account completed
              </p>
              <p className="mt-2 font-medium">
                → Step 2 — Personal Information
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold">Registration Journey</h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border p-4">
                ✓ Step 1 — Account
              </div>

              <div className="rounded-lg border-2 border-primary p-4">
                → Step 2 — Personal Information
              </div>

              <div className="rounded-lg border p-4">
                Step 3 — Vehicle Information
              </div>

              <div className="rounded-lg border p-4">
                Step 4 — Driver Information
              </div>

              <div className="rounded-lg border p-4">
                Step 5 — Payment Information
              </div>

              <div className="rounded-lg border p-4">
                Step 6 — Documents
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold">KFM Driver Registration</h1>

        <div className="mt-8 rounded-xl border p-6">
          <h2 className="text-2xl font-bold">
            Step 1 — Create your KFM driver account
          </h2>

          <form onSubmit={handleCreateAccount} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-lg border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Password</label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-lg border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                className="mt-2 w-full rounded-lg border px-4 py-3"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loading
                ? "Creating Account..."
                : "Create KFM Driver Account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
