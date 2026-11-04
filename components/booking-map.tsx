"use client"

import { useEffect, useRef, useState } from "react"
import { LocateFixed, MapPin } from "lucide-react"

type BookingMapProps = {
  pickupTown: string
  pickupArea: string
  destinationTown: string
  destinationArea: string
}

type MapboxMap = {
  on: (event: string, callback: () => void) => void
  addControl: (control: unknown, position?: string) => void
  addSource: (id: string, source: unknown) => void
  getSource: (id: string) => { setData: (data: unknown) => void } | undefined
  addLayer: (layer: unknown) => void
  fitBounds: (bounds: unknown, options?: unknown) => void
  flyTo: (options: unknown) => void
  remove: () => void
}

type MapboxMarker = {
  setLngLat: (coordinates: [number, number]) => MapboxMarker
  addTo: (map: MapboxMap) => MapboxMarker
  remove: () => void
}

type MapboxApi = {
  accessToken: string
  Map: new (options: unknown) => MapboxMap
  Marker: new (options?: unknown) => MapboxMarker
  NavigationControl: new () => unknown
}

declare global {
  interface Window {
    mapboxgl?: MapboxApi
  }
}

let mapboxLoader: Promise<MapboxApi> | null = null

function loadMapbox(): Promise<MapboxApi> {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl)
  if (mapboxLoader) return mapboxLoader

  mapboxLoader = new Promise((resolve, reject) => {
    const stylesheetUrl = "https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl.css"
    if (!document.querySelector('link[data-kfm-mapbox="true"]')) {
      const stylesheet = document.createElement("link")
      stylesheet.rel = "stylesheet"
      stylesheet.href = stylesheetUrl
      stylesheet.dataset.kfmMapbox = "true"
      document.head.appendChild(stylesheet)
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-kfm-mapbox="true"]')
    if (existingScript) {
      existingScript.addEventListener("load", () => window.mapboxgl && resolve(window.mapboxgl), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("Mapbox could not be loaded.")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl.js"
    script.async = true
    script.dataset.kfmMapbox = "true"
    script.onload = () => {
      if (window.mapboxgl) resolve(window.mapboxgl)
      else reject(new Error("Mapbox loaded without its map library."))
    }
    script.onerror = () => reject(new Error("Mapbox could not be loaded. Please check your connection."))
    document.head.appendChild(script)
  }).catch((error) => {
    mapboxLoader = null
    throw error
  })

  return mapboxLoader
}

async function geocodePlace(place: string, token: string): Promise<[number, number] | null> {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json`)
  url.searchParams.set("country", "GH")
  url.searchParams.set("limit", "1")
  url.searchParams.set("access_token", token)
  const response = await fetch(url.toString())
  if (!response.ok) throw new Error("Mapbox could not find the selected location.")
  const data = await response.json()
  const center = data.features?.[0]?.center
  return Array.isArray(center) && center.length === 2 ? [center[0], center[1]] : null
}

export function BookingMap({
  pickupTown,
  pickupArea,
  destinationTown,
  destinationArea,
}: BookingMapProps) {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const markersRef = useRef<MapboxMarker[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [status, setStatus] = useState("Preparing your route preview…")
  const [mapError, setMapError] = useState("")
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  useEffect(() => {
    if (!token || !mapElement.current) return
    let cancelled = false

    loadMapbox()
      .then((mapbox) => {
        if (cancelled || !mapElement.current) return
        mapbox.accessToken = token
        const map = new mapbox.Map({
          container: mapElement.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [-0.576, 5.808],
          zoom: 10,
          attributionControl: true,
        })
        mapRef.current = map
        map.addControl(new mapbox.NavigationControl(), "top-right")
        map.on("load", () => {
          if (cancelled) return
          map.addSource("kfm-booking-route", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          })
          map.addLayer({
            id: "kfm-booking-route-line",
            type: "line",
            source: "kfm-booking-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#f97316", "line-width": 5, "line-opacity": 0.9 },
          })
          setMapReady(true)
        })
      })
      .catch((error: unknown) => {
        if (!cancelled) setMapError(error instanceof Error ? error.message : "The map could not be loaded.")
      })

    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [token])

  useEffect(() => {
    if (!mapReady || !mapRef.current || !token) return
    let cancelled = false

    async function updateRoute() {
      setStatus("Locating pickup and destination…")
      setMapError("")
      try {
        const pickupLabel = `${pickupArea}, ${pickupTown}, Ghana`
        const destinationLabel = `${destinationArea}, ${destinationTown}, Ghana`
        const [pickup, destination] = await Promise.all([
          geocodePlace(pickupLabel, token),
          geocodePlace(destinationLabel, token),
        ])
        if (cancelled || !mapRef.current) return
        if (!pickup || !destination) {
          setStatus("The selected areas could not both be located. The map is ready; try choosing a nearby named area.")
          return
        }

        markersRef.current.forEach((marker) => marker.remove())
        const mapbox = window.mapboxgl
        if (!mapbox) return
        markersRef.current = [
          new mapbox.Marker({ color: "#16a34a" }).setLngLat(pickup).addTo(mapRef.current),
          new mapbox.Marker({ color: "#f97316" }).setLngLat(destination).addTo(mapRef.current),
        ]

        const directionsUrl = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.join(",")};${destination.join(",")}`)
        directionsUrl.searchParams.set("geometries", "geojson")
        directionsUrl.searchParams.set("overview", "full")
        directionsUrl.searchParams.set("access_token", token)
        const directionsResponse = await fetch(directionsUrl.toString())
        if (!directionsResponse.ok) throw new Error("The driving route could not be loaded.")
        const directions = await directionsResponse.json()
        if (cancelled || !mapRef.current) return
        const route = directions.routes?.[0]?.geometry
        if (route) {
          mapRef.current.getSource("kfm-booking-route")?.setData({
            type: "Feature",
            properties: {},
            geometry: route,
          })
        }
        const bounds = {
          _sw: { lng: Math.min(pickup[0], destination[0]), lat: Math.min(pickup[1], destination[1]) },
          _ne: { lng: Math.max(pickup[0], destination[0]), lat: Math.max(pickup[1], destination[1]) },
        }
        mapRef.current.fitBounds(bounds, { padding: 56, maxZoom: 13, duration: 700 })
        setStatus(route ? "Route preview · Green marker: pickup · Orange marker: destination" : "Pickup and destination located. A driving route is not available for this pair.")
      } catch (error) {
        if (!cancelled) setMapError(error instanceof Error ? error.message : "Unable to update the route preview.")
      }
    }

    void updateRoute()
    return () => {
      cancelled = true
    }
  }, [mapReady, token, pickupTown, pickupArea, destinationTown, destinationArea])

  function locateMe() {
    if (!navigator.geolocation || !mapRef.current || !window.mapboxgl) {
      setMapError("Your browser does not support location sharing.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: [number, number] = [position.coords.longitude, position.coords.latitude]
        mapRef.current?.flyTo({ center: coordinates, zoom: 15, essential: true })
        const marker = new window.mapboxgl!.Marker({ color: "#2563eb" }).setLngLat(coordinates).addTo(mapRef.current!)
        markersRef.current.push(marker)
        setStatus("Your current GPS position is shown in blue. This does not change the pickup details in the booking form.")
      },
      () => setMapError("Location permission was not granted. You can still use the selected pickup and destination."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 },
    )
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        The interactive map is waiting for its public Mapbox token. Your ride booking form is still available.
      </div>
    )
  }

  return (
    <section className="space-y-3" aria-label="Interactive ride route map">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Your ride map</p>
          <p className="text-xs text-muted-foreground">Live map preview of the selected journey</p>
        </div>
        <button
          type="button"
          onClick={locateMe}
          className="inline-flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-xs font-semibold hover:border-primary"
        >
          <LocateFixed className="h-4 w-4" />
          Locate me
        </button>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-border">
        <div ref={mapElement} className="h-[280px] w-full sm:h-[340px]" />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-green-600" /> Pickup: {pickupArea}, {pickupTown}</span>
        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-orange-500" /> Destination: {destinationArea}, {destinationTown}</span>
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">{mapError || status}</p>
    </section>
  )
}
