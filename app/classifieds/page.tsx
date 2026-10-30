import { createClient } from "@supabase/supabase-js"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BuyerSafetyNotice } from "@/components/classifieds/buyer-safety-notice"

export const dynamic = "force-dynamic"

const categories = [
  { id: "cars_vehicles", title: "Cars & Vehicles", description: "Cars, motorbikes and other vehicles" },
  { id: "appliances_electronics", title: "Home Appliances & Electronics", description: "Appliances, phones and electronics" },
  { id: "furniture_household", title: "Furniture & Household Items", description: "Furniture and useful household items" },
  { id: "general_items", title: "Other General Items", description: "Other goods offered by local sellers" },
]

type Advert = {
  id: string
  title: string
  description: string
  asking_price: number
  location: string
  image_urls: string[] | null
  category: string
}

async function getActiveAdverts(category?: string): Promise<Advert[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return []
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    let query = supabase
      .from("classified_ads")
      .select("id, title, description, asking_price, location, image_urls, category")
      .eq("advert_status", "active")
    if (category && categories.some((item) => item.id === category)) query = query.eq("category", category)
    const { data, error } = await query
      .order("published_at", { ascending: false })
      .limit(48)
    if (error) {
      console.error("KFM classified advert browse is unavailable:", error.message)
      return []
    }
    return (data ?? []) as Advert[]
  } catch {
    return []
  }
}

export default async function ClassifiedsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  const selectedCategory = categories.some((item) => item.id === category) ? category : undefined
  const adverts = await getActiveAdverts(selectedCategory)
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-950 px-5 py-9 text-white sm:px-9 sm:py-12">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">Kingdom Faith Marketplace</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">KFM Classifieds</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
            Discover cars, appliances, furniture and other items advertised by sellers.
            Contact sellers directly and make careful checks before you buy.
          </p>
          <a href="/market/account" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">
            Create a seller account
          </a>
        </section>

        <div className="mt-6">
          <BuyerSafetyNotice />
        </div>

        <section className="mt-10" aria-labelledby="classified-categories">
          <h2 id="classified-categories" className="text-2xl font-extrabold">Browse by category</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose the type of item you are looking for.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <a key={category.id} href={`/classifieds?category=${category.id}`} className="rounded-2xl border bg-card p-5 transition hover:border-primary hover:shadow-sm">
                <h3 className="font-bold">{category.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="classified-listings">
          <h2 id="classified-listings" className="text-2xl font-extrabold">{selectedCategory ? categories.find((item) => item.id === selectedCategory)?.title : "Latest approved adverts"}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3"><p className="text-sm text-muted-foreground">Only adverts approved by KFM are displayed here.</p>{selectedCategory && <a href="/classifieds" className="text-sm font-semibold text-primary underline">Show all categories</a>}</div>
          {adverts.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed p-8 text-center">
              <h3 className="font-bold">No approved adverts are available yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">New adverts will appear here after the seller has completed the required listing process and KFM has approved the submission.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {adverts.map((ad) => (
                <a key={ad.id} href={`/classifieds/${ad.id}`} className="overflow-hidden rounded-2xl border bg-card transition hover:border-primary hover:shadow-sm">
                  {ad.image_urls?.[0] ? (
                    // Advert images are seller-submitted URLs; render only standard image sources.
                    <img src={ad.image_urls[0]} alt={ad.title} className="h-52 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-muted text-sm text-muted-foreground">No photo provided</div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold">{ad.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{ad.location}</p>
                    <p className="mt-3 text-lg font-extrabold text-primary">GH₵{Number(ad.asking_price).toFixed(2)}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
