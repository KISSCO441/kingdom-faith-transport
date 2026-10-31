"use client";

import { useState } from "react";

type AccountType = "vendor" | "classified_seller" | "vendor_and_seller";
type AccessMode = "choose" | "new" | "returning";

export default function MarketAccountPage() {
  const [accessMode, setAccessMode] = useState<AccessMode>("choose");
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
        body: JSON.stringify({
          email,
          accountType: accessMode === "returning" ? "returning_vendor" : accountType,
          displayName: accessMode === "new" ? displayName : null,
          phone: accessMode === "new" ? phone : null,
        }),
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

  function changeAccessDetails() {
    setStep("details");
    setCode("");
    setMessage("");
    setError("");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12">
      <section className="w-full rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">NSAWAM MARKET</p>
        <h1 className="mt-2 text-2xl font-bold">Seller account access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose whether you are registering as a new seller or returning to manage your existing products and adverts.
        </p>

        {accessMode === "choose" && (
          <div className="mt-6 space-y-3">
            <button type="button" onClick={() => setAccessMode("new")} className="w-full rounded-xl border p-4 text-left hover:bg-muted">
              <span className="block font-semibold">New Vendor</span>
              <span className="mt-1 block text-sm text-muted-foreground">Register your business and create a seller account.</span>
            </button>
            <button type="button" onClick={() => setAccessMode("returning")} className="w-full rounded-xl border p-4 text-left hover:bg-muted">
              <span className="block font-semibold">Returning Vendor</span>
              <span className="mt-1 block text-sm text-muted-foreground">Access your existing seller profile, product listings and classified adverts.</span>
            </button>
            <p className="pt-2 text-xs text-muted-foreground">Already have a vendor account? Choose Returning Vendor. Do not register again.</p>
          </div>
        )}

        {accessMode !== "choose" && step === "details" && (
          <form className="mt-6 space-y-4" onSubmit={requestCode}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{accessMode === "new" ? "New Vendor Registration" : "Returning Vendor Sign-in"}</p>
              <button type="button" className="text-sm text-primary underline" onClick={() => { setAccessMode("choose"); changeAccessDetails(); }}>Change option</button>
            </div>
            {accessMode === "new" && (
              <>
                <label className="block text-sm font-medium">
                  I want to
                  <select required className="mt-1 w-full rounded-lg border bg-background px-3 py-2" value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)}>
                    <option value="vendor">Become a marketplace vendor</option>
                    <option value="classified_seller">Advertise a car, appliance or item</option>
                    <option value="vendor_and_seller">Use both services</option>
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Your name or business name
                  <input required className="mt-1 w-full rounded-lg border bg-background px-3 py-2" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} />
                </label>
                <label className="block text-sm font-medium">
                  Phone number
                  <input required className="mt-1 w-full rounded-lg border bg-background px-3 py-2" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} />
                </label>
              </>
            )}
            {accessMode === "returning" && (
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Enter the email address you used when registering or advertising on KFM. We will match it to your saved seller profile or adverts.
              </p>
            )}
            <label className="block text-sm font-medium">
              {accessMode === "new" ? "Email address" : "Registered seller email"}
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
            <button type="button" className="w-full rounded-lg border px-4 py-3 text-sm" onClick={changeAccessDetails}>
              Change email or account details
            </button>
          </form>
        )}

        {step === "complete" && (
          <div className="mt-6 rounded-xl border p-4">
            <p className="font-semibold">Email successfully verified.</p>
            <p className="mt-1 text-sm text-muted-foreground">Your seller sign-in session has started. Your existing seller profile, products and adverts remain linked to the same account.</p>
            {(accountType === "vendor" || accountType === "vendor_and_seller") && (
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="/vendor/dashboard" className="inline-flex rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">Open vendor dashboard</a>
                <a href="/market/become-a-vendor" className="inline-flex rounded-lg border px-4 py-2 font-semibold">Vendor application</a>
              </div>
            )}
            {(accountType === "classified_seller" || accountType === "vendor_and_seller") && (
              <div className="mt-3 flex flex-wrap gap-3"><a href="/market/account/my-adverts" className="inline-flex rounded-lg border px-4 py-2 font-semibold">View My Adverts</a><a href="/market/account/classifieds/new" className="inline-flex rounded-lg border px-4 py-2 font-semibold">Create a classified advert</a></div>
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
