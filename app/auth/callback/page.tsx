"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { customerAuthClient } from "@/lib/customer-auth"

export default function CustomerAuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState("Verifying your secure sign-in link...")

  useEffect(() => {
    let active = true

    async function completeSignIn() {
      if (!customerAuthClient) {
        setMessage("Customer sign-in is not configured yet. Please contact KFM.")
        return
      }

      const url = new URL(window.location.href)
      const code = url.searchParams.get("code")

      if (!code) {
        setMessage("This sign-in link is missing or has expired. Return to Account and request a new link.")
        return
      }

      const { error } = await customerAuthClient.auth.exchangeCodeForSession(code)

      if (!active) return

      if (error) {
        setMessage("This sign-in link has expired or has already been used. Return to Account and request a new link.")
        return
      }

      router.replace("/account")
      router.refresh()
    }

    void completeSignIn()
    return () => {
      active = false
    }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">KFM Transport</p>
        <h1 className="mt-2 text-2xl font-bold">Secure customer sign-in</h1>
        <p className="mt-3 text-sm text-muted-foreground" role="status">{message}</p>
        <a href="/account" className="mt-6 inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">Return to Account</a>
      </div>
    </main>
  )
}
