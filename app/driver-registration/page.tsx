"use client"

import { FormEvent, useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function DriverRegistrationPage() {
  const [started, setStarted] = useState(false)
  const [verified, setVerified] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [signInMode, setSignInMode] = useState(false)
  const [step, setStep] = useState(1)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [nationalId, setNationalId] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")

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
        setStep(2)
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
        setStep(2)
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
      setStep(2)
      setMessage("Your email has been verified.")
      return
    }

    setMessage(
      "Your account has been created. Please check your email and click the verification link before continuing your KFM driver registration.",
    )
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setMessage("")

    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }

    if (!supabase) {
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    setLoading(true)

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    const user = data.user

    if (!user?.email_confirmed_at) {
      setError(
        "Your email has not been verified yet. Please check your email and confirm your account.",
      )
      return
    }

    setVerified(true)
    setStarted(true)
    setStep(2)
    setMessage("Welcome back. Your KFM driver account is verified.")
  }

  async function handlePersonalInformation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError("")
    setMessage("")

    if (!fullName || !phone || !nationalId || !dateOfBirth) {
      setError("Please complete all personal information fields.")
      return
    }

    if (!supabase) {
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      setError("Your session has expired. Please sign in again.")
      return
    }

  const driverData = {
  user_id: user.id,
  email: user.email,
  full_name: fullName,
  name: fullName,
  phone,
  nationalid_number: nationalId,
  date_of_birth: dateOfBirth,
  status: "Pending Verification",
  availability: "OFFLINE",
}

const { data: existingDriver, error: lookupError } = await supabase
  .from("drivers")
  .select("id")
  .eq("user_id", user.id)
  .maybeSingle()

if (lookupError) {
  setLoading(false)
  setError(lookupError.message)
  return
}

let saveError = null

if (existingDriver) {
  const { error } = await supabase
    .from("drivers")
    .update(driverData)
    .eq("id", existingDriver.id)

  saveError = error
} else {
  const { error } = await supabase
    .from("drivers")
    .insert(driverData)

  saveError = error
}

    setLoading(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setMessage("Personal information saved successfully.")
    setStep(3)
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="text-3xl font-bold">
            KFM Driver Registration
          </h1>

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

          <div className="mt-10 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => {
                setStarted(true)
                setSignInMode(false)
              }}
              className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground"
            >
              Start Driver Registration
            </button>

            <button
              type="button"
              onClick={() => {
                setStarted(true)
                setSignInMode(true)
                setError("")
                setMessage("")
              }}
              className="rounded-lg border px-6 py-3 font-semibold"
            >
              Already have an account? Sign in
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (verified && step === 2) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">
            KFM Driver Registration
          </h1>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">
              Registration Journey
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border p-4">
                ✓ Step 1 — Account
              </div>

              <div className="rounded-lg border-2 border-primary p-4">
                → Step 2 — Personal Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 3 — Vehicle Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 4 — Driver Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 5 — Payment Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 6 — Documents
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-xl border p-6">
            <h2 className="text-2xl font-bold">
              Step 2 — Personal Information
            </h2>

            <p className="mt-2 text-muted-foreground">
              Please provide your personal information.
            </p>

            <form
              onSubmit={handlePersonalInformation}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="e.g. 0241234567"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Ghana Card Number
                </label>

                <input
                  type="text"
                  value={nationalId}
                  onChange={(event) =>
                    setNationalId(event.target.value)
                  }
                  placeholder="GHA-XXXXXXXXX-X"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Date of Birth
                </label>

                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) =>
                    setDateOfBirth(event.target.value)
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
                {loading ? "Saving..." : "Save & Continue"}
              </button>
            </form>
          </div>
        </section>
      </main>
    )
  }

  if (verified && step === 3) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">
            KFM Driver Registration
          </h1>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">
              Registration Journey
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border p-4">
                ✓ Step 1 — Account
              </div>

              <div className="rounded-lg border p-4">
                ✓ Step 2 — Personal Information
              </div>

              <div className="rounded-lg border-2 border-primary p-4">
                → Step 3 — Vehicle Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 4 — Driver Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 5 — Payment Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 6 — Documents
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-xl border p-6">
            <h2 className="text-2xl font-bold">
              Step 3 — Vehicle Information
            </h2>

            <p className="mt-2 text-muted-foreground">
              Vehicle registration will be completed in the next
              stage.
            </p>

            <div className="mt-6 rounded-lg border p-4">
              <p className="font-medium">
                Your personal information has been saved.
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                The KFM vehicle information form will be added here
                next.
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold">
          KFM Driver Registration
        </h1>

        <div className="mt-8 rounded-xl border p-6">
          <h2 className="text-2xl font-bold">
            {signInMode
              ? "Sign in to your KFM driver account"
              : "Step 1 — Create your KFM driver account"}
          </h2>

          <form
            onSubmit={
              signInMode ? handleSignIn : handleCreateAccount
            }
            className="mt-6 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="mt-2 w-full rounded-lg border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Password
              </label>

              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3 pr-12"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {!signInMode && (
              <div>
                <label className="block text-sm font-medium">
                  Confirm Password
                </label>

                <div className="relative mt-2">
                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    className="w-full rounded-lg border px-4 py-3 pr-12"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
            )}

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
                ? "Please wait..."
                : signInMode
                  ? "Sign In"
                  : "Create KFM Driver Account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setSignInMode(!signInMode)
              setError("")
              setMessage("")
              setPassword("")
              setConfirmPassword("")
              setShowPassword(false)
              setShowConfirmPassword(false)
              setStarted(true)
            }}
            className="mt-5 text-sm font-medium underline"
          >
            {signInMode
              ? "Need to create a new account?"
              : "Already have a verified account? Sign in"}
          </button>
        </div>
      </section>
    </main>
  )
}
