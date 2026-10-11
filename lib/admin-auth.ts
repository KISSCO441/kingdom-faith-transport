import "server-only";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
export async function requireKfmAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const accessToken = match?.[1]?.trim();

  if (!accessToken) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Administrator sign-in is required." },
        { status: 401 },
      ),
    };
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const adminEmail =
    process.env.KFM_ADMIN_EMAIL?.trim().toLowerCase();

 
const missingVariables = [
  !supabaseUrl
    ? "NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)"
    : null,
  !publishableKey
    ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    : null,
  !serviceRoleKey
    ? "SUPABASE_SERVICE_ROLE_KEY"
    : null,
  !adminEmail
    ? "KFM_ADMIN_EMAIL"
    : null,
].filter((name): name is string => Boolean(name));

if (missingVariables.length > 0) {
  console.error(
    "KFM admin configuration is missing:",
    missingVariables
  );

  return {
    ok: false as const,
    response: NextResponse.json(
      {
        error:
          `Administrator access is not configured. Missing: ${missingVariables.join(", ")}`,
      },
      { status: 500 }
    ),
  };
}

    console.error("KFM admin authorization configuration is incomplete.");

    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Administrator access is not configured." },
        { status: 500 },
      ),
    };
  }

  const authClient = createClient(
    supabaseUrl,
    publishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  const { data, error } =
    await authClient.auth.getUser(accessToken);

  if (error || !data.user?.email) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Your sign-in is invalid or has expired." },
        { status: 401 },
      ),
    };
  }

  if (data.user.email.trim().toLowerCase() !== adminEmail) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "You are not authorized to access KFM administration." },
        { status: 403 },
      ),
    };
  }

  const adminSupabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return {
    ok: true as const,
    user: data.user,
    supabase: adminSupabase,
  };
}
