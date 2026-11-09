import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "node:crypto"

export const runtime = "nodejs"

function signEmail(email: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(email.toLowerCase()).digest("hex")
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = (url.searchParams.get("email") || "").trim().toLowerCase()
  const token = url.searchParams.get("token") || ""
  const secret = process.env.MARKETING_UNSUBSCRIBE_SECRET || process.env.CRON_SECRET
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!email || !token || !secret || !supabaseUrl || !serviceKey || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    return new NextResponse("This unsubscribe link is invalid or expired.", { status: 400 })
  }
  const expected = Buffer.from(signEmail(email, secret), "hex")
  const received = Buffer.from(token, "hex")
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return new NextResponse("This unsubscribe link is invalid or expired.", { status: 400 })
  }
  const supabase = createClient(supabaseUrl, serviceKey)
  const { error } = await supabase.from("kfm_ride_marketing_subscribers")
    .update({ opted_in: false, unsubscribed_at: new Date().toISOString() }).eq("email", email)
  if (error) {
    console.error("KFM marketing unsubscribe failed:", error)
    return new NextResponse("We could not process your request. Please contact KFM.", { status: 500 })
  }
  return new NextResponse("You have been unsubscribed from KFM Transport promotional emails.", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  })
}
