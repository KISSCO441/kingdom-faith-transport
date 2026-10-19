
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminAccessGuardProps = {
  children: ReactNode;
};

export default function AdminAccessGuard({
  children,
}: AdminAccessGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      if (!supabase) {
        router.replace("/admin/login");
        return;
      }

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session?.access_token) {
          await supabase.auth.signOut();
          router.replace("/admin/login");
          return;
        }

        const response = await fetch("/api/admin/session", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          await supabase.auth.signOut();
          router.replace("/admin/login");
          return;
        }

        if (active) {
          setAuthorized(true);
        }
      } catch {
        router.replace("/admin/login");
      }
    }

    void verifyAdmin();

    return () => {
      active = false;
    };
  }, [router]);

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <p className="text-sm text-slate-600">
          Verifying administrator access...
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
