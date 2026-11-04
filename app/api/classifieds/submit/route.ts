import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { getMarketAccount } from "@/lib/market-account-auth"

export const runtime = "nodejs"
const feeKeys: Record<string, string> = {
  cars_vehicles: "KFM_CLASSIFIED_FEE_CARS",
  appliances_electronics: "KFM_CLASSIFIED_FEE_APPLIANCES",
  furniture_household: "KFM_CLASSIFIED_FEE_FURNITURE",
  general_items: "KFM_CLASSIFIED_FEE_GENERAL",
}

export async function POST(request: NextRequest) {
  const { account, supabase } = await getMarketAccount(request)
  if (!account || !supabase) return NextResponse.json({ error: "Please verify your seller email and sign in first." }, { status: 401 })
  if (!["classified_seller", "vendor_and_seller"].includes(account.account_type)) return NextResponse.json({ error: "This account is not enabled for classified adverts." }, { status: 403 })

  try {
    const body = await request.json()
    const category = typeof body?.category === "string" ? body.category : ""
    const title = typeof body?.title === "string" ? body.title.trim() : ""
    const description = typeof body?.description === "string" ? body.description.trim() : ""
    const location = typeof body?.location === "string" ? body.location.trim() : ""
    const phone = typeof body?.phone === "string" ? body.phone.trim() : ""
    const askingPrice = Number(body?.askingPrice)
    const images = Array.isArray(body?.imageUrls) ? body.imageUrls : []
    if (!feeKeys[category] || !title || title.length > 140 || !description || description.length > 4000 ||
      !location || location.length > 180 || !phone || phone.length > 40 ||
      !Number.isFinite(askingPrice) || askingPrice <= 0 || askingPrice > 100000000 ||
      images.length > 5 || images.some((item: unknown) => typeof item !== "string" || item.length > 2000 || !/^https:\/\//i.test(item))) {
      return NextResponse.json({ error: "Check the advert details, category, price and photo links." }, { status: 400 })
    }

    const fee = Number(process.env[feeKeys[category]])
    if (!Number.isFinite(fee) || fee <= 0) return NextResponse.json({ error: "KFM is finalising the approved listing fee for this category. No advert has been submitted and no payment has been taken." }, { status: 503 })
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) return NextResponse.json({ error: "Classified payments are not configured yet." }, { status: 503 })

    const { data: advert, error: advertError } = await supabase.from("classified_ads").insert({
      seller_account_id: account.id, category, title, description,
      asking_price: Math.round(askingPrice * 100) / 100, location, seller_contact_phone: phone,
      image_urls: images, advert_status: "pending_payment",
    }).select("id").single()
    if (advertError || !advert) return NextResponse.json({ error: "Unable to save your advert details." }, { status: 503 })

    const reference = "KFM-CLS-" + randomBytes(12).toString("hex").toUpperCase()
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: "Bearer " + secretKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: account.email, amount: Math.round(fee * 100), currency: "GHS", reference,
        metadata: { kfm_payment_type: "classified_listing", kfm_advert_id: advert.id, kfm_seller_account_id: account.id, category },
      }),
      cache: "no-store",
    })
    const paystack = await paystackResponse.json()
    if (!paystackResponse.ok || !paystack.status || !paystack.data?.authorization_url) {
      await supabase.from("classified_ads").delete().eq("id", advert.id).eq("seller_account_id", account.id)
      return NextResponse.json({ error: paystack?.message || "Unable to start listing payment." }, { status: 502 })
    }

    const { error: paymentError } = await supabase.from("classified_ad_payments").insert({
      advert_id: advert.id, payment_reference: reference, amount: fee, currency: "GHS", payment_status: "pending",
    })
    if (paymentError) {
      await supabase.from("classified_ads").delete().eq("id", advert.id).eq("seller_account_id", account.id)
      return NextResponse.json({ error: "Unable to record listing payment. No checkout link was issued." }, { status: 503 })
    }
    return NextResponse.json({ success: true, advertId: advert.id, reference, amount: fee, paymentUrl: paystack.data.authorization_url }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Unable to process this advert submission." }, { status: 400 })
  }
}
