"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle2,
  XCircle,
  Clock3,
  Eye,
  RefreshCw,
  User,
  Car,
  FileText,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"
import { supabase as supabaseClient } from "@/lib/supabase"

if (!supabaseClient) {
  throw new Error("Supabase client is not configured.")
}

const supabase = supabaseClient
type Driver = {
  id: string
  full_name: string | null
  name: string | null
  phone: string | null
  email: string | null
  vehicle_type: string | null
  vehicle_name: string | null
  vehicle_registration: string | null
  vehicle_color: string | null
  operating_town: string | null
  operating_area: string | null
  driver_license_number: string | null
  national_id_number: string | null
  nationalid_number: string | null
  momo_number: string | null
  momo_network: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  status: string | null
  availability: string | null
  created_at: string
}

type DriverDocument = {
  id: string
  driver_id: string
  document_type: string
  document_number: string | null
  document_url: string | null
  issue_date: string | null
  expiry_date: string | null
  verification_status: string | null
  created_at: string
}

const requiredDocuments = [
  {
    type: "ghana_card_front",
    label: "Ghana Card Front",
  },
  {
    type: "ghana_card_back",
    label: "Ghana Card Back",
  },
  {
    type: "driver_license",
    label: "Driver's Licence",
  },
  {
    type: "vehicle_registration",
    label: "Vehicle Registration",
  },
  {
    type: "insurance_certificate",
    label: "Insurance Certificate",
  },
  {
    type: "roadworthiness",
    label: "Roadworthiness / DVLA",
  },
  {
    type: "profile_photo",
    label: "Driver Profile Photo",
  },
]

