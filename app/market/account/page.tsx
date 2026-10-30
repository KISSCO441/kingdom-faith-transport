"use client";

import { useState } from "react";

type AccountType = "vendor" | "classified_seller" | "vendor_and_seller";

export default function MarketAccountPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("vendor");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"details" | "verify" | "complete">("details");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/market-account/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, phone, accountType }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not request a sign-in code.");
      setMessage(result.message || "If verification is available, a code will be sent.");
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request a sign-in code.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/market-account/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Code verification failed.");
      setStep("complete");
      setMessage(`Email verified. Signed in as ${result.account?.email || email}.`);
      setAccountType(result.account?.accountType || accountType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code verification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12">
      <section className="w-full rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">NSAWAM MARKET</p>
        <h1 className="mt-2 text-2xl font-bold">Seller account access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your email address and a one-time verification code. No password is required.
        </p>

        {step === "details" && (
          <form className="mt-6 space-y-4" onSubmit={requestCode}>
            <label className="block text-sm font-medium">
              I want to
              <select className="mt-1 w-full rounded-lg border bg-background px-3 py-2" value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)}>
                <option value="vendor">Become a marketplace vendor</option>
                <option value="classified_seller">Advertise a car, appliance or item</option>
                <option value="vendor_and_seller">Use both services</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Your name or business name
              <input className="mt-1 w-full rounded-lg border bg-background px-3 py-2" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} />
            </label>
            <label className="block text-sm font-medium">
              Phone number
              <input className="mt-1 w-full rounded-lg border bg-background px-3 py-2" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} />
            </label>
            <label className="block text-sm font-medium">
              Email address
              <input className="mt-1 w-full rounded-lg border bg-background px-3 py-2" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>
            <button className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60" disabled={busy}>
              {busy ? "Please wait..." : "Send verification code"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form className="mt-6 space-y-4" onSubmit={verifyCode}>
            <p className="text-sm text-muted-foreground">Enter the six-digit code sent for {email}.</p>
            <label className="block text-sm font-medium">
              Verification code
              <input className="mt-1 w-full rounded-lg border bg-background px-3 py-3 text-center text-xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
            </label>
            <button className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60" disabled={busy || code.length !== 6}>
              {busy ? "Verifying..." : "Verify and sign in"}
            </button>
            <button type="button" className="w-full rounded-lg border px-4 py-3 text-sm" onClick={() => { setStep("details"); setCode(""); setMessage(""); }}>
              Change email or account details
            </button>
          </form>
        )}

        {step === "complete" && (
          <div className="mt-6 rounded-xl border p-4">
            <p className="font-semibold">Email successfully verified.</p>
            <p className="mt-1 text-sm text-muted-foreground">Your seller sign-in session has started. Choose the next step below.</p>
            {(accountType === "vendor" || accountType === "vendor_and_seller") && (
              <a href="/market/become-a-vendor" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">Complete vendor application</a>
            )}
            {(accountType === "classified_seller" || accountType === "vendor_and_seller") && (
              <p className="mt-3 text-sm text-muted-foreground">Classified advert submission is the next stage of development.</p>
            )}
          </div>
        )}

        {message && <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
        <p className="mt-6 text-xs text-muted-foreground">Your email code expires after 10 minutes. KFM seller access is separate from customer grocery-order access.</p>
      </section>
    </main>
  );
}
