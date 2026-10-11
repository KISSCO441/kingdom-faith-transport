import { NextRequest, NextResponse } from "next/server";
import { requireKfmAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request);

  if (!auth.ok) return auth.response;

  try {
    const { data, error } = await auth.supabase
      .from("drivers")
      .select(`
        id,
        full_name,
        name,
        phone,
        email,
        vehicle_type,
        vehicle_name,
        vehicle_registration,
        vehicle_color,
        operating_town,
        operating_area,
        driver_license_number,
        national_id_number,
        nationalid_number,
        momo_number,
        momo_network,
        emergency_contact_name,
        emergency_contact_phone,
        status,
        availability,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("KFM admin drivers fetch error:", error);

      return NextResponse.json(
        { error: "Unable to load driver registrations." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      drivers: data ?? [],
    });
  } catch (error) {
    console.error("KFM admin drivers API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading drivers." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireKfmAdmin(request);

  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    const driverId =
      typeof body?.driverId === "string"
        ? body.driverId.trim()
        : "";

    const status = body?.status;

    if (
      !driverId ||
      !["VERIFIED", "REJECTED"].includes(status)
    ) {
      return NextResponse.json(
        { error: "A valid driver ID and status are required." },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("drivers")
      .update({ status })
      .eq("id", driverId)
      .select("id, status")
      .single();

    if (error || !data) {
      console.error("KFM admin driver update error:", error);

      return NextResponse.json(
        { error: "Unable to update the driver status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      driver: data,
    });
  } catch (error) {
    console.error("KFM admin driver update API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while updating the driver." },
      { status: 500 }
    );
  }
}
