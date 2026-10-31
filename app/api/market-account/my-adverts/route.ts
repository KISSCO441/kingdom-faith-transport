import { NextRequest, NextResponse } from "next/server"
import { getMarketAccount } from "@/lib/market-account-auth"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const { account, supabase } = await getMarketAccount(request)
  if (!account || !supabase) return NextResponse.json({ error: "Please verify your seller email and sign in first." }, { status: 401 })
  if (!["vendor", "vendor_and_seller"].includes(account.account_type)) {
    return NextResponse.json({ error: "This account does not have vendor access." }, { status: 403 })
  }

  const { data: adverts, error } = await supabase
    .from("classified_ads")
    .select("id, title, category, asking_price, location, advert_status, admin_notes, created_at")
    .eq("seller_account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("KFM seller adverts lookup failed:", error)
    return NextResponse.json({ error: "Unable to load your adverts." }, { status: 503 })
  }

  return NextResponse.json({ success: true, adverts: adverts ?? [] })
}
