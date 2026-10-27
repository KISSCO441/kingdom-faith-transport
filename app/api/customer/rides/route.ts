import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || ""
    const match = authorization.match(/^Bearer\s+(.+)$/i)
    const accessToken = match?.[1]?.trim()

    if (!accessToken) {
      return NextResponse.json({ error: "Please sign in to view your ride history." }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
      console.error("KFM customer ride history is missing Supabase configuration.")
      return NextResponse.json({ error: "Customer accounts are not fully configured yet." }, { status: 503 })
    }

    // Ask Supabase Auth to validate the access token; never trust an email supplied by the browser.
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Your sign-in has expired. Please sign in again." }, { status: 401 })
    }

    const user = await userResponse.json()
    const verifiedEmail = typeof user.email === "string" ? user.email.trim().toLowerCase() : ""

    if (!verifiedEmail || user.email_confirmed_at == null) {
      return NextResponse.json({ error: "Please verify your email address before viewing ride history." }, { status: 403 })
    }

    const query = new URLSearchParams({
      select: "id,booking_code,created_at,vehicle_type,pickup_town,pickup_area,destination_town,destination_area,ride_status,fare_estimate,payment_method,payment_status,payment_paid_at",
      customer_email: `eq.${verifiedEmail}`,
      order: "created_at.desc",
      limit: "100",
    })

    const ridesResponse = await fetch(`${supabaseUrl}/rest/v1/ride_requests?${query.toString()}`, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    })

    if (!ridesResponse.ok) {
      console.error("KFM customer ride history query failed:", await ridesResponse.text())
      return NextResponse.json({ error: "Unable to load your ride history right now." }, { status: 500 })
    }

    const rides = await ridesResponse.json()
    return NextResponse.json({ success: true, email: verifiedEmail, rides: Array.isArray(rides) ? rides : [] }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    })
  } catch (error) {
    console.error("KFM customer ride history API error:", error)
    return NextResponse.json({ error: "Something went wrong while loading your ride history." }, { status: 500 })
  }
}
