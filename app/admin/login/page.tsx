
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase as supabaseClient } from "@/lib/supabase";

export default function KfmAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!supabaseClient) {
      setError("Supabase is not configured. Please contact the site administrator.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } =
        await supabaseClient.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError || !data.session?.access_token) {
        setError("Sign-in failed. Check your email and password.");
        return;
      }

      const response = await fetch("/api/admin/session", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
        cache: "no-store",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        await supabaseClient.auth.signOut();
        setError(
          result.error ||
            "This account is not authorized to access KFM administration."
        );
        return;
      }

     router.push("/admin");
      router.refresh();
    } catch {
      setError("Unable to verify administrator access. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
            KFM
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Administrator Sign In
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your authorized KFM administration account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-700"
              placeholder="Enter your admin email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-700"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying access..." : "Sign In Securely"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Authorized KFM administrators only.
        </p>
      </section>
    </main>
  );
}
