
"use client"

import * as React from "react"
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  FileCheck2,
  Loader2,
  Upload,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import {
  RegionCombobox,
  findRegionId,
  useRegions,
  REGION_API_BASE,
} from "@/components/ui/region-combobox"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

// =====================================================
// KONSTANTA
// =====================================================

const DASHBOARD_PATH = "/dashboard"
const VERIFICATION_PATH = "/verification"
const STORAGE_BUCKET = "verification-documents"

const REGISTRATION_FEE = 150_000
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
]
const POLLING_INTERVAL_MS = 15_000

const BANK_INFO = [
  { label: "Nama Bank", value: "MANDIRI" },
  { label: "Cabang", value: "CIREBON" },
  {
    label: "Nomor Rekening",
    value: "1340031226904",
    strong: true,
  },
  {
    label: "Atas Nama",
    value: "PT.KODING KECERDASAN ARTIFISIAL",
  },
] as const

const GENDER_OPTIONS = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
]

const EDUCATION_OPTIONS = [
  { value: "SMA/SMK", label: "SMA / SMK" },
  { value: "D3", label: "Diploma 3 (D3)" },
  { value: "D4", label: "Diploma 4 (D4)" },
  { value: "S1", label: "Sarjana (S1)" },
  { value: "S2", label: "Magister (S2)" },
  { value: "S3", label: "Doktor (S3)" },
]

const FORM_STEPS: {
  number: number
  title: string
  description: string
  icon: LucideIcon
}[] = [
  {
    number: 1,
    title: "Data Pribadi",
    description: "Identitas dan alamat",
    icon: UserRound,
  },
  {
    number: 2,
    title: "Data Profesional",
    description: "Pekerjaan dan kompetensi",
    icon: BriefcaseBusiness,
  },
  {
    number: 3,
    title: "Pembayaran",
    description: "Bukti pembayaran",
    icon: CreditCard,
  },
]

// =====================================================
// TIPE DAN DATA AWAL
// =====================================================

type SubmissionStatus = "submitted" | "approved" | "rejected"

type SubmissionRow = {
  status: SubmissionStatus
  admin_note: string | null
}

type FormState = {
  full_name: string
  title_prefix: string
  title_suffix: string
  birth_place: string
  birth_date: string
  gender: string
  address: string
  province: string
  city: string
  district: string
  postal_code: string
  occupation: string
  institution_name: string
  position: string
  education: string
  competencies: string
  work_experience_years: string
  linkedin_url: string
  website_url: string
}

const initialForm: FormState = {
  full_name: "",
  title_prefix: "",
  title_suffix: "",
  birth_place: "",
  birth_date: "",
  gender: "",
  address: "",
  province: "",
  city: "",
  district: "",
  postal_code: "",
  occupation: "",
  institution_name: "",
  position: "",
  education: "",
  competencies: "",
  work_experience_years: "",
  linkedin_url: "",
  website_url: "",
}

// =====================================================
// FUNGSI BANTU
// =====================================================

function memberToForm(
  member: Record<string, unknown>
): FormState {
  const result = { ...initialForm }

  for (const key of Object.keys(initialForm) as (keyof FormState)[]) {
    const value = member[key]
    result[key] = value == null ? "" : String(value)
  }

  return result
}

function formToMemberPayload(form: FormState) {
  const optional = (value: string) => value.trim() || null

  return {
    full_name: form.full_name.trim(),
    title_prefix: optional(form.title_prefix),
    title_suffix: optional(form.title_suffix),
    birth_place: form.birth_place.trim(),
    birth_date: form.birth_date || null,
    gender: form.gender,
    address: form.address.trim(),
    province: form.province,
    city: form.city,
    district: form.district,
    postal_code: form.postal_code.trim(),
    occupation: form.occupation.trim(),
    institution_name: form.institution_name.trim(),
    position: optional(form.position),
    education: form.education,
    competencies: form.competencies.trim(),
    work_experience_years: form.work_experience_years
      ? Number(form.work_experience_years)
      : null,
    linkedin_url: optional(form.linkedin_url),
    website_url: optional(form.website_url),
  }
}

