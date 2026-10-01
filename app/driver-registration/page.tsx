"use client"

import { FormEvent, useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

type DriverDocument = {
  id: string
  document_type: string
  document_number: string | null
  document_url: string | null
  expiry_date: string | null
  verification_status: string | null
}

type DocumentDefinition = {
  type: string
  label: string
  description: string
  accept: string
  required: boolean
}

const documentDefinitions: DocumentDefinition[] = [
  {
    type: "ghana_card",
    label: "Ghana Card / National ID",
    description: "Upload the front of your Ghana Card or National ID.",
    accept: "image/jpeg,image/png,application/pdf",
    required: true,
  },
  {
    type: "driver_license",
    label: "Driver's Licence",
    description: "Upload a clear copy of your driver's licence.",
    accept: "image/jpeg,image/png,application/pdf",
    required: true,
  },
  {
    type: "vehicle_registration",
    label: "Vehicle Registration",
    description: "Upload your vehicle registration document.",
    accept: "image/jpeg,image/png,application/pdf",
    required: true,
  },
  {
    type: "insurance_certificate",
    label: "Insurance Certificate",
    description: "Upload your current vehicle insurance certificate.",
    accept: "image/jpeg,image/png,application/pdf",
    required: true,
  },
  {
    type: "roadworthiness",
    label: "Roadworthiness / DVLA Document",
    description: "Upload your current roadworthiness or DVLA document.",
    accept: "image/jpeg,image/png,application/pdf",
    required: true,
  },
  {
    type: "profile_photo",
    label: "Driver Profile Photo",
    description: "Upload a clear recent photo of yourself.",
    accept: "image/jpeg,image/png",
    required: true,
  },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024

export default function DriverRegistrationPage() {
  const [started, setStarted] = useState(false)
  const [verified, setVerified] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [signInMode, setSignInMode] = useState(false)
  const [step, setStep] = useState(1)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Step 2 — Personal Information
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [nationalId, setNationalId] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")

  // Step 3 — Vehicle Information
  const [vehicleType, setVehicleType] = useState("")
  const [vehicleName, setVehicleName] = useState("")
  const [vehicleRegistration, setVehicleRegistration] = useState("")
  const [vehicleColor, setVehicleColor] = useState("")
  const [operatingTown, setOperatingTown] = useState("")
  const [operatingArea, setOperatingArea] = useState("")

  // Step 4 — Driver Information
  const [driverLicenseNumber, setDriverLicenseNumber] = useState("")
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("")
  const [emergencyContactName, setEmergencyContactName] = useState("")
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("")

  // Step 5 — Payment Information
  const [momoNumber, setMomoNumber] = useState("")
  const [momoNetwork, setMomoNetwork] = useState("")

  // Step 6 — Documents
  const [driverDocuments, setDriverDocuments] = useState<
    DriverDocument[]
  >([])
  const [uploadingDocument, setUploadingDocument] = useState("")
  const [viewingDocument, setViewingDocument] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")
  const [documentExpiryDate, setDocumentExpiryDate] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function loadDriverDocuments(userId: string) {
    if (!supabase) {
      return
    }

    const { data, error: documentsError } = await supabase
      .from("driver_documents")
      .select(
        `
          id,
          document_type,
          document_number,
          document_url,
          expiry_date,
          verification_status
        `,
      )
      .eq("driver_id", userId)
      .order("created_at", { ascending: true })

    if (documentsError) {
      console.error(
        "Unable to load driver documents:",
        documentsError.message,
      )
      return
    }

    setDriverDocuments(data ?? [])
  }

  async function loadDriverProgress(userId: string) {
    if (!supabase) {
      return
    }

    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select(`
        id,
        email,
        full_name,
        name,
        phone,
        nationalid_number,
        date_of_birth,
        vehicle_type,
        vehicle_name,
        vehicle_registration,
        vehicle_color,
        operating_town,
        operating_area,
        driver_license_number,
        license_expiry_date,
        emergency_contact_name,
        emergency_contact_phone,
        momo_number,
        momo_network
      `)
      .eq("user_id", userId)
      .maybeSingle()

    if (driverError) {
      console.error(
        "Unable to load driver progress:",
        driverError.message,
      )
      setError(
        `Unable to load your saved registration: ${driverError.message}`,
      )
      setStep(2)
      return
    }

    // No driver record yet — start at Step 2.
    if (!driver) {
      setStep(2)
      return
    }

    // Restore saved personal information.
    setFullName(driver.full_name ?? driver.name ?? "")
    setPhone(driver.phone ?? "")
    setNationalId(driver.nationalid_number ?? "")
    setDateOfBirth(driver.date_of_birth ?? "")

    // Restore saved vehicle information.
    setVehicleType(driver.vehicle_type ?? "")
    setVehicleName(driver.vehicle_name ?? "")
    setVehicleRegistration(driver.vehicle_registration ?? "")
    setVehicleColor(driver.vehicle_color ?? "")
    setOperatingTown(driver.operating_town ?? "")
    setOperatingArea(driver.operating_area ?? "")

    // Restore saved driver information.
    setDriverLicenseNumber(driver.driver_license_number ?? "")
    setLicenseExpiryDate(driver.license_expiry_date ?? "")
    setEmergencyContactName(driver.emergency_contact_name ?? "")
    setEmergencyContactPhone(driver.emergency_contact_phone ?? "")

    // Restore saved payment information.
    setMomoNumber(driver.momo_number ?? "")
    setMomoNetwork(driver.momo_network ?? "")

    // Restore saved document information.
    await loadDriverDocuments(userId)

    const personalInformationComplete =
      Boolean(
        (driver.full_name ?? driver.name) &&
        driver.phone &&
        driver.nationalid_number &&
        driver.date_of_birth,
      )

    const vehicleInformationComplete =
      Boolean(
        driver.vehicle_type &&
        driver.vehicle_name &&
        driver.vehicle_registration &&
        driver.vehicle_color &&
        driver.operating_town &&
        driver.operating_area,
      )

    const driverInformationComplete =
      Boolean(
        driver.driver_license_number &&
        driver.license_expiry_date &&
        driver.emergency_contact_name &&
        driver.emergency_contact_phone,
      )

    const paymentInformationComplete =
      Boolean(
        driver.momo_number &&
        driver.momo_network,
      )

    if (!personalInformationComplete) {
      setStep(2)
      return
    }

    if (!vehicleInformationComplete) {
      setStep(3)
      return
    }

    if (!driverInformationComplete) {
      setStep(4)
      return
    }

    if (!paymentInformationComplete) {
      setStep(5)
      return
    }

    // Steps 2, 3, 4 and 5 are complete.
    // Step 6 will be the next registration stage.
    setStep(6)
  }

  useEffect(() => {
    let mounted = true

    async function checkSession() {
      if (!supabase) {
        if (mounted) {
          setCheckingSession(false)
        }
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      const user = session?.user

      if (user?.email_confirmed_at) {
        setVerified(true)
        setStarted(true)
        setEmail(user.email ?? "")

        await loadDriverProgress(user.id)
      }

      setCheckingSession(false)
    }

    checkSession()

    if (!supabase) {
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user

      if (user?.email_confirmed_at) {
        setVerified(true)
        setStarted(true)
        setEmail(user.email ?? "")

        setTimeout(() => {
          loadDriverProgress(user.id)
        }, 0)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleCreateAccount(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError("")
    setMessage("")

    if (!email || !password || !confirmPassword) {
      setError("Please complete all account fields.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (!supabase) {
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    setLoading(true)

    const { data, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            "https://kingdom-faith-transport.vercel.app/driver-registration",
        },
      })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (data.session?.user?.email_confirmed_at) {
      setVerified(true)
      setStarted(true)
      setStep(2)
      setMessage("Your email has been verified.")
      return
    }

    setMessage(
      "Your account has been created. Please check your email and click the verification link before continuing your KFM driver registration.",
    )
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setMessage("")

    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }

    if (!supabase) {
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    setLoading(true)

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    const user = data.user

    if (!user?.email_confirmed_at) {
      setError(
        "Your email has not been verified yet. Please check your email and confirm your account.",
      )
      return
    }

    setVerified(true)
    setStarted(true)
    setEmail(user.email ?? "")

    await loadDriverProgress(user.id)

    setMessage(
      "Welcome back. Your saved KFM registration details have been loaded.",
    )
  }

  async function handlePersonalInformation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError("")
    setMessage("")

    if (!fullName || !phone || !nationalId || !dateOfBirth) {
      setError("Please complete all personal information fields.")
      return
    }

    if (!supabase) {
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      setError("Your session has expired. Please sign in again.")
      return
    }

    const driverData = {
      user_id: user.id,
      id: user.id,
      email: user.email,
      full_name: fullName,
      name: fullName,
      phone,
      nationalid_number: nationalId,
      date_of_birth: dateOfBirth,
      status: "PENDING",
      availability: "OFFLINE",
    }

    const { data: existingDriver, error: lookupError } =
      await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

    if (lookupError) {
      setLoading(false)
      setError(lookupError.message)
      return
    }

    let saveError = null

    if (existingDriver) {
      const { error } = await supabase
        .from("drivers")
        .update(driverData)
        .eq("id", existingDriver.id)

      saveError = error
    } else {
      const { error } = await supabase
        .from("drivers")
        .insert(driverData)

      saveError = error
    }

    setLoading(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setMessage("Personal information saved successfully.")
    setStep(3)
  }

  async function handleVehicleInformation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError("")
    setMessage("")

    if (
      !vehicleType ||
      !vehicleName ||
      !vehicleRegistration ||
      !vehicleColor ||
      !operatingTown ||
      !operatingArea
    ) {
      setError("Please complete all vehicle information fields.")
      return
    }

    if (!supabase) {
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      setError("Your session has expired. Please sign in again.")
      return
    }

    const { error: saveError } = await supabase
      .from("drivers")
      .update({
        vehicle_type: vehicleType,
        vehicle_name: vehicleName,
        vehicle_registration: vehicleRegistration,
        vehicle_color: vehicleColor,
        operating_town: operatingTown,
        operating_area: operatingArea,
      })
      .eq("user_id", user.id)

    setLoading(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    await loadDriverProgress(user.id)
    setMessage("Vehicle information saved successfully.")
  }

  async function handleDriverInformation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError("")
    setMessage("")

    if (
      !driverLicenseNumber ||
      !licenseExpiryDate ||
      !emergencyContactName ||
      !emergencyContactPhone
    ) {
      setError("Please complete all driver information fields.")
      return
    }

    if (!supabase) {
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      setError("Your session has expired. Please sign in again.")
      return
    }

    const { error: saveError } = await supabase
      .from("drivers")
      .update({
        driver_license_number: driverLicenseNumber,
        license_expiry_date: licenseExpiryDate,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
      })
      .eq("user_id", user.id)

    setLoading(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setMessage("Driver information saved successfully.")
    setStep(5)
  }

  async function handlePaymentInformation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError("")
    setMessage("")

    if (!momoNumber || !momoNetwork) {
      setError(
        "Please enter your MoMo number and select your network.",
      )
      return
    }

    if (!supabase) {
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      setError("Your session has expired. Please sign in again.")
      return
    }

    const { error: saveError } = await supabase
      .from("drivers")
      .update({
        momo_number: momoNumber,
        momo_network: momoNetwork,
      })
      .eq("user_id", user.id)

    setLoading(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    setMessage("Payment information saved successfully.")
    setStep(6)
  }

  async function handleDocumentUpload(
    documentType: DocumentDefinition,
    file: File,
  ) {
    setError("")
    setMessage("")

    if (!supabase) {
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `${documentType.label} is larger than 5 MB. Please choose a smaller file.`,
      )
      return
    }

    const allowedTypes = documentType.accept.split(",")

    if (!allowedTypes.includes(file.type)) {
      setError(
        `${documentType.label} must be a JPG, PNG, or PDF file as permitted for this document.`,
      )
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Your session has expired. Please sign in again.")
      return
    }

    setUploadingDocument(documentType.type)

    const fileExtension =
      file.name.split(".").pop()?.toLowerCase() || "file"

    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")

    const filePath = `${user.id}/${documentType.type}-${Date.now()}-${safeFileName}.${fileExtension}`

    const { error: uploadError } = await supabase.storage
      .from("driver-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      setUploadingDocument("")
      setError(
        `Unable to upload ${documentType.label}: ${uploadError.message}`,
      )
      return
    }

    const { error: recordError } = await supabase
      .from("driver_documents")
      .insert({
        driver_id: user.id,
        document_type: documentType.type,
        document_number:
          documentType.type === "ghana_card" ||
          documentType.type === "driver_license" ||
          documentType.type === "vehicle_registration"
            ? documentNumber || null
            : null,
        document_url: filePath,
        expiry_date:
          documentType.type === "driver_license" ||
          documentType.type === "insurance_certificate" ||
          documentType.type === "roadworthiness"
            ? documentExpiryDate || null
            : null,
        verification_status: "Pending Verification",
      })

    if (recordError) {
      await supabase.storage
        .from("driver-documents")
        .remove([filePath])

      setUploadingDocument("")
      setError(
        `The file uploaded, but its document record could not be saved: ${recordError.message}`,
      )
      return
    }

    await loadDriverDocuments(user.id)

    setUploadingDocument("")
    setDocumentNumber("")
    setDocumentExpiryDate("")

    setMessage(
      `${documentType.label} uploaded successfully and is awaiting KFM verification.`,
    )
  }

  async function handleViewDocument(document: DriverDocument) {
    if (!supabase || !document.document_url) {
      return
    }

    setError("")
    setMessage("")
    setViewingDocument(document.id)

    const { data, error: signedUrlError } = await supabase.storage
      .from("driver-documents")
      .createSignedUrl(document.document_url, 300)

    setViewingDocument("")

    if (signedUrlError || !data?.signedUrl) {
      setError(
        signedUrlError?.message ||
          "Unable to open this document.",
      )
      return
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer")
  }

  async function handleSubmitForReview() {
    setError("")
    setMessage("")

    if (!supabase) {
      setError(
        "KFM registration is temporarily unavailable. Please try again later.",
      )
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Your session has expired. Please sign in again.")
      return
    }

    const requiredTypes = documentDefinitions
      .filter((document) => document.required)
      .map((document) => document.type)

    const uploadedTypes = driverDocuments.map(
      (document) => document.document_type,
    )

    const missingDocuments = requiredTypes.filter(
      (type) => !uploadedTypes.includes(type),
    )

    if (missingDocuments.length > 0) {
      const missingLabels = documentDefinitions
        .filter((document) =>
          missingDocuments.includes(document.type),
        )
        .map((document) => document.label)

      setError(
        `Please upload all required documents before submitting your registration. Missing: ${missingLabels.join(
          ", ",
        )}`,
      )
      return
    }

    setSubmittingReview(true)

    const { error: statusError } = await supabase
      .from("drivers")
      .update({
        status: "PENDING",
      })
      .eq("user_id", user.id)

    setSubmittingReview(false)

    if (statusError) {
      setError(
        `Your documents are uploaded, but your registration status could not be updated: ${statusError.message}`,
      )
      return
    }

    setMessage(
      "Your KFM driver registration has been submitted for review. KFM will review your information and documents before approval.",
    )
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="text-3xl font-bold">
            KFM Driver Registration
          </h1>

          <p className="mt-4 text-muted-foreground">
            Checking your registration status...
          </p>
        </section>
      </main>
    )
  }

  if (!started) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">
            Become a KFM Driver Partner
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">
            Earn with KFM Transport. Register your vehicle, submit your
            documents, and join our growing driver network.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-6">
              <h2 className="font-semibold">Flexible Driving</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose when you want to be available.
              </p>
            </div>

            <div className="rounded-xl border p-6">
              <h2 className="font-semibold">KFM Support</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Get connected with customers through KFM Transport.
              </p>
            </div>

            <div className="rounded-xl border p-6">
              <h2 className="font-semibold">Driver Verification</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your information and documents are reviewed by KFM.
              </p>
            </div>

            <div className="rounded-xl border p-6">
              <h2 className="font-semibold">Ride Opportunities</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Approved drivers can receive suitable ride requests.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => {
                setStarted(true)
                setSignInMode(false)
              }}
              className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground"
            >
              Start Driver Registration
            </button>

            <button
              type="button"
              onClick={() => {
                setStarted(true)
                setSignInMode(true)
                setError("")
                setMessage("")
              }}
              className="rounded-lg border px-6 py-3 font-semibold"
            >
              Already have an account? Sign in
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (verified && step === 2) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">
            KFM Driver Registration
          </h1>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">
              Registration Journey
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border p-4">
                ✓ Step 1 — Account
              </div>

              <div className="rounded-lg border-2 border-primary p-4">
                → Step 2 — Personal Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 3 — Vehicle Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 4 — Driver Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 5 — Payment Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 6 — Documents
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-xl border p-6">
            <h2 className="text-2xl font-bold">
              Step 2 — Personal Information
            </h2>

            <p className="mt-2 text-muted-foreground">
              Please provide your personal information.
            </p>

            <form
              onSubmit={handlePersonalInformation}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="e.g. 0241234567"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Ghana Card Number
                </label>

                <input
                  type="text"
                  value={nationalId}
                  onChange={(event) =>
                    setNationalId(event.target.value)
                  }
                  placeholder="GHA-XXXXXXXXX-X"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Date of Birth
                </label>

                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) =>
                    setDateOfBirth(event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save & Continue"}
              </button>
            </form>
          </div>
        </section>
      </main>
    )
  }

  if (verified && step === 3) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">
            KFM Driver Registration
          </h1>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">
              Registration Journey
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border p-4">
                ✓ Step 1 — Account
              </div>

              <div className="rounded-lg border p-4">
                ✓ Step 2 — Personal Information
              </div>

              <div className="rounded-lg border-2 border-primary p-4">
                → Step 3 — Vehicle Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 4 — Driver Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 5 — Payment Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 6 — Documents
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-xl border p-6">
            <h2 className="text-2xl font-bold">
              Step 3 — Vehicle Information
            </h2>

            <p className="mt-2 text-muted-foreground">
              Please provide the vehicle information you will use for KFM
              Transport.
            </p>

            <form
              onSubmit={handleVehicleInformation}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium">
                  Vehicle Type
                </label>

                <select
                  value={vehicleType}
                  onChange={(event) =>
                    setVehicleType(event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                >
                  <option value="">Select vehicle type</option>
                  <option value="Okada">Okada</option>
                  <option value="Car">Car</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Vehicle Name / Model
                </label>

                <input
                  type="text"
                  value={vehicleName}
                  onChange={(event) =>
                    setVehicleName(event.target.value)
                  }
                  placeholder="e.g. Toyota Corolla or Yamaha Motorbike"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Vehicle Registration Number
                </label>

                <input
                  type="text"
                  value={vehicleRegistration}
                  onChange={(event) =>
                    setVehicleRegistration(event.target.value)
                  }
                  placeholder="Enter vehicle registration number"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Vehicle Colour
                </label>

                <input
                  type="text"
                  value={vehicleColor}
                  onChange={(event) =>
                    setVehicleColor(event.target.value)
                  }
                  placeholder="e.g. Black, White, Silver"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Operating Town
                </label>

                <input
                  type="text"
                  value={operatingTown}
                  onChange={(event) =>
                    setOperatingTown(event.target.value)
                  }
                  placeholder="e.g. Nsawam"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Operating Area
                </label>

                <input
                  type="text"
                  value={operatingArea}
                  onChange={(event) =>
                    setOperatingArea(event.target.value)
                  }
                  placeholder="e.g. Nsawam and nearby towns"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save & Continue"}
              </button>
            </form>
          </div>
        </section>
      </main>
    )
  }

  if (verified && step === 4) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">
            KFM Driver Registration
          </h1>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">
              Registration Journey
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border p-4">
                ✓ Step 1 — Account
              </div>

              <div className="rounded-lg border p-4">
                ✓ Step 2 — Personal Information
              </div>

              <div className="rounded-lg border p-4">
                ✓ Step 3 — Vehicle Information
              </div>

              <div className="rounded-lg border-2 border-primary p-4">
                → Step 4 — Driver Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 5 — Payment Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 6 — Documents
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-xl border p-6">
            <h2 className="text-2xl font-bold">
              Step 4 — Driver Information
            </h2>

            <p className="mt-2 text-muted-foreground">
              Please provide your driver license and emergency contact
              information.
            </p>

            <form
              onSubmit={handleDriverInformation}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium">
                  Driver&apos;s License Number
                </label>

                <input
                  type="text"
                  value={driverLicenseNumber}
                  onChange={(event) =>
                    setDriverLicenseNumber(event.target.value)
                  }
                  placeholder="Enter your driver license number"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Driver&apos;s License Expiry Date
                </label>

                <input
                  type="date"
                  value={licenseExpiryDate}
                  onChange={(event) =>
                    setLicenseExpiryDate(event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Emergency Contact Name
                </label>

                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(event) =>
                    setEmergencyContactName(event.target.value)
                  }
                  placeholder="Enter emergency contact full name"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Emergency Contact Phone Number
                </label>

                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(event) =>
                    setEmergencyContactPhone(event.target.value)
                  }
                  placeholder="e.g. 0241234567"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save & Continue"}
              </button>
            </form>
          </div>
        </section>
      </main>
    )
  }

  if (verified && step === 5) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">
            KFM Driver Registration
          </h1>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">
              Registration Journey
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border p-4">
                ✓ Step 1 — Account
              </div>

              <div className="rounded-lg border p-4">
                ✓ Step 2 — Personal Information
              </div>

              <div className="rounded-lg border p-4">
                ✓ Step 3 — Vehicle Information
              </div>

              <div className="rounded-lg border p-4">
                ✓ Step 4 — Driver Information
              </div>

              <div className="rounded-lg border-2 border-primary p-4">
                → Step 5 — Payment Information
              </div>

              <div className="rounded-lg border p-4 text-muted-foreground">
                Step 6 — Documents
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-xl border p-6">
            <h2 className="text-2xl font-bold">
              Step 5 — Payment Information
            </h2>

            <p className="mt-2 text-muted-foreground">
              Please provide the Mobile Money details KFM will use for
              driver payments.
            </p>

            <form
              onSubmit={handlePaymentInformation}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium">
                  Mobile Money Number
                </label>

                <input
                  type="tel"
                  value={momoNumber}
                  onChange={(event) =>
                    setMomoNumber(event.target.value)
                  }
                  placeholder="e.g. 0241234567"
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                />

                <p className="mt-2 text-sm text-muted-foreground">
                  Enter the MoMo number where you want KFM driver payments
                  to be sent.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Mobile Money Network
                </label>

                <select
                  value={momoNetwork}
                  onChange={(event) =>
                    setMomoNetwork(event.target.value)
                  }
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                  required
                >
                  <option value="">
                    Select Mobile Money network
                  </option>
                  <option value="MTN">MTN</option>
                  <option value="Telecel">Telecel</option>
                  <option value="AirtelTigo">AirtelTigo</option>
                </select>
              </div>

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save & Continue"}
              </button>
            </form>
          </div>
        </section>
      </main>
    )
  }

  if (verified && step === 6) {
    const uploadedDocumentTypes = new Set(
      driverDocuments.map((document) => document.document_type),
    )

    const allRequiredDocumentsUploaded =
      documentDefinitions
        .filter((document) => document.required)
        .every((document) =>
          uploadedDocumentTypes.has(document.type),
        )

    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-4xl font-bold">
            KFM Driver Registration
          </h1>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">
              Registration Journey
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border p-4">
                ✓ Step 1 — Account
              </div>

              <div className="rounded-lg border p-4">
                ✓ Step 2 — Personal Information
              </div>

              <div className="rounded-lg border p-4">
                ✓ Step 3 — Vehicle Information
              </div>

              <div className="rounded-lg border p-4">
                ✓ Step 4 — Driver Information
              </div>

              <div className="rounded-lg border p-4">
                ✓ Step 5 — Payment Information
              </div>

              <div className="rounded-lg border-2 border-primary p-4">
                → Step 6 — Documents
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-xl border p-6">
            <h2 className="text-2xl font-bold">
              Step 6 — Documents
            </h2>

            <p className="mt-2 text-muted-foreground">
              Upload the documents KFM needs to verify your driver
              application.
            </p>

            <div className="mt-5 rounded-lg border bg-muted/30 p-4">
              <p className="font-medium">
                Document requirements
              </p>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Maximum file size: 5 MB per document</li>
                <li>JPG and PNG are accepted for images</li>
                <li>PDF is accepted for official documents</li>
                <li>Profile photo accepts JPG and PNG only</li>
                <li>Your documents are stored privately</li>
              </ul>
            </div>

            {(documentNumber || documentExpiryDate) && (
              <div className="mt-6 rounded-lg border p-5">
                <h3 className="font-semibold">
                  Document information
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  The document number and expiry date you enter below
                  will apply to the next official document you upload.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium">
                      Document Number
                    </label>

                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(event) =>
                        setDocumentNumber(event.target.value)
                      }
                      placeholder="Optional document number"
                      className="mt-2 w-full rounded-lg border px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Expiry Date
                    </label>

                    <input
                      type="date"
                      value={documentExpiryDate}
                      onChange={(event) =>
                        setDocumentExpiryDate(event.target.value)
                      }
                      className="mt-2 w-full rounded-lg border px-4 py-3"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {documentDefinitions.map((document) => {
                const uploaded = driverDocuments.find(
                  (item) =>
                    item.document_type === document.type,
                )

                const isUploading =
                  uploadingDocument === document.type

                const isViewing =
                  viewingDocument === uploaded?.id

                return (
                  <div
                    key={document.type}
                    className="rounded-xl border p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {document.label}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {document.description}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Maximum 5 MB
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {uploaded ? (
                          <>
                            <span className="rounded-full border px-3 py-1 text-xs font-medium">
                              {uploaded.verification_status ||
                                "Pending Verification"}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleViewDocument(uploaded)
                              }
                              disabled={isViewing}
                              className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                            >
                              {isViewing
                                ? "Opening..."
                                : "View Document"}
                            </button>
                          </>
                        ) : (
                          <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                            {isUploading
                              ? "Uploading..."
                              : "Choose File"}

                            <input
                              type="file"
                              accept={document.accept}
                              disabled={isUploading}
                              className="hidden"
                              onChange={(event) => {
                                const file =
                                  event.target.files?.[0]

                                if (file) {
                                  handleDocumentUpload(
                                    document,
                                    file,
                                  )
                                }

                                event.currentTarget.value = ""
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {uploaded && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Document uploaded. KFM will review it before
                        approval.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                {message}
              </div>
            )}

            <div className="mt-8 rounded-xl border-2 border-primary/30 p-6">
              <h3 className="text-xl font-bold">
                KFM Registration Review
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Once all six required documents have been uploaded,
                submit your complete registration for KFM review.
              </p>

              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={
                  submittingReview ||
                  !allRequiredDocumentsUploaded
                }
                className="mt-5 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingReview
                  ? "Submitting..."
                  : allRequiredDocumentsUploaded
                    ? "Submit Registration for KFM Review"
                    : "Upload All Required Documents First"}
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold">
          KFM Driver Registration
        </h1>

        <div className="mt-8 rounded-xl border p-6">
          <h2 className="text-2xl font-bold">
            {signInMode
              ? "Sign in to your KFM driver account"
              : "Step 1 — Create your KFM driver account"}
          </h2>

          <form
            onSubmit={
              signInMode ? handleSignIn : handleCreateAccount
            }
            className="mt-6 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="mt-2 w-full rounded-lg border px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Password
              </label>

              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  className="w-full rounded-lg border px-4 py-3 pr-12"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {!signInMode && (
              <div>
                <label className="block text-sm font-medium">
                  Confirm Password
                </label>

                <div className="relative mt-2">
                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    className="w-full rounded-lg border px-4 py-3 pr-12"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : signInMode
                  ? "Sign In"
                  : "Create KFM Driver Account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setSignInMode(!signInMode)
              setError("")
              setMessage("")
              setPassword("")
              setConfirmPassword("")
              setShowPassword(false)
              setShowConfirmPassword(false)
              setStarted(true)
            }}
            className="mt-5 text-sm font-medium underline"
          >
            {signInMode
              ? "Need to create a new account?"
              : "Already have a verified account? Sign in"}
          </button>
        </div>
      </section>
    </main>
  )
}
