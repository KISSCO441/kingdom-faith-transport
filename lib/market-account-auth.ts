import "server-only";

import { createHmac } from "node:crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export type MarketAccount = {
  id: string;
  email: string;
  account_type: "vendor" | "classified_seller" | "vendor_and_seller";
  display_name: string | null;
  phone: string | null;
  email_verified_at: string | null;
};

function getConfiguration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export async function getMarketAccount(request: NextRequest): Promise<{
  account: MarketAccount | null;
  supabase: SupabaseClient | null;
}> {
  const config = getConfiguration();
  const token = request.cookies.get("kfm_market_account_session")?.value;
  if (!config || !token || !/^[a-f0-9]{64}$/.test(token)) {
    return { account: null, supabase: null };
  }

  const supabase = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tokenHash = createHmac("sha256", config.key).update(token).digest("hex");
  const { data: session, error: sessionError } = await supabase
    .from("market_account_sessions")
    .select("account_id")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (sessionError || !session) return { account: null, supabase: null };

  const { data: account, error: accountError } = await supabase
    .from("market_accounts")
    .select("id, email, account_type, display_name, phone, email_verified_at")
    .eq("id", session.account_id)
    .not("email_verified_at", "is", null)
    .maybeSingle();

  if (accountError || !account) return { account: null, supabase: null };
  return { account: account as MarketAccount, supabase };
}
