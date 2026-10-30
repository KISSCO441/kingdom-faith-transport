import { NextRequest, NextResponse } from "next/server"
import { requireKfmAdmin } from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request)
  if (!auth.ok) return auth.response

  const [{ data: adverts, error: advertsError }, { data: reports, error: reportsError }] = await Promise.all([
    auth.supabase
      .from("classified_ads")
      .select("id, category, title, description, asking_price, location, seller_contact_phone, advert_status, admin_notes, created_at, classified_ad_payments(payment_status, amount, currency, payment_reference)")
      .order("created_at", { ascending: false })
      .limit(100),
    auth.supabase
      .from("classified_ad_reports")
      .select("id, advert_id, reporter_email, reporter_phone, reason, details, report_status, admin_notes, created_at, classified_ads(title, advert_status)")
      .order("created_at", { ascending: false })
      .limit(100),
  ])

  if (advertsError || reportsError) {
    console.error("KFM classifieds moderation load failed:", advertsError || reportsError)
    return NextResponse.json({ error: "Unable to load classifieds moderation. Confirm the reviewed classifieds migration has been applied." }, { status: 503 })
  }
  return NextResponse.json({ success: true, adverts: adverts ?? [], reports: reports ?? [] })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireKfmAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const entity = body?.entity
    const id = typeof body?.id === "string" ? body.id : ""
    const status = typeof body?.status === "string" ? body.status : ""
    const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 1000) : ""
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid review record." }, { status: 400 })
    }

    if (entity === "report") {
      if (!["under_review", "resolved", "dismissed"].includes(status)) {
        return NextResponse.json({ error: "Invalid report decision." }, { status: 400 })
      }
      const { data, error } = await auth.supabase
        .from("classified_ad_reports")
        .update({ report_status: status, admin_notes: notes || null, reviewed_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, report_status, admin_notes, reviewed_at")
        .maybeSingle()
      if (error) return NextResponse.json({ error: "Unable to update this report." }, { status: 503 })
      if (!data) return NextResponse.json({ error: "Report not found." }, { status: 404 })
      return NextResponse.json({ success: true, record: data })
    }

    if (entity === "advert") {
      if (!["active", "rejected", "paused"].includes(status)) {
        return NextResponse.json({ error: "Invalid advert decision." }, { status: 400 })
      }
      const { data: advert, error: lookupError } = await auth.supabase
        .from("classified_ads")
        .select("id, advert_status")
        .eq("id", id)
        .maybeSingle()
      if (lookupError) return NextResponse.json({ error: "Unable to verify advert." }, { status: 503 })
      if (!advert) return NextResponse.json({ error: "Advert not found." }, { status: 404 })

      if (status === "active") {
        const { data: payments, error: paymentError } = await auth.supabase
          .from("classified_ad_payments")
          .select("id, payment_status")
          .eq("advert_id", id)
          .eq("payment_status", "paid")
          .limit(1)
        if (paymentError) return NextResponse.json({ error: "Unable to verify listing payment." }, { status: 503 })
        if (!payments?.length) {
          return NextResponse.json({ error: "This advert cannot be published until its listing fee is verified as paid." }, { status: 409 })
        }
      }

      const now = new Date().toISOString()
      const { data, error } = await auth.supabase
        .from("classified_ads")
        .update({
          advert_status: status,
          admin_notes: notes || null,
          reviewed_at: now,
          ...(status === "active" ? { published_at: now } : {}),
          updated_at: now,
        })
        .eq("id", id)
        .select("id, title, advert_status, admin_notes, reviewed_at, published_at")
        .maybeSingle()
      if (error) return NextResponse.json({ error: "Unable to update this advert." }, { status: 503 })
      if (!data) return NextResponse.json({ error: "Advert not found." }, { status: 404 })
      return NextResponse.json({ success: true, record: data })
    }

    return NextResponse.json({ error: "Unknown moderation record type." }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 })
  }
}
