import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BuyerSafetyNotice } from "@/components/classifieds/buyer-safety-notice"
import { ReportAdvertForm } from "@/components/classifieds/report-advert-form"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ id: string }> }

export default async function ClassifiedAdvertPage({ params }: Props) {
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) notFound()
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: advert, error } = await supabase
    .from("classified_ads")
    .select("id, title, description, asking_price, location, seller_contact_phone, image_urls, category, published_at")
    .eq("id", id)
    .eq("advert_status", "active")
    .maybeSingle()
  if (error || !advert) notFound()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <a href="/classifieds" className="text-sm font-semibold text-primary hover:underline">← Back to KFM Classifieds</a>
        <article className="mt-5 overflow-hidden rounded-2xl border bg-card">
          {advert.image_urls?.length ? (
            <div className="grid gap-2 p-3 sm:grid-cols-2">
              {advert.image_urls.map((image: string, index: number) => (
                <img key={index} src={image} alt={`${advert.title} photo ${index + 1}`} className="max-h-96 w-full rounded-xl object-cover" />
              ))}
            </div>
          ) : null}
          <div className="p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">KFM approved advert</p>
            <h1 className="mt-2 text-3xl font-extrabold">{advert.title}</h1>
            <p className="mt-3 text-2xl font-black text-primary">GH₵{Number(advert.asking_price).toFixed(2)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{advert.location}</p>
            <div className="mt-6 whitespace-pre-wrap text-sm leading-7">{advert.description}</div>
            <div className="mt-7 rounded-xl border p-4">
              <p className="text-sm font-semibold">Seller contact</p>
              <p className="mt-1 text-lg font-bold">{advert.seller_contact_phone}</p>
              <p className="mt-2 text-xs text-muted-foreground">Contact the seller only after reviewing the buyer safety notice below.</p>
              <a href={`tel:${advert.seller_contact_phone}`} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Call seller</a>
            </div>
          </div>
        </article>
        <div className="mt-6"><BuyerSafetyNotice /></div>
        <div className="mt-6"><ReportAdvertForm advertId={advert.id} /></div>
      </main>
      <SiteFooter />
    </div>
  )
}
