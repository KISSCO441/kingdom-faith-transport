"use client"

import { useState } from "react"

type VendorProduct = {
  id: string
  title: string
  description: string | null
  item_condition: string | null
  price: number
  image_urls: string[] | null
  vendor_name: string
  vendor_phone: string
  vendor_location: string
}

export function VendorProductCard({ product }: { product: VendorProduct }) {
  const [expanded, setExpanded] = useState(false)
  const photos = product.image_urls ?? []

  return (
    <article className="overflow-hidden rounded-2xl border bg-card">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`vendor-product-details-${product.id}`}
        onClick={() => setExpanded(value => !value)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        {photos.length ? (
          <div className="grid h-52 grid-cols-3 gap-1 bg-muted">
            {photos.slice(0, 3).map((image, index) => (
              <div key={index} className="relative min-w-0 overflow-hidden">
                <img src={image} alt={`${product.title} photo ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                {index === 2 && photos.length > 3 && <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-bold text-white">+{photos.length - 3}</span>}
              </div>
            ))}
          </div>
        ) : <div className="flex h-52 items-center justify-center bg-muted text-sm text-muted-foreground">No photo provided</div>}
        <div className="p-4">
          <h3 className="font-bold">{product.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{product.vendor_location}</p>
          <p className="mt-3 text-lg font-extrabold text-primary">GH₵{product.price.toFixed(2)}</p>
          <span className="mt-3 inline-block text-sm font-bold text-primary">{expanded ? "Hide details −" : "View details +"}</span>
        </div>
      </button>
      {expanded && (
        <div id={`vendor-product-details-${product.id}`} className="border-t p-4">
          {photos.length > 3 && <div className="mb-4 grid grid-cols-2 gap-2">{photos.slice(3).map((image, index) => <img key={index} src={image} alt={`${product.title} photo ${index + 4}`} className="h-40 w-full rounded-lg object-cover" loading="lazy" />)}</div>}
          {product.item_condition && <p className="text-sm font-semibold">Condition: {product.item_condition}</p>}
          {product.description && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{product.description}</p>}
          <p className="mt-3 text-sm">Seller: {product.vendor_name}</p>
          {product.vendor_phone && <p className="mt-2 text-sm font-semibold">Contact number: <span className="text-primary">{product.vendor_phone}</span></p>}
        </div>
      )}
    </article>
  )
}
