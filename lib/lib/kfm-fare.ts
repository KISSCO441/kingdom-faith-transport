const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN

const CAR_RATE_PER_KM = 6
const CAR_MINIMUM_FARE = 25

type Coordinates = {
  longitude: number
  latitude: number
}

type MapboxGeocodingResponse = {
  features?: Array<{
    geometry?: {
      coordinates?: [number, number]
    }
  }>
}

type MapboxDirectionsResponse = {
  code?: string
  message?: string
  routes?: Array<{
    distance?: number
    duration?: number
  }>
}

function requireMapboxToken() {
  if (!MAPBOX_ACCESS_TOKEN) {
    throw new Error("MAPBOX_ACCESS_TOKEN is not configured.")
  }

  return MAPBOX_ACCESS_TOKEN
}

async function geocodeLocation(
  area: string | null | undefined,
  town: string | null | undefined,
): Promise<Coordinates> {
  const token = requireMapboxToken()

  const locationParts = [
    area?.trim(),
    town?.trim(),
    "Ghana",
  ].filter(Boolean)

  const searchText = locationParts.join(", ")

  const url =
    `https://api.mapbox.com/search/geocode/v6/forward` +
    `?q=${encodeURIComponent(searchText)}` +
    `&country=GH` +
    `&limit=1` +
    `&access_token=${encodeURIComponent(token)}`

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()

    throw new Error(
      `Mapbox geocoding failed (${response.status}): ${errorText}`,
    )
  }

  const data = (await response.json()) as MapboxGeocodingResponse

  const coordinates = data.features?.[0]?.geometry?.coordinates

  if (
    !coordinates ||
    coordinates.length < 2 ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1])
  ) {
    throw new Error(
      `Unable to locate "${searchText}". Please check the pickup or destination.`,
    )
  }

  return {
    longitude: coordinates[0],
    latitude: coordinates[1],
  }
}

async function getDrivingDistanceMeters(
  origin: Coordinates,
  destination: Coordinates,
): Promise<{
  distanceMeters: number
  durationSeconds: number | null
}> {
  const token = requireMapboxToken()

  const coordinates =
    `${origin.longitude},${origin.latitude};` +
    `${destination.longitude},${destination.latitude}`

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${coordinates}` +
    `?alternatives=false` +
    `&overview=false` +
    `&access_token=${encodeURIComponent(token)}`

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text()

    throw new Error(
      `Mapbox routing failed (${response.status}): ${errorText}`,
    )
  }

  const data = (await response.json()) as MapboxDirectionsResponse

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(
      data.message || "Mapbox could not calculate a driving route.",
    )
  }

  const route = data.routes[0]

  if (
    typeof route.distance !== "number" ||
    !Number.isFinite(route.distance)
  ) {
    throw new Error("Mapbox returned an invalid route distance.")
  }

  return {
    distanceMeters: route.distance,
    durationSeconds:
      typeof route.duration === "number"
        ? route.duration
        : null,
  }
}

export function calculateCarFare(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new Error("Invalid road distance.")
  }

  const billedKm = Math.ceil(distanceKm)

  return Math.max(
    CAR_MINIMUM_FARE,
    billedKm * CAR_RATE_PER_KM,
  )
}

export async function calculateCarFareFromLocations({
  pickupArea,
  pickupTown,
  destinationArea,
  destinationTown,
}: {
  pickupArea?: string | null
  pickupTown?: string | null
  destinationArea?: string | null
  destinationTown?: string | null
}) {
  if (!pickupTown || !destinationTown) {
    throw new Error(
      "Pickup town and destination town are required.",
    )
  }

  const origin = await geocodeLocation(
    pickupArea,
    pickupTown,
  )

  const destination = await geocodeLocation(
    destinationArea,
    destinationTown,
  )

  const route = await getDrivingDistanceMeters(
    origin,
    destination,
  )

  const distanceKm = route.distanceMeters / 1000

  const billedKm = Math.ceil(distanceKm)

  const fare = calculateCarFare(distanceKm)

  return {
    distanceKm,
    billedKm,
    fare,
    ratePerKm: CAR_RATE_PER_KM,
    minimumFare: CAR_MINIMUM_FARE,
    durationSeconds: route.durationSeconds,
  }
}
