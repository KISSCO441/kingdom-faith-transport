"use client"

import { useEffect, useRef, useState } from "react"

type RideRouteMapProps = {
  pickupTown: string
  pickupArea: string
  destinationTown: string
  destinationArea: string
}

type Coordinates = { lat: number; lon: number }
type RouteSummary = { distanceKm: number; durationMinutes: number }

declare global {
  interface Window {
    L?: any
  }
}

let leafletPromise: Promise<any> | null = null

function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Map is only available in the browser."))
  }
  if (window.L) return Promise.resolve(window.L)
  if (leafletPromise) return leafletPromise

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-kfm-leaflet="true"]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      link.dataset.kfmLeaflet = "true"
      document.head.appendChild(link)
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-kfm-leaflet="true"]',
    )
    if (existingScript) {
      existingScript.addEventListener("load", () => window.L ? resolve(window.L) : reject(new Error("Map library did not load.")), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("Map library could not load.")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.async = true
    script.dataset.kfmLeaflet = "true"
    script.onload = () => window.L ? resolve(window.L) : reject(new Error("Map library did not load."))
    script.onerror = () => reject(new Error("Map library could not load."))
    document.body.appendChild(script)
  }).catch((error) => {
    leafletPromise = null
    throw error
  })

  return leafletPromise
}

async function geocodePlace(place: string): Promise<Coordinates | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", place)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "1")
  url.searchParams.set("countrycodes", "gh")

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  })
  if (!response.ok) throw new Error("The map search service is temporarily unavailable.")
  const results = (await response.json()) as Array<{ lat: string; lon: string }>
  if (!results.length) return null

  const lat = Number(results[0].lat)
  const lon = Number(results[0].lon)
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function RideRouteMap({
  pickupTown,
  pickupArea,
  destinationTown,
  destinationArea,
}: RideRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<RouteSummary | null>(null)
  const [message, setMessage] = useState("Choose your pickup and destination to preview the route.")
  const [mapError, setMapError] = useState("")

  useEffect(() => {
    let cancelled = false

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return
        const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([5.81, -0.35], 10)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)
        mapRef.current = map
        routeLayerRef.current = L.layerGroup().addTo(map)
        markersLayerRef.current = L.layerGroup().addTo(map)
        setMapReady(true)
        window.setTimeout(() => map.invalidateSize(), 100)
      })
      .catch(() => {
        if (!cancelled) setMapError("The map could not load right now. Please try again shortly.")
      })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      routeLayerRef.current = null
      markersLayerRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapRef.current || !routeLayerRef.current || !markersLayerRef.current) return

    let cancelled = false
    const pickupQuery = `${pickupArea}, ${pickupTown}, Ghana`
    const destinationQuery = `${destinationArea}, ${destinationTown}, Ghana`

    setLoading(true)
    setSummary(null)
    setMapError("")
    setMessage("Finding the route…")

    const timeout = window.setTimeout(async () => {
      try {
        const pickup = await geocodePlace(pickupQuery)
        if (cancelled) return
        await delay(1100)
        const destination = await geocodePlace(destinationQuery)
        if (cancelled) return

        if (!pickup || !destination) {
          setMessage("We couldn't find an exact map location for this selection. You can still request your ride.")
          return
        }

        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.lon},${pickup.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`
        const routeResponse = await fetch(routeUrl)
        if (!routeResponse.ok) throw new Error("The route service is temporarily unavailable.")
        const routeData = await routeResponse.json()
        const route = routeData.routes?.[0]
        if (!route || !route.geometry?.coordinates?.length) {
          setMessage("A road route is not available for these locations yet. You can still request your ride.")
          return
        }
        if (cancelled) return

        const L = window.L
        routeLayerRef.current.clearLayers()
        markersLayerRef.current.clearLayers()
        const line = L.geoJSON(route.geometry, {
          style: { color: "#f97316", weight: 5, opacity: 0.9 },
        }).addTo(routeLayerRef.current)

        L.circleMarker([pickup.lat, pickup.lon], {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: "#16a34a",
          fillOpacity: 1,
        }).bindPopup("Pickup").addTo(markersLayerRef.current)

        L.circleMarker([destination.lat, destination.lon], {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: "#dc2626",
          fillOpacity: 1,
        }).bindPopup("Destination").addTo(markersLayerRef.current)

        mapRef.current.fitBounds(line.getBounds(), { padding: [24, 24], maxZoom: 14 })
        setSummary({
          distanceKm: route.distance / 1000,
          durationMinutes: route.duration / 60,
        })
        setMessage("Route preview only. Distance and travel time are estimates.")
      } catch (error) {
        if (!cancelled) {
          setMessage("We couldn't calculate the route right now. You can still request your ride.")
          setMapError(error instanceof Error ? error.message : "Route preview is temporarily unavailable.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 700)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [mapReady, pickupTown, pickupArea, destinationTown, destinationArea])

  return (
    <section className="space-y-3 rounded-xl border border-border p-3" aria-label="Ride route preview">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Your route</p>
          <p className="text-xs text-muted-foreground">OpenStreetMap route preview</p>
        </div>
        {loading && <span className="text-xs text-muted-foreground" role="status">Calculating route…</span>}
      </div>

      <div
        ref={containerRef}
        className="h-64 w-full overflow-hidden rounded-lg bg-muted sm:h-72"
        aria-label="Map showing pickup, destination and driving route"
      />

      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Estimated distance</p>
            <p className="mt-1 text-lg font-bold">{summary.distanceKm.toFixed(1)} km</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Estimated drive</p>
            <p className="mt-1 text-lg font-bold">
              {Math.max(1, Math.round(summary.durationMinutes))} min
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground" aria-live="polite">{mapError || message}</p>
      <p className="text-xs text-muted-foreground">
        Estimates can differ from actual road conditions. KFM’s existing fare rules determine the ride fare.
      </p>
    </section>
  )
}
