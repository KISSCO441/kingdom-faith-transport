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

type VendorProduct = {
  id: string
  title: string
  description: string | null
  category: string | null
  item_condition: string | null
  price: number
  image_urls: string[] | null
  vendor_name: string
  vendor_phone: string
  vendor_location: string
}

async function getApprovedVendorProducts(): Promise<VendorProduct[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return []
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await supabase
      .from("vendor_products")
      .select("id, title, description, category, item_condition, price, image_urls, market_vendors!inner(business_name, contact_phone, business_location, approval_status)")
      .eq("listing_status", "approved")
      .eq("market_vendors.approval_status", "approved")
      .gt("stock_quantity", 0)
      .order("created_at", { ascending: false })
      .limit(48)
    if (error) {
      console.error("KFM approved vendor products unavailable in classifieds:", error.message)
      return []
    }
    return (data ?? []).map((item: any) => {
      const vendor = Array.isArray(item.market_vendors) ? item.market_vendors[0] : item.market_vendors
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        item_condition: item.item_condition,
        price: Number(item.price),
        image_urls: item.image_urls ?? [],
        vendor_name: vendor?.business_name ?? "",
        vendor_phone: vendor?.contact_phone ?? "",
        vendor_location: vendor?.business_location ?? "",
      }
    }).filter((item: VendorProduct) => Number.isFinite(item.price) && item.price > 0)
  } catch {
    return []
  }
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
  const vendorProducts = selectedCategory
    ? (await getApprovedVendorProducts()).filter((item) => {
        const categoryText = `${item.category || ""} ${item.title || ""}`.toLowerCase()
        const has = (...terms: string[]) => terms.some((term) => categoryText.includes(term))
        let mappedCategory = "general_items"
        if (has("car", "cars", "vehicle", "vehicles", "motorbike", "motorcycle", "okada", "truck", "van", "automobile", "toyota", "yaris", "honda", "nissan", "hyundai", "kia", "mercedes", "benz", "bmw", "lexus", "suzuki", "mitsubishi", "ford")) mappedCategory = "cars_vehicles"
        else if (has("appliance", "appliances", "home appliance", "electronic", "electronics", "phone", "computer", "laptop", "television", " tv", "fridge", "refrigerator", "freezer", "deep freezer", "deep-freeze", "deepfreeze", "frizer", "freeza", "washing machine", "fan", "air conditioner", "speaker")) mappedCategory = "appliances_electronics"
        else if (has("furniture", "household", "sofa", "chair", "table", "bed", "wardrobe", "mattress", "cabinet", "kitchenware", "home decor")) mappedCategory = "furniture_household"
        return mappedCategory === selectedCategory
      })
    : []
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
          <a href={selectedCategory ? `/market/account?category=${selectedCategory}` : "/market/account"} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">
            Add your advert
          </a>
        </section>

        <div className="mt-6">
          <BuyerSafetyNotice />
        </div>

        <section className="mt-10" aria-labelledby="classified-categories">
          <h2 id="classified-categories" className="text-2xl font-extrabold">Browse by category</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose a category to browse approved listings from sellers. You can add your own advert from inside that category.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div key={category.id} className="rounded-2xl border bg-card p-5 transition hover:border-primary hover:shadow-sm">
                <a href={`/classifieds?category=${category.id}`} className="block">
                  <h3 className="font-bold">{category.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
                  <span className="mt-4 block text-sm font-bold text-primary">Browse listings →</span>
                </a>
                <a href={`/market/account?category=${category.id}`} className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-orange-500 px-3 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50">Add your advert</a>
              </div>
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
                  {ad.image_urls?.length ? (
                    <div className="grid h-52 grid-cols-3 gap-1 bg-muted">
                      {ad.image_urls.slice(0, 3).map((image, index) => (
                        <div key={index} className="relative min-w-0 overflow-hidden">
                          <img src={image} alt={`${ad.title} photo ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                          {index === 2 && ad.image_urls && ad.image_urls.length > 3 && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-bold text-white">+{ad.image_urls.length - 3}</span>
                          )}
                        </div>
                      ))}
                    </div>
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

        {selectedCategory && (
          <section className="mt-10" aria-labelledby="vendor-classified-listings">
            <h2 id="vendor-classified-listings" className="text-2xl font-extrabold">More approved vendor listings</h2>
            <p className="mt-2 text-sm text-muted-foreground">Approved products listed by registered KFM vendors. Contact sellers directly to arrange inspection and collection.</p>
            {vendorProducts.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No approved vendor products in this category yet.</p>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {vendorProducts.map((product) => (
                  <details key={product.id} className="group overflow-hidden rounded-2xl border bg-card">
                    <summary className="cursor-pointer list-none">
                      {product.image_urls?.length ? (
                        <div className="grid h-52 grid-cols-3 gap-1 bg-muted">
                          {product.image_urls.slice(0, 3).map((image, index) => (
                            <div key={index} className="relative min-w-0 overflow-hidden">
                              <img src={image} alt={`${product.title} photo ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                              {index === 2 && product.image_urls && product.image_urls.length > 3 && <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-bold text-white">+{product.image_urls.length - 3}</span>}
                            </div>
                          ))}
                        </div>
                      ) : <div className="flex h-52 items-center justify-center bg-muted text-sm text-muted-foreground">No photo provided</div>}
                      <div className="p-4">
                        <h3 className="font-bold">{product.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{product.vendor_location}</p>
                        <p className="mt-3 text-lg font-extrabold text-primary">GH₵{product.price.toFixed(2)}</p>
                        <span className="mt-3 inline-block text-sm font-bold text-primary group-open:hidden">View details +</span>
                        <span className="mt-3 hidden text-sm font-bold text-primary group-open:inline-block">Hide details −</span>
                      </div>
                    </summary>
                    <div className="border-t p-4">
                      {product.image_urls && product.image_urls.length > 3 && <div className="mb-4 grid grid-cols-2 gap-2">{product.image_urls.slice(3).map((image, index) => <img key={index} src={image} alt={`${product.title} photo ${index + 4}`} className="h-40 w-full rounded-lg object-cover" loading="lazy" />)}</div>}
                      {product.item_condition && <p className="text-sm font-semibold">Condition: {product.item_condition}</p>}
                      {product.description && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{product.description}</p>}
                      <p className="mt-3 text-sm">Seller: {product.vendor_name}</p>
                      {product.vendor_phone && <p className="mt-2 text-sm font-semibold">Contact number: <span className="text-primary">{product.vendor_phone}</span></p>}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>
        )}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
