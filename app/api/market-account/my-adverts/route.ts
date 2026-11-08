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

const validId = (id: unknown): id is string =>
  typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

export async function GET(request: NextRequest) {
  const auth = await getSeller(request)
  if ("response" in auth) return auth.response
  const { data: adverts, error } = await auth.supabase
    .from("classified_ads")
    .select("id, title, description, category, asking_price, location, seller_contact_phone, image_urls, advert_status, admin_notes, created_at, published_at, expires_at")
    .eq("seller_account_id", auth.account.id)
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) {
    console.error("KFM seller adverts lookup failed:", error)
    return NextResponse.json({ error: "Unable to load your adverts." }, { status: 503 })
  }
  return NextResponse.json({ success: true, adverts: adverts ?? [] })
}

export async function PATCH(request: NextRequest) {
  const auth = await getSeller(request)
  if ("response" in auth) return auth.response
  try {
    const body = await request.json()
    if (!validId(body?.id)) return NextResponse.json({ error: "Invalid advert." }, { status: 400 })
    const title = typeof body.title === "string" ? body.title.trim() : ""
    const description = typeof body.description === "string" ? body.description.trim() : ""
    const location = typeof body.location === "string" ? body.location.trim() : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : ""
    const price = Number(body.askingPrice)
    const images = body.imageUrls
    if (!title || title.length > 140 || !description || description.length > 4000 ||
      !location || location.length > 180 || !phone || phone.length > 40 ||
      !Number.isFinite(price) || price <= 0 || price > 100000000 ||
      !Array.isArray(images) || images.length > 5 ||
      images.some((item: unknown) => typeof item !== "string" || item.length > 2000 || !/^https:\/\//i.test(item))) {
      return NextResponse.json({ error: "Check the title, description, price, location, phone number and maximum five photo links." }, { status: 400 })
    }
    const { data: current, error: lookupError } = await auth.supabase
      .from("classified_ads")
      .select("id, advert_status")
      .eq("id", body.id)
      .eq("seller_account_id", auth.account.id)
      .maybeSingle()
    if (lookupError) return NextResponse.json({ error: "Unable to verify advert ownership." }, { status: 503 })
    if (!current) return NextResponse.json({ error: "Advert not found in your account." }, { status: 404 })
    if (["pending_payment", "sold", "expired"].includes(current.advert_status)) {
      return NextResponse.json({ error: "This advert cannot be edited while it is awaiting payment, sold or expired." }, { status: 409 })
    }
    const nextStatus = ["active", "paused", "rejected"].includes(current.advert_status) ? "pending_review" : current.advert_status
    const { data, error } = await auth.supabase
      .from("classified_ads")
      .update({
        title, description, asking_price: Math.round(price * 100) / 100,
        location, seller_contact_phone: phone, image_urls: images,
        advert_status: nextStatus, updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("seller_account_id", auth.account.id)
      .select("id, advert_status")
      .single()
    if (error || !data) {
      console.error("KFM seller classified edit failed:", error)
      return NextResponse.json({ error: "Unable to save advert changes." }, { status: 503 })
    }
    return NextResponse.json({ success: true, advert: data, message: nextStatus === "pending_review" ? "Changes saved. Your advert has been sent to KFM for review before it is shown publicly." : "Your advert changes have been saved." })
  } catch {
    return NextResponse.json({ error: "Invalid advert update request." }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getSeller(request)
  if ("response" in auth) return auth.response
  try {
    const body = await request.json()
    if (!validId(body?.id) || !["hide", "unhide", "mark_sold"].includes(body?.action)) {
      return NextResponse.json({ error: "Invalid advert action." }, { status: 400 })
    }
    const { data: current, error: lookupError } = await auth.supabase
      .from("classified_ads")
      .select("id, advert_status")
      .eq("id", body.id)
      .eq("seller_account_id", auth.account.id)
      .maybeSingle()
    if (lookupError) return NextResponse.json({ error: "Unable to verify advert ownership." }, { status: 503 })
    if (!current) return NextResponse.json({ error: "Advert not found in your account." }, { status: 404 })

    let nextStatus: string
    if (body.action === "hide") {
      if (current.advert_status !== "active") return NextResponse.json({ error: "Only a published advert can be hidden." }, { status: 409 })
      nextStatus = "paused"
    } else if (body.action === "unhide") {
      if (current.advert_status !== "paused") return NextResponse.json({ error: "Only a hidden advert can be submitted for publication." }, { status: 409 })
      nextStatus = "pending_review"
    } else {
      if (!["active", "paused"].includes(current.advert_status)) return NextResponse.json({ error: "Only a published or hidden advert can be marked as sold." }, { status: 409 })
      nextStatus = "sold"
    }
    const { error } = await auth.supabase
      .from("classified_ads")
      .update({ advert_status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .eq("seller_account_id", auth.account.id)
    if (error) {
      console.error("KFM seller classified status update failed:", error)
      return NextResponse.json({ error: "Unable to update advert status." }, { status: 503 })
    }
    return NextResponse.json({ success: true, advertStatus: nextStatus })
  } catch {
    return NextResponse.json({ error: "Invalid advert action request." }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await getSeller(request)
  if ("response" in auth) return auth.response
  try {
    const body = await request.json()
    const id = typeof body?.id === "string" ? body.id : ""
    if (!validId(id)) return NextResponse.json({ error: "Invalid advert." }, { status: 400 })
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
