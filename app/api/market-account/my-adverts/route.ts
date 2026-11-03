import { NextRequest, NextResponse } from "next/server"
import { getMarketAccount } from "@/lib/market-account-auth"

export const runtime = "nodejs"

async function getSeller(request: NextRequest) {
  const { account, supabase } = await getMarketAccount(request)
  if (!account || !supabase) return { response: NextResponse.json({ error: "Please verify your seller email and sign in first." }, { status: 401 }) }
  if (!["vendor", "classified_seller", "vendor_and_seller"].includes(account.account_type)) {
    return { response: NextResponse.json({ error: "This account does not have seller access." }, { status: 403 }) }
  }
  return { account, supabase }
}

export async function GET(request: NextRequest) {
  const auth = await getSeller(request)
  if ("response" in auth) return auth.response
  const { data: adverts, error } = await auth.supabase
    .from("classified_ads")
    .select("id, title, category, asking_price, location, advert_status, admin_notes, created_at, published_at, expires_at, expired_at")
    .eq("seller_account_id", auth.account.id)
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) {
    console.error("KFM seller adverts lookup failed:", error)
    return NextResponse.json({ error: "Unable to load your adverts." }, { status: 503 })
  }
  return NextResponse.json({ success: true, adverts: adverts ?? [] })
}

export async function DELETE(request: NextRequest) {
  const auth = await getSeller(request)
  if ("response" in auth) return auth.response
  try {
    const body = await request.json()
    const id = typeof body?.id === "string" ? body.id : ""
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid advert." }, { status: 400 })
    }
    const { error } = await auth.supabase.rpc("kfm_delete_classified_ad", {
      p_advert_id: id,
      p_action: "vendor_deleted",
      p_actor_account_id: auth.account.id,
      p_actor_email: auth.account.email,
      p_reason: "Deleted by seller",
    })
    if (error) {
      const message = error.message.includes("Advert not found") ? "Advert not found." :
        error.message.includes("only delete your own") ? "You can only delete your own advert." :
        "Unable to delete this advert. Please try again."
      return NextResponse.json({ error: message }, { status: error.message.includes("not found") ? 404 : 403 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid deletion request." }, { status: 400 })
  }
}
