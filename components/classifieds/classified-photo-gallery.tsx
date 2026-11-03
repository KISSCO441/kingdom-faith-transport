"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

export function ClassifiedPhotoGallery({ title, photos }: { title: string; photos: string[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const active = activeIndex === null ? null : photos[activeIndex]

  useEffect(() => {
    if (activeIndex === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null)
      if (event.key === "ArrowRight") setActiveIndex(index => index === null ? null : (index + 1) % photos.length)
      if (event.key === "ArrowLeft") setActiveIndex(index => index === null ? null : (index - 1 + photos.length) % photos.length)
    }
    window.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [activeIndex, photos.length])

  const previous = () => setActiveIndex(index => index === null ? null : (index - 1 + photos.length) % photos.length)
  const next = () => setActiveIndex(index => index === null ? null : (index + 1) % photos.length)

  return (
    <>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-2">
        {photos.map((photo, index) => (
          <button key={photo + index} type="button" onClick={() => setActiveIndex(index)}
            aria-label={`Enlarge photo ${index + 1} of ${photos.length}`}
            className="group relative min-h-36 overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-52">
            <img src={photo} alt={`${title} photo ${index + 1}`} loading="lazy"
              className="h-40 w-full object-cover transition-transform duration-200 group-hover:scale-105 sm:h-64" />
            <span className="absolute bottom-2 right-2 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">Tap to enlarge</span>
          </button>
        ))}
      </div>
      {active && (
        <div role="dialog" aria-modal="true" aria-label={`${title} photo viewer`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-6"
          onClick={() => setActiveIndex(null)}>
          <button type="button" aria-label="Close photo viewer" onClick={() => setActiveIndex(null)}
            className="absolute right-3 top-3 z-20 rounded-full bg-white/15 p-3 text-white hover:bg-white/25">
            <X className="h-6 w-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button type="button" aria-label="Previous photo" onClick={event => { event.stopPropagation(); previous() }}
                className="absolute left-2 z-20 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 sm:left-5">
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button type="button" aria-label="Next photo" onClick={event => { event.stopPropagation(); next() }}
                className="absolute right-2 z-20 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 sm:right-5">
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
          <img src={active} alt={`${title} photo ${(activeIndex ?? 0) + 1}`}
            onClick={event => event.stopPropagation()}
            className="max-h-[82vh] max-w-[92vw] rounded-lg object-contain" />
          <p className="absolute bottom-4 left-0 right-0 text-center text-sm font-medium text-white">
            Photo {(activeIndex ?? 0) + 1} of {photos.length}
          </p>
        </div>
      )}
    </>
  )
}
