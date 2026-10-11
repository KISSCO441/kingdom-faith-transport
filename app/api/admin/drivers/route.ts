
import { NextRequest, NextResponse } from "next/server";
import { requireKfmAdmin } from "@/lib/admin-auth";

const requiredDocuments = [
  "ghana_card_front",
  "ghana_card_back",
  "driver_license",
  "vehicle_registration",
  "insurance_certificate",
  "roadworthiness",
  "profile_photo",
];

export async function GET(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const driverId = new URL(request.url).searchParams.get("driverId");

    // Load documents for one selected driver.
    if (driverId !== null) {
      if (!driverId.trim()) {
        return NextResponse.json(
          { error: "A valid driver ID is required." },
          { status: 400 }
        );
      }

      const { data, error } = await auth.supabase
        .from("driver_documents")
        .select(`
          id,
          driver_id,
          document_type,
          document_number,
          document_url,
          issue_date,
          expiry_date,
          verification_status,
          created_at
        `)
        .eq("driver_id", driverId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("KFM admin documents fetch error:", error);
        return NextResponse.json(
          { error: "Unable to load driver documents." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        documents: data ?? [],
      });
    }

    // Load driver registrations.
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
    console.error("KFM admin drivers GET error:", error);

    return NextResponse.json(
      { error: "Unable to load KFM driver information." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const action = body?.action;

    // Verify or reject an individual document.
    if (action === "document-status") {
      const documentId =
        typeof body.documentId === "string"
          ? body.documentId.trim()
          : "";

      const status = body.status;

      if (
        !documentId ||
        !["Verified", "Rejected"].includes(status)
      ) {
        return NextResponse.json(
          { error: "A valid document ID and verification status are required." },
          { status: 400 }
        );
      }

      const { data, error } = await auth.supabase
        .from("driver_documents")
        .update({ verification_status: status })
        .eq("id", documentId)
        .select(`
          id,
          driver_id,
          document_type,
          document_number,
          document_url,
          issue_date,
          expiry_date,
          verification_status,
          created_at
        `)
        .maybeSingle();

      if (error || !data) {
        console.error("KFM document status update error:", error);
        return NextResponse.json(
          { error: "Unable to update this document." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        document: data,
      });
    }

    // Approve or reject a driver registration.
    if (action === "driver-status") {
      const driverId =
        typeof body.driverId === "string"
          ? body.driverId.trim()
          : "";

      const status = body.status;

      if (
        !driverId ||
        !["VERIFIED", "REJECTED"].includes(status)
      ) {
        return NextResponse.json(
          { error: "A valid driver ID and registration status are required." },
          { status: 400 }
        );
      }

      // Approval is blocked unless all seven required document types
      // exist and have the exact verification status "Verified".
      if (status === "VERIFIED") {
        const { data: docs, error: docsError } = await auth.supabase
          .from("driver_documents")
          .select("document_type, verification_status")
          .eq("driver_id", driverId);

        if (docsError) {
          console.error("KFM approval document check error:", docsError);
          return NextResponse.json(
            { error: "Unable to verify the driver's documents." },
            { status: 500 }
          );
        }

        const verifiedTypes = new Set(
          (docs ?? [])
            .filter((doc) => doc.verification_status === "Verified")
            .map((doc) => doc.document_type)
        );

        const missing = requiredDocuments.filter(
          (type) => !verifiedTypes.has(type)
        );

        if (missing.length > 0) {
          return NextResponse.json(
            {
              error:
                "Approval blocked. All seven required documents must be uploaded and verified first.",
              missingDocuments: missing,
            },
            { status: 400 }
          );
        }
      }

      const { data, error } = await auth.supabase
        .from("drivers")
        .update({ status })
        .eq("id", driverId)
        .select("id, status")
        .maybeSingle();

      if (error || !data) {
        console.error("KFM driver status update error:", error);
        return NextResponse.json(
          { error: "Unable to update this driver's registration." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        driver: data,
      });
    }

    return NextResponse.json(
      { error: "Unsupported administrator action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("KFM admin drivers PATCH error:", error);

    return NextResponse.json(
      { error: "Unable to update the requested KFM record." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireKfmAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    if (body?.action !== "view-document") {
      return NextResponse.json(
        { error: "Unsupported administrator action." },
        { status: 400 }
      );
    }

    const documentId =
      typeof body.documentId === "string"
        ? body.documentId.trim()
        : "";

    if (!documentId) {
      return NextResponse.json(
        { error: "A valid document ID is required." },
        { status: 400 }
      );
    }

    const { data: document, error: documentError } = await auth.supabase
      .from("driver_documents")
      .select("document_url")
      .eq("id", documentId)
      .maybeSingle();

    if (documentError || !document?.document_url) {
      return NextResponse.json(
        { error: "The requested document could not be found." },
        { status: 404 }
      );
    }

    const { data, error } = await auth.supabase.storage
      .from("driver-documents")
      .createSignedUrl(document.document_url, 300);

    if (error || !data?.signedUrl) {
      console.error("KFM signed document URL error:", error);
      return NextResponse.json(
        { error: "Unable to create a secure document viewing link." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
    });
  } catch (error) {
    console.error("KFM admin document viewing error:", error);

    return NextResponse.json(
      { error: "Unable to open this document." },
      { status: 500 }
    );
  }
}