function validateStep(
  step: number,
  form: FormState
): string | null {
  if (step === 1) {
    if (!form.full_name.trim()) {
      return "Nama lengkap wajib diisi."
    }
    if (!form.birth_place.trim()) {
      return "Tempat lahir wajib diisi."
    }
    if (!form.birth_date) {
      return "Tanggal lahir wajib diisi."
    }
    if (!form.gender) {
      return "Silakan pilih jenis kelamin."
    }
    if (!form.address.trim()) {
      return "Alamat wajib diisi."
    }
    if (!form.province) {
      return "Silakan pilih provinsi."
    }
    if (!form.city) {
      return "Silakan pilih kota/kabupaten."
    }
    if (!form.district) {
      return "Silakan pilih kecamatan."
    }
    if (!form.postal_code.trim()) {
      return "Kode pos wajib diisi."
    }
  }

  if (step === 2) {
    if (!form.occupation.trim()) {
      return "Pekerjaan wajib diisi."
    }
    if (!form.institution_name.trim()) {
      return "Nama instansi wajib diisi."
    }
    if (!form.education) {
      return "Silakan pilih pendidikan terakhir."
    }
    if (!form.competencies.trim()) {
      return "Kompetensi yang dikuasai wajib diisi."
    }

    if (
      form.linkedin_url &&
      !/^https?:\/\/.+/i.test(form.linkedin_url)
    ) {
      return "URL LinkedIn harus diawali http:// atau https://."
    }

    if (
      form.website_url &&
      !/^https?:\/\/.+/i.test(form.website_url)
    ) {
      return "URL situs web harus diawali http:// atau https://."
    }
  }

  return null
}

function validateSubmission(
  form: FormState,
  file: File | null
): string | null {
  const personalError = validateStep(1, form)
  if (personalError) return personalError

  const professionalError = validateStep(2, form)
  if (professionalError) return professionalError

  if (!file) {
    return "Silakan upload bukti pembayaran terlebih dahulu."
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Ukuran bukti pembayaran maksimal 5 MB."
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return "Format file harus JPG, PNG, atau PDF."
  }

  return null
}

// =====================================================
// KOMPONEN INPUT
// =====================================================

type TextFieldProps = {
  name: keyof FormState
  label: string
  value: string
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void
  placeholder?: string
  required?: boolean
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  className?: string
}

function TextField({
  name,
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  inputMode,
  className,
}: TextFieldProps) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label
        htmlFor={name}
        className="text-sm font-medium text-slate-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-600">*</span>
        )}
      </Label>

      <Input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="h-11 rounded-md border-slate-300 bg-white shadow-none placeholder:text-slate-400 focus-visible:border-slate-500 focus-visible:ring-slate-200"
      />
    </div>
  )
}

type SelectFieldProps = {
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  placeholder: string
  onChange: (value: string) => void
}

function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-slate-700"
      >
        {label}
        <span className="ml-1 text-red-600">*</span>
      </Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="h-11 w-full rounded-md border-slate-300 bg-white shadow-none focus:ring-slate-200"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// =====================================================
// KARTU SECTION
// =====================================================

type SectionCardProps = {
  icon: LucideIcon
  title: string
  description: string
  children: React.ReactNode
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <Card className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-none">
      <CardHeader className="border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
            <Icon className="size-4.5" />
          </div>

          <div className="space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight text-slate-900">
              {title}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-500">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-5 py-6 sm:px-7 sm:py-7">
        {children}
      </CardContent>
    </Card>
  )
}

// =====================================================
// DIALOG REGISTRASI
// =====================================================

function RegisteredDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Akun Berhasil Dibuat</DialogTitle>
          <DialogDescription className="pt-2 leading-6">
            Akun Anda berhasil didaftarkan. Silakan lengkapi data
            pribadi, data profesional, dan bukti pembayaran untuk
            melanjutkan proses verifikasi keanggotaan.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-[#243B64] text-white hover:bg-[#1B2F50]"
          >
            Lengkapi Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// STATUS MENUNGGU VERIFIKASI
// =====================================================

function PendingView() {
  return (
    <Card className="overflow-hidden rounded-lg border-slate-200 shadow-none">
      <CardContent className="flex min-h-105 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
          <Loader2 className="size-7 animate-spin text-amber-700" />
        </div>

        <h1 className="mt-6 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Verifikasi Sedang Diproses
        </h1>

        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
          Pengajuan keanggotaan Anda telah diterima. Administrator
          akan memeriksa kelengkapan data dan bukti pembayaran.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          <span className="size-2 rounded-full bg-amber-600" />
          Menunggu Verifikasi
        </div>

        <div className="mt-8 w-full max-w-lg rounded-lg border border-slate-200 p-5 text-left">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-slate-600" />

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">
                Pengajuan berhasil diterima
              </p>
              <p className="text-sm leading-6 text-slate-500">
                Status akan diperbarui setelah administrator selesai
                melakukan pemeriksaan.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 max-w-lg text-xs leading-5 text-slate-500">
          Anda dapat meninggalkan halaman ini dan kembali lagi nanti
          untuk memeriksa status pengajuan.
        </p>
      </CardContent>
    </Card>
  )
}

// =====================================================
// HEADER DAN PROGRESS
// =====================================================

function FormProgress({
  currentStep,
}: {
  currentStep: number
}) {
  return (
    <div className="mb-7">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            ASPROKAINDONESIA
          </p>

          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Formulir Verifikasi Keanggotaan
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Lengkapi informasi berikut untuk pengajuan verifikasi
            keanggotaan.
          </p>
        </div>

        <span className="mt-1 inline-flex w-fit shrink-0 items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
          Tahap {currentStep} dari {FORM_STEPS.length}
        </span>
      </div>

      <div className="mt-5">
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {FORM_STEPS.map((step) => {
            const active = currentStep === step.number
            const completed = currentStep > step.number
            const StepIcon = step.icon

            return (
              <div key={step.number} className="min-w-0">
                <div
                  className={`mb-3 h-1 rounded-full ${
                    active || completed
                      ? "bg-[#40577A]"
                      : "bg-slate-200"
                  }`}
                />

                <div className="flex items-start gap-2">
                  <div
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                      completed
                        ? "border-[#40577A] bg-[#40577A] text-white"
                        : active
                          ? "border-[#40577A] bg-white text-[#243B64]"
                          : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {completed ? (
                      <Check className="size-3.5" />
                    ) : (
                      <StepIcon className="size-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 pt-0.5">
                    <p
                      className={`text-xs font-medium sm:text-sm ${
                        active || completed
                          ? "text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </p>

                    <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-[#40577A] transition-all duration-300"
            style={{
              width: `${(currentStep / FORM_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// =====================================================
// HALAMAN UTAMA
// =====================================================

function VerificationContent() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [registeredDialogOpen, setRegisteredDialogOpen] =
    useState(false)

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setRegisteredDialogOpen(true)
    }
  }, [searchParams])

  const closeRegisteredDialog = useCallback(() => {
    setRegisteredDialogOpen(false)
    router.replace(VERIFICATION_PATH)
  }, [router])

  // STATE FORM

  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<FormState>(initialForm)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [agreement, setAgreement] = useState(false)

  const provinces = useRegions(`${REGION_API_BASE}/provinces.json`)
  const provinceId = findRegionId(provinces.options, form.province)

  const regencies = useRegions(
    provinceId
      ? `${REGION_API_BASE}/regencies/${provinceId}.json`
      : null
  )

  const regencyId = findRegionId(regencies.options, form.city)

  const districts = useRegions(
    regencyId
      ? `${REGION_API_BASE}/districts/${regencyId}.json`
      : null
  )

  // STATUS PENGAJUAN

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus | null>(null)
  const [submissionNote, setSubmissionNote] =
    useState<string | null>(null)
  const [checkingSubmission, setCheckingSubmission] = useState(true)

  const applyStatus = useCallback(
    (status: SubmissionStatus, note: string | null) => {
      setSubmissionStatus(status)
      setSubmissionNote(note)

      if (status === "approved") {
        router.replace(DASHBOARD_PATH)
      }
    },
    [router]
  )

  // MEMUAT DATA DAN STATUS PENGAJUAN

  useEffect(() => {
    let active = true

    async function loadSubmission() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const [submissionResult, memberResult] = await Promise.all([
          supabase
            .from("verification_submissions")
            .select("status, admin_note")
            .eq("user_id", user.id)
            .maybeSingle(),

          supabase
            .from("member_details")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(),
        ])

        if (!active) return

        if (submissionResult.error) {
          console.error(
            "Gagal mengambil status verifikasi:",
            submissionResult.error
          )
        }

        if (memberResult.data) {
          setForm(memberToForm(memberResult.data))
        }

        if (submissionResult.data) {
          const { status, admin_note } =
            submissionResult.data as SubmissionRow

          applyStatus(status, admin_note)

          if (status === "rejected") {
            setCurrentStep(1)
          }
        }
      } catch (error) {
        console.error("Gagal mengecek pengajuan:", error)
      } finally {
        if (active) setCheckingSubmission(false)
      }
    }

    loadSubmission()

    return () => {
      active = false
    }
  }, [supabase, applyStatus])

  // REALTIME DAN POLLING STATUS ADMIN

  useEffect(() => {
    if (submissionStatus !== "submitted") return

    let active = true
    let interval: ReturnType<typeof setInterval> | undefined
    let channel: ReturnType<typeof supabase.channel> | undefined

    async function watchSubmission() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !active) return

      channel = supabase
        .channel(`verification-status-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "verification_submissions",
            filter: `user_id=eq.${user.id}`,
          },
          (
            payload: RealtimePostgresChangesPayload<SubmissionRow>
          ) => {
            const row = payload.new as SubmissionRow
            applyStatus(row.status, row.admin_note)
          }
        )
        .subscribe()

      interval = setInterval(async () => {
        try {
          const { data } = await supabase
            .from("verification_submissions")
            .select("status, admin_note")
            .eq("user_id", user.id)
            .maybeSingle()

          if (active && data && data.status !== "submitted") {
            applyStatus(
              data.status as SubmissionStatus,
              data.admin_note
            )
          }
        } catch (error) {
          console.error("Polling status gagal:", error)
        }
      }, POLLING_INTERVAL_MS)
    }

    watchSubmission()

    return () => {
      active = false

      if (interval) clearInterval(interval)
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, submissionStatus, applyStatus])

  // HANDLER INPUT

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleProvinceChange = (name: string) => {
    setForm((current) => ({
      ...current,
      province: name,
      city: "",
      district: "",
    }))
  }

  const handleCityChange = (name: string) => {
    setForm((current) => ({
      ...current,
      city: name,
      district: "",
    }))
  }

  const handleDistrictChange = (name: string) => {
    updateField("district", name)
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null

    if (file && file.size > MAX_FILE_SIZE) {
      setErrorMessage("Ukuran bukti pembayaran maksimal 5 MB.")
      setPaymentFile(null)
      event.target.value = ""
      return
    }

    if (file && !ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrorMessage("Format file harus JPG, PNG, atau PDF.")
      setPaymentFile(null)
      event.target.value = ""
      return
    }

    setPaymentFile(file)
    setErrorMessage("")
  }

  function goToStep(step: number) {
    setCurrentStep(step)
    setErrorMessage("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleNextStep() {
    const validationError = validateStep(currentStep, form)

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    goToStep(Math.min(3, currentStep + 1))
  }

  // SUBMIT PENGAJUAN

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setErrorMessage("")

    const validationError = validateSubmission(form, paymentFile)

    if (validationError || !paymentFile) {
      setErrorMessage(
        validationError ?? "Silakan upload bukti pembayaran."
      )

      if (validateStep(1, form)) {
        setCurrentStep(1)
      } else if (validateStep(2, form)) {
        setCurrentStep(2)
      } else {
        setCurrentStep(3)
      }

      return
    }

    if (!agreement) {
      setErrorMessage(
        "Silakan setujui pernyataan kebenaran data terlebih dahulu."
      )
      return
    }

    setLoading(true)

    let uploadedPath: string | null = null
    let submissionSaved = false

    try {
      // 1. Periksa sesi login

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          "Sesi login tidak ditemukan. Silakan login kembali."
        )
      }

      // 2. Upload bukti pembayaran

      const extension =
        paymentFile.name.split(".").pop()?.toLowerCase() || "file"

      const filePath =
        `payment-proofs/${user.id}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, paymentFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        throw new Error(
          `Gagal mengupload bukti pembayaran: ${uploadError.message}`
        )
      }

      uploadedPath = filePath

      // 3. Simpan data anggota

      const { error: memberError } = await supabase
        .from("member_details")
        .upsert(
          {
            user_id: user.id,
            ...formToMemberPayload(form),
          },
          { onConflict: "user_id" }
        )

      if (memberError) {
        throw new Error(
          `Gagal menyimpan data anggota: ${memberError.message}`
        )
      }

      // 4. Simpan pengajuan verifikasi

      const { error: verificationError } = await supabase
        .from("verification_submissions")
        .upsert(
          {
            user_id: user.id,
            amount: REGISTRATION_FEE,
            payment_proof_path: filePath,
            status: "submitted",
            admin_note: null,
            reviewed_by: null,
            reviewed_at: null,
          },
          { onConflict: "user_id" }
        )

      if (verificationError) {
        throw new Error(
          `Gagal menyimpan pengajuan: ${verificationError.message}`
        )
      }

      submissionSaved = true

      // 5. Perbarui status profil

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ verification_status: "pending" })
        .eq("id", user.id)

      if (profileError) {
        console.error(
          "Gagal memperbarui status profil:",
          profileError
        )
      }

      // 6. Tampilkan status menunggu verifikasi

      setSubmissionStatus("submitted")
      setSubmissionNote(null)
      setPaymentFile(null)
      setAgreement(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Verification submission error:", error)

      if (uploadedPath && !submissionSaved) {
        const { error: cleanupError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([uploadedPath])

        if (cleanupError) {
          console.error(
            "Gagal membersihkan file upload:",
            cleanupError
          )
        }
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan. Silakan coba lagi."
      )
    } finally {
      setLoading(false)
    }
  }

  // TAMPILAN LOADING

  if (checkingSubmission) {
    return (
      <div className="min-h-screen bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="size-5 animate-spin" />
            <span>Memeriksa status verifikasi...</span>
          </div>
        </div>

        <RegisteredDialog
          open={registeredDialogOpen}
          onClose={closeRegisteredDialog}
        />
      </div>
    )
  }

  // TAMPILAN DISETUJUI

  if (submissionStatus === "approved") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="size-8 text-emerald-700" />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Keanggotaan Disetujui
        </h1>

        <p className="max-w-md text-sm leading-6 text-slate-600">
          Pengajuan keanggotaan Anda telah disetujui. Silakan buka
          dashboard untuk melihat informasi keanggotaan Anda.
        </p>

        <Button
          onClick={() => router.replace(DASHBOARD_PATH)}
          className="bg-[#243B64] text-white hover:bg-[#1B2F50]"
        >
          Buka Dashboard
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    )
  }

  // TAMPILAN UTAMA

  return (
    <div className="min-h-screen bg-slate-50/60 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {submissionStatus === "submitted" ? (
          <PendingView />
        ) : (
          <>
            <FormProgress currentStep={currentStep} />

            {submissionStatus === "rejected" && (
              <Alert
                variant="destructive"
                className="mb-5 rounded-md bg-white"
              >
                <AlertCircle className="size-4" />
                <AlertTitle>Pengajuan Perlu Diperbaiki</AlertTitle>
                <AlertDescription className="leading-6">
                  {submissionNote ||
                    "Pengajuan Anda belum dapat disetujui. Periksa kembali data dan bukti pembayaran, kemudian kirim ulang pengajuan."}
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert
                variant="destructive"
                className="mb-5 rounded-md bg-white"
              >
                <AlertCircle className="size-4" />
                <AlertTitle>Periksa Kembali Data Anda</AlertTitle>
                <AlertDescription className="leading-6">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* TAHAP 1: DATA PRIBADI */}

              {currentStep === 1 && (
                <SectionCard
                  icon={UserRound}
                  title="Data Pribadi"
                  description="Masukkan informasi identitas dan alamat sesuai dokumen resmi."
                >
                  <div className="space-y-2">
                    <TextField
                      name="full_name"
                      label="Nama Lengkap"
                      placeholder="Masukkan nama lengkap"
                      value={form.full_name}
                      onChange={handleInputChange}
                      required
                    />

                    <p className="text-xs leading-5 text-slate-500">
                      Gunakan nama lengkap yang akan tercantum pada
                      data keanggotaan.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      name="title_prefix"
                      label="Gelar Depan"
                      placeholder="Contoh: Dr."
                      value={form.title_prefix}
                      onChange={handleInputChange}
                    />

                    <TextField
                      name="title_suffix"
                      label="Gelar Belakang"
                      placeholder="Contoh: S.Kom., M.Kom."
                      value={form.title_suffix}
                      onChange={handleInputChange}
                    />
                  </div>

                  <Separator className="bg-slate-200" />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      name="birth_place"
                      label="Tempat Lahir"
                      placeholder="Contoh: Cirebon"
                      value={form.birth_place}
                      onChange={handleInputChange}
                      required
                    />

                    <TextField
                      name="birth_date"
                      label="Tanggal Lahir"
                      type="date"
                      value={form.birth_date}
                      onChange={handleInputChange}
                      required
                    />

                    <SelectField
                      id="gender"
                      label="Jenis Kelamin"
                      placeholder="Pilih jenis kelamin"
                      value={form.gender}
                      options={GENDER_OPTIONS}
                      onChange={(value) =>
                        updateField("gender", value)
                      }
                    />
                  </div>

                  <Separator className="bg-slate-200" />

                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="text-sm font-medium text-slate-700"
                    >
                      Alamat Lengkap
                      <span className="ml-1 text-red-600">*</span>
                    </Label>

                    <Textarea
                      id="address"
                      name="address"
                      placeholder="Nama jalan, nomor rumah, RT/RW, dan detail alamat lainnya"
                      value={form.address}
                      onChange={handleInputChange}
                      className="min-h-28 resize-y rounded-md border-slate-300 bg-white shadow-none placeholder:text-slate-400 focus-visible:border-slate-500 focus-visible:ring-slate-200"
                      required
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <RegionCombobox
                      id="province"
                      label="Provinsi"
                      required
                      value={form.province}
                      options={provinces.options}
                      loading={provinces.loading}
                      error={provinces.error}
                      onChange={handleProvinceChange}
                      placeholder="Pilih provinsi"
                      searchPlaceholder="Cari provinsi..."
                    />

                    <RegionCombobox
                      id="city"
                      label="Kota/Kabupaten"
                      required
                      value={form.city}
                      options={regencies.options}
                      loading={regencies.loading}
                      error={regencies.error}
                      disabled={!provinceId}
                      onChange={handleCityChange}
                      placeholder={
                        provinceId
                          ? "Pilih kota/kabupaten"
                          : "Pilih provinsi dulu"
                      }
                      searchPlaceholder="Cari kota/kabupaten..."
                    />

                    <RegionCombobox
                      id="district"
                      label="Kecamatan"
                      required
                      value={form.district}
                      options={districts.options}
                      loading={districts.loading}
                      error={districts.error}
                      disabled={!regencyId}
                      onChange={handleDistrictChange}
                      placeholder={
                        regencyId
                          ? "Pilih kecamatan"
                          : "Pilih kota/kabupaten dulu"
                      }
                      searchPlaceholder="Cari kecamatan..."
                    />

                    <TextField
                      name="postal_code"
                      label="Kode Pos"
                      inputMode="numeric"
                      placeholder="Contoh: 45131"
                      value={form.postal_code}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </SectionCard>
              )}

              {/* TAHAP 2: DATA PROFESIONAL */}

              {currentStep === 2 && (
                <SectionCard
                  icon={BriefcaseBusiness}
                  title="Data Profesional"
                  description="Informasi pekerjaan, pendidikan, dan kompetensi profesional Anda."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      name="occupation"
                      label="Pekerjaan"
                      placeholder="Contoh: Software Engineer"
                      value={form.occupation}
                      onChange={handleInputChange}
                      required
                    />

                    <TextField
                      name="institution_name"
                      label="Nama Instansi"
                      placeholder="Nama perusahaan atau instansi"
                      value={form.institution_name}
                      onChange={handleInputChange}
                      required
                    />

                    <TextField
                      name="position"
                      label="Jabatan"
                      placeholder="Contoh: Manajer IT"
                      value={form.position}
                      onChange={handleInputChange}
                    />

                    <SelectField
                      id="education"
                      label="Pendidikan Terakhir"
                      placeholder="Pilih pendidikan terakhir"
                      value={form.education}
                      options={EDUCATION_OPTIONS}
                      onChange={(value) =>
                        updateField("education", value)
                      }
                    />
                  </div>

                  <Separator className="bg-slate-200" />

                  <div className="space-y-2">
                    <Label
                      htmlFor="competencies"
                      className="text-sm font-medium text-slate-700"
                    >
                      Kompetensi yang Dikuasai
                      <span className="ml-1 text-red-600">*</span>
                    </Label>

                    <Textarea
                      id="competencies"
                      name="competencies"
                      placeholder="Contoh: Pemrograman Web, Data Science, Artificial Intelligence, Manajemen Proyek..."
                      value={form.competencies}
                      onChange={handleInputChange}
                      className="min-h-32 resize-y rounded-md border-slate-300 bg-white shadow-none placeholder:text-slate-400 focus-visible:border-slate-500 focus-visible:ring-slate-200"
                      required
                    />

                    <p className="text-xs leading-5 text-slate-500">
                      Tuliskan kompetensi yang relevan dengan bidang
                      pekerjaan atau keahlian Anda. Pisahkan beberapa
                      kompetensi dengan koma.
                    </p>
                  </div>

                  <div className="space-y-2 sm:max-w-xs">
                    <Label
                      htmlFor="work_experience_years"
                      className="text-sm font-medium text-slate-700"
                    >
                      Lama Pengalaman Kerja
                    </Label>

                    <div className="relative">
                      <Input
                        id="work_experience_years"
                        name="work_experience_years"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.work_experience_years}
                        onChange={handleInputChange}
                        className="h-11 rounded-md border-slate-300 bg-white pr-16 shadow-none"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                        tahun
                      </span>
                    </div>
                  </div>

                  <Separator className="bg-slate-200" />

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Profil Profesional
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Tautan berikut bersifat opsional.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <TextField
                        name="linkedin_url"
                        label="LinkedIn"
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={form.linkedin_url}
                        onChange={handleInputChange}
                      />

                      <TextField
                        name="website_url"
                        label="Situs Web"
                        type="url"
                        placeholder="https://website.com"
                        value={form.website_url}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* TAHAP 3: PEMBAYARAN */}

              {currentStep === 3 && (
                <>
                  <SectionCard
                    icon={CreditCard}
                    title="Pembayaran"
                    description="Lakukan pembayaran biaya pendaftaran dan lampirkan bukti transfer."
                  >
                    <div className="rounded-lg border border-slate-200">
                      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                        <p className="text-sm text-slate-500">
                          Biaya Pendaftaran
                        </p>

                        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                          Rp{REGISTRATION_FEE.toLocaleString("id-ID")}
                        </p>
                      </div>

                      <div className="space-y-4 px-5 py-5 sm:px-6">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Informasi Rekening
                        </h3>

                        <div className="divide-y divide-slate-100">
                          {BANK_INFO.map((item) => (
                            <div
                              key={item.label}
                              className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[160px_1fr] sm:gap-5"
                            >
                              <p className="text-sm text-slate-500">
                                {item.label}
                              </p>

                              <p
                                className={`wrap-break-word text-sm text-slate-900 sm:text-right ${
                                  "strong" in item
                                    ? "font-semibold tracking-wide"
                                    : "font-medium"
                                }`}
                              >
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold text-slate-800">
                          Bukti Pembayaran
                          <span className="ml-1 text-red-600">*</span>
                        </Label>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Pastikan bukti transfer jelas dan nominal
                          pembayaran dapat dibaca.
                        </p>
                      </div>

                      <Input
                        ref={fileInputRef}
                        id="payment_proof"
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-6">
                        {paymentFile ? (
                          <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                              <FileCheck2 className="size-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="break-all text-sm font-medium text-slate-900">
                                {paymentFile.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {(
                                  paymentFile.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>

                            <CheckCircle2 className="mt-1 size-5 shrink-0 text-emerald-700" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <Upload className="size-6 text-slate-500" />

                            <p className="mt-3 text-sm font-medium text-slate-800">
                              Belum ada file yang dipilih
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              JPG, PNG, atau PDF · Maksimal 5 MB
                            </p>
                          </div>
                        )}

                        <div className="mt-4 flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-md border-slate-300 text-slate-700 hover:bg-slate-50"
                            onClick={() =>
                              fileInputRef.current?.click()
                            }
                          >
                            <Upload className="mr-2 size-4" />
                            {paymentFile ? "Ganti File" : "Pilih File"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <Card className="rounded-lg border-slate-200 bg-white shadow-none">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="agreement"
                          checked={agreement}
                          onCheckedChange={(checked) =>
                            setAgreement(checked === true)
                          }
                          className="mt-1"
                        />

                        <div className="space-y-1">
                          <Label
                            htmlFor="agreement"
                            className="cursor-pointer text-sm font-semibold text-slate-900"
                          >
                            Pernyataan Kebenaran Data
                          </Label>

                          <p className="text-sm leading-6 text-slate-600">
                            Saya menyatakan bahwa seluruh data yang saya
                            masukkan adalah benar dan dapat
                            dipertanggungjawabkan. Saya memahami bahwa
                            data dan bukti pembayaran akan diperiksa
                            oleh administrator sebelum keanggotaan
                            disetujui.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* NAVIGASI TAHAP */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  disabled={currentStep === 1 || loading}
                  onClick={() => goToStep(currentStep - 1)}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Kembali
                </Button>

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    className="h-10 rounded-md"
                    onClick={handleNextStep}
                  >
                    Lanjutkan
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="h-10 rounded-md"
                    disabled={loading || !agreement}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Mengirim Pengajuan...
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="mr-2 size-4" />
                        {submissionStatus === "rejected"
                          ? "Kirim Ulang Pengajuan"
                          : "Kirim Pengajuan Verifikasi"}
                      </>
                    )}
                  </Button>
                )}
              </div>

              <p className="text-center text-xs leading-5 text-slate-500">
                Data Anda akan diproses untuk keperluan verifikasi
                keanggotaan.
              </p>
            </form>
          </>
        )}

        <RegisteredDialog
          open={registeredDialogOpen}
          onClose={closeRegisteredDialog}
        />
      </div>
    </div>
  )
}

// =====================================================
// EXPORT
// =====================================================

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="size-5 animate-spin text-slate-500" />
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  )
}
