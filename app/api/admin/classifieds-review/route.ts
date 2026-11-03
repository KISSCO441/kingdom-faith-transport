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
      if (status === "rejected" && !notes) {
        return NextResponse.json({ error: "Enter the reason for rejecting this advert so the seller can see what needs to change." }, { status: 400 })
      }
      const { data: advert, error: lookupError } = await auth.supabase
        .from("classified_ads")
        .select("id, title, seller_account_id, advert_status, admin_notes")
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
          ...(status === "active" ? { published_at: now, expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), expired_at: null } : {}),
          updated_at: now,
        })
        .eq("id", id)
        .select("id, title, advert_status, admin_notes, reviewed_at, published_at, expires_at")
        .maybeSingle()
      if (error) return NextResponse.json({ error: "Unable to update this advert." }, { status: 503 })
      if (!data) return NextResponse.json({ error: "Advert not found." }, { status: 404 })

      if (status === "rejected") {
        let emailSent = false
        let emailNotice = "The rejection was saved, but the vendor email could not be sent. Check Resend configuration."
        const { data: seller, error: sellerError } = await auth.supabase
          .from("market_accounts")
          .select("email")
          .eq("id", advert.seller_account_id)
          .maybeSingle()
        const previewTestMode = process.env.VERCEL_ENV === "preview" &&
          process.env.KFM_MARKET_ACCOUNT_EMAIL_TEST_MODE === "true" &&
          Boolean(process.env.KFM_MARKET_ACCOUNT_EMAIL_TEST_TO)
        const liveEmailMode = process.env.RESEND_DOMAIN_VERIFIED === "true" &&
          process.env.KFM_MARKET_ACCOUNT_EMAILS_ENABLED === "true"
        const recipient = previewTestMode
          ? process.env.KFM_MARKET_ACCOUNT_EMAIL_TEST_TO
          : liveEmailMode ? seller?.email : null
        const shouldNotify = advert.advert_status !== "rejected" || advert.admin_notes !== notes

        if (!sellerError && recipient && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && shouldNotify) {
          try {
            const escapedReason = notes.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: "Bearer " + process.env.RESEND_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL,
                to: [recipient],
                subject: "Update on your NSAWAM MARKET advert: " + data.title,
                text: "Hello,\n\nYour advert \"" + data.title + "\" has not been approved by KFM.\n\nReason: " + notes + "\n\nPlease review the reason and make the necessary corrections before submitting again. If you need assistance, contact KFM at 0240 555 688 or 020 409 7129.\n\nNSAWAM MARKET – Shop More. We Deliver!",
                html: "<p>Hello,</p><p>Your advert <strong>" + data.title + "</strong> has not been approved by KFM.</p><p><strong>Reason for rejection:</strong></p><p>" + escapedReason + "</p><p>Please review the reason and make the necessary corrections before submitting again.</p><p>For assistance, contact KFM at 0240 555 688 or 020 409 7129.</p><p>NSAWAM MARKET – Shop More. We Deliver!</p>",
              }),
              cache: "no-store",
            })
            emailSent = emailResponse.ok
            emailNotice = emailSent
              ? (previewTestMode ? "Rejection email sent to the configured Preview test inbox." : "Rejection email sent to the vendor.")
              : "The rejection was saved, but Resend did not accept the email. Check the Resend delivery logs."
          } catch {
            emailNotice = "The rejection was saved, but the email service could not be reached."
          }
        } else if (!shouldNotify) {
          emailSent = true
          emailNotice = "This rejection reason was already emailed; no duplicate email was sent."
        } else if (sellerError || !seller?.email) {
          emailNotice = "The rejection was saved, but the vendor email address could not be found."
        } else if (!recipient) {
          emailNotice = "The rejection was saved. Vendor email delivery is not enabled in this environment."
        }
        return NextResponse.json({ success: true, record: data, emailSent, emailNotice })
      }
      return NextResponse.json({ success: true, record: data })
    }

    return NextResponse.json({ error: "Unknown moderation record type." }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireKfmAdmin(request)
  if (!auth.ok) return auth.response
  try {
    const body = await request.json()
    const id = typeof body?.id === "string" ? body.id : ""
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 1000) : ""
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid advert." }, { status: 400 })
    }
    if (!reason) return NextResponse.json({ error: "Enter a reason for permanent deletion." }, { status: 400 })
    const { error } = await auth.supabase.rpc("kfm_delete_classified_ad", {
      p_advert_id: id,
      p_action: "admin_deleted",
      p_actor_account_id: null,
      p_actor_email: auth.user.email,
      p_reason: reason,
    })
    if (error) {
      console.error("KFM admin advert deletion failed:", error)
      return NextResponse.json({ error: error.message.includes("Advert not found") ? "Advert not found." : "Unable to permanently delete this advert. Confirm the deletion audit migration has been applied." }, { status: error.message.includes("Advert not found") ? 404 : 503 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid deletion request." }, { status: 400 })
  }
}
