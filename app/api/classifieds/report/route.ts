import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const allowedReasons = new Set([
  "Suspected scam or fraud",
  "False or misleading information",
  "Item may be stolen or unlawfully owned",
  "Seller is requesting suspicious advance payment",
  "Other concern",
])

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Advert reporting is temporarily unavailable." }, { status: 503 })
  }

  try {
    const body = await request.json()
    const advertId = typeof body?.advertId === "string" ? body.advertId : ""
    const reason = typeof body?.reason === "string" ? body.reason : ""
    const details = typeof body?.details === "string" ? body.details.trim().slice(0, 1500) : ""
    const contact = typeof body?.contact === "string" ? body.contact.trim().slice(0, 254) : ""

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(advertId)) {
      return NextResponse.json({ error: "Invalid advert." }, { status: 400 })
    }
    if (!allowedReasons.has(reason)) {
      return NextResponse.json({ error: "Choose a valid report reason." }, { status: 400 })
    }
    if (contact && contact.length < 5) {
      return NextResponse.json({ error: "Enter a valid contact detail or leave it blank." }, { status: 400 })
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: advert, error: advertError } = await supabase
      .from("classified_ads")
      .select("id")
      .eq("id", advertId)
      .eq("advert_status", "active")
      .maybeSingle()
    if (advertError) {
      console.error("KFM report advert lookup failed:", advertError.message)
      return NextResponse.json({ error: "Advert reporting is not ready yet. Please contact KFM directly." }, { status: 503 })
    }
    if (!advert) return NextResponse.json({ error: "This advert is no longer available." }, { status: 404 })

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
    const { error } = await supabase.from("classified_ad_reports").insert({
      advert_id: advertId,
      reporter_email: isEmail ? contact : null,
      reporter_phone: contact && !isEmail ? contact : null,
      reason,
      details: details || null,
    })
    if (error) {
      console.error("KFM classified report insert failed:", error.message)
      return NextResponse.json({ error: "Unable to save this report yet. Please contact KFM directly." }, { status: 503 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unable to process this report." }, { status: 400 })
  }
}