function formatDate(date: string | null) {
  if (!date) return "—"

  return new Date(date).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function documentLabel(type: string) {
  return (
    requiredDocuments.find((document) => document.type === type)?.label ||
    type.replaceAll("_", " ")
  )
}

function statusClass(status: string | null) {
  switch (status) {
    case "Verified":
      return "bg-green-100 text-green-800 border-green-200"

    case "Rejected":
      return "bg-red-100 text-red-800 border-red-200"

    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
  }
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [documents, setDocuments] = useState<DriverDocument[]>([])
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [updatingDriver, setUpdatingDriver] = useState(false)
  const [updatingDocument, setUpdatingDocument] = useState<string | null>(
    null
  )
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadDrivers()
  }, [])

  async function loadDrivers() {
    setLoading(true)
    setError("")

    const { data, error } = await supabase
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
      .order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDrivers(data || [])
    setLoading(false)
  }

  async function loadDriverDocuments(driverId: string) {
    setLoadingDocuments(true)
    setError("")

    const { data, error } = await supabase
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
      .order("created_at", { ascending: true })

    if (error) {
      setError(error.message)
      setLoadingDocuments(false)
      return
    }

    setDocuments(data || [])
    setLoadingDocuments(false)
  }

  async function selectDriver(driver: Driver) {
    setSelectedDriver(driver)
    setSuccess("")
    setError("")
    setDocuments([])

    await loadDriverDocuments(driver.id)
  }

  async function updateDocumentStatus(
    documentId: string,
    status: "Verified" | "Rejected"
  ) {
    setUpdatingDocument(documentId)
    setError("")
    setSuccess("")

    const { error } = await supabase
      .from("driver_documents")
      .update({
        verification_status: status,
      })
      .eq("id", documentId)

    if (error) {
      setError(error.message)
      setUpdatingDocument(null)
      return
    }

    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId
          ? {
              ...document,
              verification_status: status,
            }
          : document
      )
    )

    setSuccess(
      status === "Verified"
        ? "Document verified successfully."
        : "Document rejected. Driver will need to replace it."
    )

    setUpdatingDocument(null)
  }

  async function viewDocument(document: DriverDocument) {
    if (!document.document_url) {
      setError("No document file is available.")
      return
    }

    setError("")

    const { data, error } = await supabase.storage
      .from("driver-documents")
      .createSignedUrl(document.document_url, 300)

    if (error) {
      setError(error.message)
      return
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer")
    }
  }

  async function approveDriver() {
    if (!selectedDriver) return

    setUpdatingDriver(true)
    setError("")
    setSuccess("")

    const { error } = await supabase
      .from("drivers")
      .update({
        status: "VERIFIED",
      })
      .eq("id", selectedDriver.id)

    if (error) {
      setError(error.message)
      setUpdatingDriver(false)
      return
    }

    const updatedDriver = {
      ...selectedDriver,
      status: "VERIFIED",
    }

    setSelectedDriver(updatedDriver)

    setDrivers((current) =>
      current.map((driver) =>
        driver.id === selectedDriver.id ? updatedDriver : driver
      )
    )

    setSuccess(
      "Driver approved successfully. The driver is now verified by KFM."
    )

    setUpdatingDriver(false)
  }

  async function rejectDriver() {
    if (!selectedDriver) return

    const confirmed = window.confirm(
      "Reject this driver's registration? The driver will need to correct or replace the required information/documents."
    )

    if (!confirmed) return

    setUpdatingDriver(true)
    setError("")
    setSuccess("")

    const { error } = await supabase
      .from("drivers")
      .update({
        status: "REJECTED",
      })
      .eq("id", selectedDriver.id)

    if (error) {
      setError(error.message)
      setUpdatingDriver(false)
      return
    }

    const updatedDriver = {
      ...selectedDriver,
      status: "REJECTED",
    }

    setSelectedDriver(updatedDriver)

    setDrivers((current) =>
      current.map((driver) =>
        driver.id === selectedDriver.id ? updatedDriver : driver
      )
    )

    setSuccess("Driver registration has been rejected.")

    setUpdatingDriver(false)
  }

  const pendingDrivers = drivers.filter(
    (driver) => driver.status === "PENDING" || !driver.status
  )

  const verifiedDrivers = drivers.filter(
    (driver) => driver.status === "VERIFIED"
  )

  const rejectedDrivers = drivers.filter(
    (driver) => driver.status === "REJECTED"
  )

  function getDocument(driverId: string, type: string) {
    return documents.find(
      (document) =>
        document.driver_id === driverId && document.document_type === type
    )
  }

  function allDocumentsVerified() {
    if (!selectedDriver) return false

    return requiredDocuments.every((required) => {
      const document = getDocument(selectedDriver.id, required.type)
      return document?.verification_status === "Verified"
    })
  }

  function allDocumentsUploaded() {
    if (!selectedDriver) return false

    return requiredDocuments.every((required) => {
      return Boolean(getDocument(selectedDriver.id, required.type))
    })
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
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
                Review driver information and verify submitted documents before
                approving drivers.
              </p>
            </div>

            <button
              onClick={loadDrivers}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
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

        {/* Summary cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Drivers
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {drivers.length}
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-3">
                <User className="h-6 w-6 text-slate-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Review
                </p>
                <p className="mt-1 text-3xl font-bold text-yellow-700">
                  {pendingDrivers.length}
                </p>
              </div>

              <div className="rounded-xl bg-yellow-100 p-3">
                <Clock3 className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Verified</p>
                <p className="mt-1 text-3xl font-bold text-green-700">
                  {verifiedDrivers.length}
                </p>
              </div>

              <div className="rounded-xl bg-green-100 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Rejected</p>
                <p className="mt-1 text-3xl font-bold text-red-700">
                  {rejectedDrivers.length}
                </p>
              </div>

              <div className="rounded-xl bg-red-100 p-3">
                <XCircle className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Main dashboard */}
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Driver list */}
          <section className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Driver Applications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a driver to review their registration.
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
                    const driverName =
                      driver.full_name || driver.name || "Unnamed Driver"

                    const isSelected = selectedDriver?.id === driver.id

                    return (
                      <button
                        key={driver.id}
                        onClick={() => selectDriver(driver)}
                        className={`w-full p-5 text-left transition ${
                          isSelected
                            ? "bg-slate-100"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {driverName}
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
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Driver details */}
          <section className="rounded-2xl border bg-white shadow-sm">
            {!selectedDriver ? (
              <div className="flex min-h-[500px] items-center justify-center p-8 text-center">
                <div>
                  <User className="mx-auto h-12 w-12 text-slate-300" />
                  <h2 className="mt-4 text-xl font-bold text-slate-700">
                    Select a Driver
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Select a driver application from the list to review their
                    information and documents.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Driver header */}
                <div className="border-b bg-slate-50 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-slate-200 p-3">
                          <User className="h-7 w-7 text-slate-600" />
                        </div>

                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">
                            {selectedDriver.full_name ||
                              selectedDriver.name ||
                              "Unnamed Driver"}
                          </h2>

                          <p className="text-sm text-slate-500">
                            Registered {formatDate(selectedDriver.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusClass(
                        selectedDriver.status
                      )}`}
                    >
                      {selectedDriver.status || "PENDING"}
                    </span>
                  </div>
                </div>

                <div className="space-y-8 p-6">
                  {/* Personal information */}
                  <div>
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
                          selectedDriver.name ||
                          "—"
                        }
                      />

                      <InfoItem
                        label="Phone"
                        value={selectedDriver.phone}
                      />

                      <InfoItem
                        label="Email"
                        value={selectedDriver.email}
                      />

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
                  </div>

                  {/* Vehicle information */}
                  <div>
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
                  </div>

                  {/* Documents */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-600" />
                        <h3 className="text-lg font-bold text-slate-900">
                          Document Verification
                        </h3>
                      </div>

                      <button
                        onClick={() =>
                          loadDriverDocuments(selectedDriver.id)
                        }
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
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
                          const document = getDocument(
                            selectedDriver.id,
                            required.type
                          )

                          return (
                            <div
                              key={required.type}
                              className="rounded-xl border p-4"
                            >
                              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold capitalize text-slate-900">
                                      {required.label}
                                    </h4>

                                    {document ? (
                                      <span
                                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(
                                          document.verification_status
                                        )}`}
                                      >
                                        {document.verification_status ||
                                          "Pending Verification"}
                                      </span>
                                    ) : (
                                      <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                                        Not Uploaded
                                      </span>
                                    )}
                                  </div>

                                  {document && (
                                    <div className="mt-2 grid gap-1 text-sm text-slate-500 sm:grid-cols-3">
                                      {document.document_number && (
                                        <span>
                                          <strong>Number:</strong>{" "}
                                          {document.document_number}
                                        </span>
                                      )}

                                      {document.issue_date && (
                                        <span>
                                          <strong>Issued:</strong>{" "}
                                          {formatDate(document.issue_date)}
                                        </span>
                                      )}

                                      {document.expiry_date && (
                                        <span>
                                          <strong>Expires:</strong>{" "}
                                          {formatDate(document.expiry_date)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                  {document?.document_url && (
                                    <button
                                      onClick={() =>
                                        viewDocument(document)
                                      }
                                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      <Eye className="h-4 w-4" />
                                      View
                                    </button>
                                  )}

                                  {document && (
                                    <>
                                      <button
                                        onClick={() =>
                                          updateDocumentStatus(
                                            document.id,
                                            "Verified"
                                          )
                                        }
                                        disabled={
                                          updatingDocument === document.id
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Verify
                                      </button>

                                      <button
                                        onClick={() =>
                                          updateDocumentStatus(
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
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Verification summary */}
                  <div className="rounded-xl border bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-900">
                      Verification Summary
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-white p-4">
                        <p className="text-sm text-slate-500">
                          Required Documents
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          7
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-4">
                        <p className="text-sm text-slate-500">
                          Documents Uploaded
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {
                            requiredDocuments.filter((required) =>
                              getDocument(
                                selectedDriver.id,
                                required.type
                              )
                            ).length
                          }
                          /7
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-4">
                        <p className="text-sm text-slate-500">
                          Documents Verified
                        </p>
                        <p className="mt-1 text-xl font-bold text-green-700">
                          {
                            requiredDocuments.filter(
                              (required) =>
                                getDocument(
                                  selectedDriver.id,
                                  required.type
                                )?.verification_status === "Verified"
                            ).length
                          }
                          /7
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-4">
                        <p className="text-sm text-slate-500">
                          Registration Status
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {selectedDriver.status || "PENDING"}
                        </p>
                      </div>
                    </div>

                    {!allDocumentsUploaded() && (
                      <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                        The driver has not uploaded all seven required
                        documents.
                      </div>
                    )}

                    {allDocumentsUploaded() && !allDocumentsVerified() && (
                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                        All seven documents have been uploaded, but one or
                        more documents still require KFM verification.
                      </div>
                    )}

                    {allDocumentsVerified() && (
                      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                        All seven required documents have been verified by KFM.
                        The driver can now be approved.
                      </div>
                    )}
                  </div>

                  {/* Admin actions */}
                  <div className="border-t pt-6">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                      KFM Registration Decision
                    </h3>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={approveDriver}
                        disabled={
                          updatingDriver ||
                          !allDocumentsUploaded() ||
                          !allDocumentsVerified()
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        {updatingDriver
                          ? "Processing..."
                          : "Approve Driver"}
                      </button>

                      <button
                        onClick={rejectDriver}
                        disabled={updatingDriver}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle className="h-5 w-5" />
                        Reject Registration
                      </button>
                    </div>

                    <p className="mt-3 text-center text-xs text-slate-500">
                      KFM approval is only available after all seven required
                      documents have been uploaded and verified.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string | null
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
  )
}
