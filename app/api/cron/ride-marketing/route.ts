import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "node:crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function signEmail(email: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(email.toLowerCase()).digest("hex")
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendKey = process.env.RESEND_API_KEY
  const unsubscribeSecret = process.env.MARKETING_UNSUBSCRIBE_SECRET || cronSecret
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kingdomfaithmarketplace.com"
  const fromEmail = process.env.RESEND_FROM_EMAIL
  if (!supabaseUrl || !serviceKey || !resendKey || !fromEmail || process.env.RESEND_DOMAIN_VERIFIED !== "true") {
    return NextResponse.json({ error: "Marketing email service is not configured with a verified sender." }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: subscribers, error } = await supabase
    .from("kfm_ride_marketing_subscribers")
    .select("email, customer_name")
    .eq("opted_in", true)
    .is("unsubscribed_at", null)
    .or(`last_marketing_sent_at.is.null,last_marketing_sent_at.lte.${cutoff}`)
    .limit(100)
  if (error) {
    console.error("KFM marketing subscriber lookup failed:", error)
    return NextResponse.json({ error: "Unable to load opted-in subscribers." }, { status: 500 })
  }

  let sent = 0
  let failed = 0
  for (const subscriber of subscribers || []) {
    const email = String(subscriber.email || "").toLowerCase()
    if (!email) continue
    const token = signEmail(email, unsubscribeSecret)
    const unsubscribeUrl = `${siteUrl}/api/marketing/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
    const firstName = String(subscriber.customer_name || "there").trim().split(/\\s+/)[0] || "there"
    const safeName = firstName.replace(/[&<>"]/g, "")
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#222"><h2 style="color:#e87524">KFM Transport</h2><p>Hello ${safeName},</p><p>Thank you for choosing Kingdom Faith Transport. Need a ride? KFM is ready to help you get where you are going safely and conveniently.</p><p><a href="${siteUrl}/#book" style="display:inline-block;background:#e87524;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">Book your next KFM ride</a></p><p>Thank you for being part of the KFM community.</p><hr/><p style="font-size:12px;color:#666">You receive this email because you opted in to KFM Transport offers. <a href="${unsubscribeUrl}">Unsubscribe</a> from future promotional emails.</p></div>`
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to: [email], subject: "Need a ride? KFM Transport is ready", html, headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` } }),
        cache: "no-store",
      })
      if (!response.ok) {
        console.error("KFM marketing email send failed:", email, await response.text())
        failed++
        continue
      }
      const { error: updateError } = await supabase.from("kfm_ride_marketing_subscribers")
        .update({ last_marketing_sent_at: new Date().toISOString() })
        .eq("email", email).eq("opted_in", true).is("unsubscribed_at", null)
      if (updateError) { console.error("KFM marketing send timestamp update failed:", email, updateError); failed++ }
      else sent++
    } catch (sendError) {
      console.error("KFM marketing email exception:", email, sendError)
      failed++
    }
  }
  return NextResponse.json({ success: true, eligible: subscribers?.length || 0, sent, failed })
}
