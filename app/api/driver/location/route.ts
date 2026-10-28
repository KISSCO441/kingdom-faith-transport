import { NextResponse } from "next/server";

const activeStatuses = ["accepted", "arrived", "in_progress"];

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !serviceKey || !publishableKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured." },
        { status: 500 },
      );
    }

    const authorization = request.headers.get("authorization") || "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    const accessToken = match?.[1]?.trim();

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!authResponse.ok) {
      return NextResponse.json({ error: "Your session is invalid or expired." }, { status: 401 });
    }

    const user = await authResponse.json();
    if (!user?.id) {
      return NextResponse.json({ error: "Unable to verify your account." }, { status: 401 });
    }

    const body = await request.json();
    const rideId = String(body?.ride_id ?? "").trim();
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);
    const accuracy = body?.accuracy_m == null ? null : Number(body.accuracy_m);

    if (
      !rideId ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0))
    ) {
      return NextResponse.json({ error: "Valid GPS coordinates are required." }, { status: 400 });
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    // Driver dashboard currently associates the driver's row ID with auth.uid().
    // Also support user_id for accounts whose driver row uses a separate ID.
    const driverResponse = await fetch(
      `${supabaseUrl}/rest/v1/drivers?or=(id.eq.${encodeURIComponent(user.id)},user_id.eq.${encodeURIComponent(user.id)})&select=id,status,availability&limit=1`,
      { headers, cache: "no-store" },
    );

    if (!driverResponse.ok) {
      console.error("KFM GPS driver lookup failed:", await driverResponse.text());
      return NextResponse.json({ error: "Unable to verify your driver profile." }, { status: 500 });
    }

    const drivers = await driverResponse.json();
    const driver = drivers?.[0];

    if (!driver || driver.status !== "VERIFIED") {
      return NextResponse.json({ error: "Only verified drivers can share live location." }, { status: 403 });
    }

    if (!["ONLINE", "BUSY"].includes(String(driver.availability || "").toUpperCase())) {
      return NextResponse.json({ error: "Go online before sharing your location." }, { status: 403 });
    }

    const activeRideResponse = await fetch(
      `${supabaseUrl}/rest/v1/ride_requests?id=eq.${encodeURIComponent(rideId)}&driver_id=eq.${encodeURIComponent(driver.id)}&ride_status=in.(${activeStatuses.join(",")})&select=id&limit=1`,
      { headers, cache: "no-store" },
    );

    if (!activeRideResponse.ok) {
      console.error("KFM GPS active ride check failed:", await activeRideResponse.text());
      return NextResponse.json({ error: "Unable to verify your active ride." }, { status: 500 });
    }

    const activeRides = await activeRideResponse.json();
    if (!Array.isArray(activeRides) || activeRides.length === 0) {
      return NextResponse.json({ error: "Live location is available only during an active assigned ride." }, { status: 403 });
    }

    const activeRideId = activeRides[0].id;

    const saveResponse = await fetch(
      `${supabaseUrl}/rest/v1/driver_locations?on_conflict=driver_id`,
      {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          driver_id: driver.id,
          ride_id: activeRideId,
          latitude,
          longitude,
          accuracy_m: accuracy,
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      },
    );

    if (!saveResponse.ok) {
      console.error("KFM GPS save failed:", await saveResponse.text());
      return NextResponse.json({ error: "Unable to save your live location." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("KFM driver location API error:", error);
    return NextResponse.json({ error: "Unable to update live location." }, { status: 500 });
  }
}
