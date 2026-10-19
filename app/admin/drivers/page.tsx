"use client";
import AdminAccessGuard from "@/components/admin/AdminAccessGuard";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Car,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  RefreshCw,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { supabase as supabaseClient } from "@/lib/supabase";

if (!supabaseClient) {
  throw new Error("Supabase client is not configured.");
}

const supabase = supabaseClient;

type Driver = {
  id: string;
  full_name: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  vehicle_type: string | null;
  vehicle_name: string | null;
  vehicle_registration: string | null;
  vehicle_color: string | null;
  operating_town: string | null;
  operating_area: string | null;
  driver_license_number: string | null;
  national_id_number: string | null;
  nationalid_number: string | null;
  momo_number: string | null;
  momo_network: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  status: string | null;
  availability: string | null;
  created_at: string;
};

type DriverDocument = {
  id: string;
  driver_id: string;
  document_type: string;
  document_number: string | null;
  document_url: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  verification_status: string | null;
  created_at: string;
};

const requiredDocuments = [
  { type: "ghana_card_front", label: "Ghana Card Front" },
  { type: "ghana_card_back", label: "Ghana Card Back" },
  { type: "driver_license", label: "Driver's Licence" },
  { type: "vehicle_registration", label: "Vehicle Registration" },
  { type: "insurance_certificate", label: "Insurance Certificate" },
  { type: "roadworthiness", label: "Roadworthiness / DVLA" },
  { type: "profile_photo", label: "Driver Profile Photo" },
];

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status: string | null) {
  const normalized = status?.toLowerCase();

  if (normalized === "verified") {
    return "border-green-200 bg-green-100 text-green-800";
  }

  if (normalized === "rejected") {
    return "border-red-200 bg-red-100 text-red-800";
  }

  return "border-yellow-200 bg-yellow-100 text-yellow-800";
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words font-medium text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [updatingDriver, setUpdatingDriver] = useState(false);
  const [updatingDocument, setUpdatingDocument] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function getAdminToken(): Promise<string | null> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      setError(
        "Administrator sign-in required. Please sign in at /admin/login."
      );
      return null;
    }

    return session.access_token;
  }

  async function loadDrivers() {
    setLoading(true);
    setError("");

    try {
      const token = await getAdminToken();
      if (!token) {
        setDrivers([]);
        return;
      }

      const response = await fetch("/api/admin/drivers", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDrivers([]);
        setError(result.error || "Unable to load driver registrations.");
        return;
      }

      setDrivers(Array.isArray(result.drivers) ? result.drivers : []);
    } catch {
      setDrivers([]);
      setError("Unable to load drivers. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDriverDocuments(driverId: string) {
    setLoadingDocuments(true);
    setError("");

    try {
      const token = await getAdminToken();
      if (!token) {
        setDocuments([]);
        return;
      }

      const response = await fetch(
        `/api/admin/drivers?driverId=${encodeURIComponent(driverId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDocuments([]);
        setError(result.error || "Unable to load driver documents.");
        return;
      }

      setDocuments(
        Array.isArray(result.documents) ? result.documents : []
      );
    } catch {
      setDocuments([]);
      setError("Unable to load documents. Please try again.");
    } finally {
      setLoadingDocuments(false);
    }
  }

  async function selectDriver(driver: Driver) {
    setSelectedDriver(driver);
    setSuccess("");
    setError("");
    setDocuments([]);

    await loadDriverDocuments(driver.id);
  }

  async function updateDocumentStatus(
    documentId: string,
    status: "Verified" | "Rejected"
  ) {
    setUpdatingDocument(documentId);
    setError("");
    setSuccess("");

    try {
      const token = await getAdminToken();
      if (!token) return;

      const response = await fetch("/api/admin/drivers", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "document-status",
          documentId,
          status,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error || "Unable to update this document.");
        return;
      }

      if (result.document) {
        setDocuments((current) =>
          current.map((document) =>
            document.id === documentId ? result.document : document
          )
        );
      }

      setSuccess(
        status === "Verified"
          ? "Document verified successfully."
          : "Document rejected. The driver may need to replace it."
      );
    } catch {
      setError("Unable to update the document. Please try again.");
    } finally {
      setUpdatingDocument(null);
    }
  }

  async function viewDocument(document: DriverDocument) {
    if (!document.document_url) {
      setError("No document file is available.");
      return;
    }

    // Open a window immediately to reduce the chance that the browser
    // blocks it while the secure link is being requested.
    const previewWindow = window.open("about:blank", "_blank");

    if (!previewWindow) {
      setError("Please allow pop-ups to view driver documents.");
      return;
    }

    previewWindow.opener = null;
    setError("");

    try {
      const token = await getAdminToken();

      if (!token) {
        previewWindow.close();
        return;
      }

      const response = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "view-document",
          documentId: document.id,
        }),
        cache: "no-store",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.signedUrl) {
        previewWindow.close();
        setError(result.error || "Unable to open this document.");
        return;
      }

      previewWindow.location.href = result.signedUrl;
    } catch {
      previewWindow.close();
      setError("Unable to open the document. Please try again.");
    }
  }

  async function updateDriverStatus(status: "VERIFIED" | "REJECTED") {
    if (!selectedDriver) return;

    if (status === "REJECTED") {
      const confirmed = window.confirm(
        "Reject this driver's registration? The driver may need to correct or replace the submitted information or documents."
      );

      if (!confirmed) return;
    }

    setUpdatingDriver(true);
    setError("");
    setSuccess("");

    try {
      const token = await getAdminToken();
      if (!token) return;

      const response = await fetch("/api/admin/drivers", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "driver-status",
          driverId: selectedDriver.id,
          status,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error || "Unable to update driver registration.");
        return;
      }

      const updatedDriver: Driver = {
        ...selectedDriver,
        status: result.driver?.status || status,
      };

      setSelectedDriver(updatedDriver);

      setDrivers((current) =>
        current.map((driver) =>
          driver.id === updatedDriver.id ? updatedDriver : driver
        )
      );

      setSuccess(
        status === "VERIFIED"
          ? "Driver approved successfully. KFM has verified the registration."
          : "Driver registration has been rejected."
      );
    } catch {
      setError("Unable to update the driver. Please try again.");
    } finally {
      setUpdatingDriver(false);
    }
  }

  function getDocument(type: string) {
    if (!selectedDriver) return undefined;

    return documents.find(
      (document) =>
        document.driver_id === selectedDriver.id &&
        document.document_type === type
    );
  }

  function allDocumentsUploaded() {
    return requiredDocuments.every((required) =>
      Boolean(getDocument(required.type))
    );
  }

  function allDocumentsVerified() {
    return requiredDocuments.every(
      (required) =>
        getDocument(required.type)?.verification_status === "Verified"
    );
  }

  useEffect(() => {
    void loadDrivers();
  }, []);

  const pendingDrivers = drivers.filter(
    (driver) => driver.status === "PENDING" || !driver.status
  );

  const verifiedDrivers = drivers.filter(
    (driver) => driver.status === "VERIFIED"
  );

  const rejectedDrivers = drivers.filter(
    (driver) => driver.status === "REJECTED"
  );

  return (
   <AdminAccessGuard>
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-7 w-7" />
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  KFM Administration
                </span>
              </div>

              <h1 className="text-3xl font-bold">
                Driver Verification Dashboard
              </h1>

              <p className="mt-2 text-slate-300">
                Review registrations and verify the required documents.
              </p>
            </div>

            <button
              onClick={() => void loadDrivers()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
              {error.includes("Administrator sign-in required") && (
                <a
                  href="/admin/login"
                  className="mt-2 inline-block font-semibold underline"
                >
                  Go to administrator sign in
                </a>
              )}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Success</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Drivers",
              count: drivers.length,
              icon: User,
              style: "bg-slate-100 text-slate-700",
            },
            {
              label: "Pending Review",
              count: pendingDrivers.length,
              icon: Clock3,
              style: "bg-yellow-100 text-yellow-700",
            },
            {
              label: "Verified",
              count: verifiedDrivers.length,
              icon: CheckCircle2,
              style: "bg-green-100 text-green-700",
            },
            {
              label: "Rejected",
              count: rejectedDrivers.length,
              icon: XCircle,
              style: "bg-red-100 text-red-700",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {item.count}
                    </p>
                  </div>

                  <div className={`rounded-xl p-3 ${item.style}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Driver Applications
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a driver to review the registration.
              </p>
            </div>

            <div className="max-h-[720px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin" />
                  Loading drivers...
                </div>
              ) : drivers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No driver registrations found.
                </div>
              ) : (
                <div className="divide-y">
                  {drivers.map((driver) => {
                    const name =
                      driver.full_name || driver.name || "Unnamed Driver";

                    return (
                      <button
                        key={driver.id}
                        onClick={() => void selectDriver(driver)}
                        className={`w-full p-5 text-left transition ${
                          selectedDriver?.id === driver.id
                            ? "bg-slate-100"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {name}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {driver.phone || "No phone"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Registered {formatDate(driver.created_at)}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                              driver.status
                            )}`}
                          >
                            {driver.status || "PENDING"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border bg-white shadow-sm">
            {!selectedDriver ? (
              <div className="flex min-h-[400px] items-center justify-center p-8 text-center">
                <div>
                  <User className="mx-auto h-12 w-12 text-slate-300" />
                  <h2 className="mt-4 text-xl font-bold text-slate-700">
                    Select a Driver
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Choose an application from the list to review details and
                    submitted documents.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b bg-slate-50 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {selectedDriver.full_name ||
                          selectedDriver.name ||
                          "Unnamed Driver"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Registered {formatDate(selectedDriver.created_at)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${statusClass(
                        selectedDriver.status
                      )}`}
                    >
                      {selectedDriver.status || "PENDING"}
                    </span>
                  </div>
                </div>

                <div className="space-y-8 p-6">
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-bold text-slate-900">
                        Personal Information
                      </h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <InfoItem
                        label="Full Name"
                        value={
                          selectedDriver.full_name ||
                          selectedDriver.name
                        }
                      />
                      <InfoItem label="Phone" value={selectedDriver.phone} />
                      <InfoItem label="Email" value={selectedDriver.email} />
                      <InfoItem
                        label="National ID"
                        value={
                          selectedDriver.national_id_number ||
                          selectedDriver.nationalid_number
                        }
                      />
                      <InfoItem
                        label="MoMo Number"
                        value={selectedDriver.momo_number}
                      />
                      <InfoItem
                        label="MoMo Network"
                        value={selectedDriver.momo_network}
                      />
                      <InfoItem
                        label="Emergency Contact"
                        value={selectedDriver.emergency_contact_name}
                      />
                      <InfoItem
                        label="Emergency Phone"
                        value={selectedDriver.emergency_contact_phone}
                      />
                    </div>
                  </section>

                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <Car className="h-5 w-5 text-slate-600" />
                      <h3 className="text-lg font-bold text-slate-900">
                        Vehicle Information
                      </h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <InfoItem
                        label="Vehicle Type"
                        value={selectedDriver.vehicle_type}
                      />
                      <InfoItem
                        label="Vehicle Name"
                        value={selectedDriver.vehicle_name}
                      />
                      <InfoItem
                        label="Registration Number"
                        value={selectedDriver.vehicle_registration}
                      />
                      <InfoItem
                        label="Vehicle Colour"
                        value={selectedDriver.vehicle_color}
                      />
                      <InfoItem
                        label="Operating Town"
                        value={selectedDriver.operating_town}
                      />
                      <InfoItem
                        label="Operating Area"
                        value={selectedDriver.operating_area}
                      />
                      <InfoItem
                        label="Driver's Licence Number"
                        value={selectedDriver.driver_license_number}
                      />
                      <InfoItem
                        label="Availability"
                        value={selectedDriver.availability}
                      />
                    </div>
                  </section>

                  <section>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-600" />
                        <h3 className="text-lg font-bold text-slate-900">
                          Document Verification
                        </h3>
                      </div>

                      <button
                        onClick={() =>
                          void loadDriverDocuments(selectedDriver.id)
                        }
                        disabled={loadingDocuments}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${
                            loadingDocuments ? "animate-spin" : ""
                          }`}
                        />
                        Refresh Documents
                      </button>
                    </div>

                    {loadingDocuments ? (
                      <div className="rounded-xl border bg-slate-50 p-8 text-center text-slate-500">
                        <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin" />
                        Loading documents...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {requiredDocuments.map((required) => {
                          const document = getDocument(required.type);

                          return (
                            <div
                              key={required.type}
                              className="rounded-xl border p-4"
                            >
                              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-semibold text-slate-900">
                                      {required.label}
                                    </h4>

                                    <span
                                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(
                                        document?.verification_status || null
                                      )}`}
                                    >
                                      {document
                                        ? document.verification_status ||
                                          "Pending Verification"
                                        : "Not Uploaded"}
                                    </span>
                                  </div>

                                  {document && (
                                    <div className="mt-2 space-y-1 text-sm text-slate-500">
                                      {document.document_number && (
                                        <p>
                                          <strong>Number:</strong>{" "}
                                          {document.document_number}
                                        </p>
                                      )}
                                      {document.issue_date && (
                                        <p>
                                          <strong>Issued:</strong>{" "}
                                          {formatDate(document.issue_date)}
                                        </p>
                                      )}
                                      {document.expiry_date && (
                                        <p>
                                          <strong>Expires:</strong>{" "}
                                          {formatDate(document.expiry_date)}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {document && (
                                  <div className="flex shrink-0 flex-wrap gap-2">
                                    {document.document_url && (
                                      <button
                                        onClick={() =>
                                          void viewDocument(document)
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        <Eye className="h-4 w-4" />
                                        View
                                      </button>
                                    )}

                                    <button
                                      onClick={() =>
                                        void updateDocumentStatus(
                                          document.id,
                                          "Verified"
                                        )
                                      }
                                      disabled={
                                        updatingDocument === document.id ||
                                        document.verification_status ===
                                          "Verified"
                                      }
                                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      Verify
                                    </button>

                                    <button
                                      onClick={() =>
                                        void updateDocumentStatus(
                                          document.id,
                                          "Rejected"
                                        )
                                      }
                                      disabled={
                                        updatingDocument === document.id
                                      }
                                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section className="rounded-xl border bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-900">
                      Verification Summary
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <InfoItem
                        label="Required Documents"
                        value="7"
                      />
                      <InfoItem
                        label="Documents Uploaded"
                        value={`${requiredDocuments.filter((item) =>
                          getDocument(item.type)
                        ).length}/7`}
                      />
                      <InfoItem
                        label="Documents Verified"
                        value={`${requiredDocuments.filter(
                          (item) =>
                            getDocument(item.type)?.verification_status ===
                            "Verified"
                        ).length}/7`}
                      />
                      <InfoItem
                        label="Registration Status"
                        value={selectedDriver.status || "PENDING"}
                      />
                    </div>

                    {!allDocumentsUploaded() && (
                      <p className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                        The driver has not uploaded all seven required
                        documents.
                      </p>
                    )}

                    {allDocumentsUploaded() && !allDocumentsVerified() && (
                      <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                        All seven documents have been uploaded, but one or
                        more still require verification.
                      </p>
                    )}

                    {allDocumentsVerified() && (
                      <p className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                        All seven required documents are verified.
                      </p>
                    )}
                  </section>

                  <section className="border-t pt-6">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                      KFM Registration Decision
                    </h3>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() =>
                          void updateDriverStatus("VERIFIED")
                        }
                        disabled={
                          updatingDriver ||
                          !allDocumentsUploaded() ||
                          !allDocumentsVerified() ||
                          selectedDriver.status === "VERIFIED"
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        {updatingDriver ? "Processing..." : "Approve Driver"}
                      </button>

                      <button
                        onClick={() =>
                          void updateDriverStatus("REJECTED")
                        }
                        disabled={updatingDriver}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle className="h-5 w-5" />
                        Reject Registration
                      </button>
                    </div>

                    <p className="mt-3 text-center text-xs text-slate-500">
                      The server checks all seven required documents again
                      before approving a driver.
                    </p>
                  </section>
                </div>
              </>
            )}
          </section>
         </div>
      </div>
    </main>
  </AdminAccessGuard>
  );
}
