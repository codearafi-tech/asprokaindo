import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Mail,
  Phone,
  Users,
  Wallet,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteParticipantButton } from "./delete-participant-button"
import { AttendanceProofReview } from "./attendance-proof-review"
import { IssueCertificatesButton } from "./issue-certificates-button"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type PageProps = {
  params: Promise<{ id: string }>
}

type Participant = {
  id: string
  full_name: string | null
  member_number: string | null
  email: string | null
  phone: string | null
  status: string | null
  registered_at: string | null
  attendance_status: string | null
  proof_status: string | null
  attendance_proof_path: string | null
  attendance_proof_status: string | null
  attendance_proof_submitted_at: string | null
  attendance_proof_admin_note: string | null
}

type Activity = {
  id: string
  title: string
  type: string | null
  status: string | null
  start_at: string | null
  is_paid: boolean
  registration_fee: number | null
  organizer: string | null
  certificate_title: string | null
}

function formatDate(date: string | null) {
  if (!date) return "-"

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(parsedDate)
}

function formatRupiah(amount: number | null) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount ?? 0)
}

function formatActivityType(type: string | null) {
  switch (type) {
    case "training":
      return "Pelatihan"
    case "workshop":
      return "Workshop"
    case "webinar":
      return "Webinar"
    default:
      return type || "Kegiatan"
  }
}

function formatActivityStatus(status: string | null) {
  switch (status) {
    case "draft":
      return "Draft"
    case "published":
      return "Dipublikasikan"
    case "completed":
      return "Selesai"
    case "cancelled":
      return "Dibatalkan"
    default:
      return status || "Tidak diketahui"
  }
}

function RegistrationBadge({ status }: { status: string | null }) {
  switch (status) {
    case "registered":
      return <Badge>Terdaftar</Badge>

    case "cancelled":
      return <Badge variant="destructive">Dibatalkan</Badge>

    default:
      return <Badge variant="secondary">{status || "Tidak diketahui"}</Badge>
  }
}

function PaymentBadge({ status }: { status: string | null }) {
  switch (status) {
    case "approved":
      return (
        <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          <CheckCircle2 className="size-3.5" />
          Terverifikasi
        </Badge>
      )

    case "pending":
      return (
        <Badge className="gap-1 border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
          <Clock3 className="size-3.5" />
          Menunggu
        </Badge>
      )

    case "rejected":
      return <Badge variant="destructive">Ditolak</Badge>

    case "not_submitted":
    case null:
      return <Badge variant="outline">Belum Bayar</Badge>

    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function AttendanceBadge({ status }: { status: string | null }) {
  switch (status) {
    case "present":
      return (
        <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          Hadir
        </Badge>
      )

    case "absent":
      return <Badge variant="destructive">Tidak Hadir</Badge>

    default:
      return <Badge variant="outline">Belum Dicatat</Badge>
  }
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}: {
  title: string
  value: number | string
  description: string
  icon: typeof Users
  iconClassName: string
}) {
  return (
    <Card className="min-w-0">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function ParticipantsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Autentikasi
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Validasi admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Ambil data kegiatan
  const { data: activityData, error: activityError } = await supabase
    .from("activities")
    .select(
      "id, title, type, status, start_at, is_paid, registration_fee, organizer, certificate_title"
    )
    .eq("id", id)
    .maybeSingle()

  if (activityError) {
    console.error("Gagal mengambil data kegiatan:", activityError)
    throw new Error("Gagal mengambil data kegiatan.")
  }

  if (!activityData) {
    notFound()
  }

  const activity = activityData as Activity

  // Ambil data peserta
  const { data: participantData, error: participantsError } = await supabase
    .from("activity_registrations")
    .select(
      `
    id,
    full_name,
    member_number,
    email,
    phone,
    status,
    registered_at,
    attendance_status,
    proof_status,
    attendance_proof_path,
    attendance_proof_status,
    attendance_proof_submitted_at,
    attendance_proof_admin_note
        `
    )
    .eq("activity_id", id)
    .neq("status", "cancelled")
    .order("registered_at", { ascending: false })

  if (participantsError) {
    console.error("Gagal mengambil data peserta:", participantsError)
    throw new Error("Gagal mengambil data peserta kegiatan.")
  }

  const participants = (participantData ?? []) as Participant[]

  const { data: certificateData, error: certificateError } = await supabase
    .from("activity_certificates")
    .select("id, registration_id")
    .eq("activity_id", id)

  if (certificateError) {
    console.error("Gagal mengambil data sertifikat:", certificateError)
    throw new Error("Gagal mengambil data sertifikat kegiatan.")
  }

  const certificates = certificateData ?? []

  const issuedRegistrationIds = new Set(
    certificates.map((certificate) => certificate.registration_id)
  )

  const unfinalizedAttendanceCount = participants.filter(
    (participant) =>
      participant.attendance_proof_status !== "approved" &&
      participant.attendance_proof_status !== "rejected"
  ).length

  const eligibleParticipantsCount = participants.filter(
    (participant) => participant.attendance_proof_status === "approved"
  ).length

  const alreadyIssuedCount = participants.filter((participant) =>
    issuedRegistrationIds.has(participant.id)
  ).length

  const canIssueCertificates =
    activity.status === "completed" &&
    unfinalizedAttendanceCount === 0 &&
    eligibleParticipantsCount > 0

  const participantsWithProof = await Promise.all(
    participants.map(async (participant) => {
      if (!participant.attendance_proof_path) {
        return { ...participant, attendanceProofUrl: null }
      }

      const { data, error } = await supabase.storage
        .from("attendance-proofs")
        .createSignedUrl(participant.attendance_proof_path, 60 * 30)

      if (error) {
        console.error("Gagal membuka bukti daftar hadir:", error.message)
      }

      return {
        ...participant,
        attendanceProofUrl: data?.signedUrl ?? null,
      }
    })
  )

  // Statistik peserta
  const totalParticipants = participants.length

  const approvedPayments = participants.filter(
    (participant) =>
      participant.status === "registered" &&
      participant.proof_status === "approved"
  ).length

  const pendingPayments = participants.filter(
    (participant) =>
      participant.status === "registered" &&
      participant.proof_status === "pending"
  ).length

  const unpaidPayments = participants.filter(
    (participant) =>
      participant.status === "registered" &&
      (!participant.proof_status ||
        participant.proof_status === "not_submitted" ||
        participant.proof_status === "rejected")
  ).length

  return (
    <main className="w-full max-w-full min-w-0">
      <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6">
        {/* Header */}
        <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Daftar Peserta
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola dan pantau pendaftaran peserta kegiatan.
              </p>
            </div>
          </div>

          <Button asChild variant="outline" className="w-fit shrink-0">
            <Link href="/admin/manajemen/kegiatan">
              <ArrowLeft className="mr-2 size-4" />
              Kembali
            </Link>
          </Button>
        </header>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="font-semibold">Sertifikat Kegiatan</h2>

              <p className="text-sm text-muted-foreground">
                {activity.status !== "completed"
                  ? "Selesaikan kegiatan terlebih dahulu untuk membuka penerbitan sertifikat."
                  : unfinalizedAttendanceCount > 0
                    ? `${unfinalizedAttendanceCount} peserta masih menunggu keputusan akhir kehadiran.`
                    : eligibleParticipantsCount === 0
                      ? "Belum ada peserta yang memenuhi syarat menerima sertifikat."
                      : `${eligibleParticipantsCount} peserta memenuhi syarat menerima sertifikat.`}
              </p>

              <p className="text-xs text-muted-foreground">
                {alreadyIssuedCount} sertifikat sudah tersimpan. Sertifikat yang
                sudah diterbitkan tidak dibuat ulang.
              </p>
            </div>

            <IssueCertificatesButton
              activityId={activity.id}
              disabled={!canIssueCertificates}
              alreadyIssued={alreadyIssuedCount > 0}
            />
          </CardContent>
        </Card>

        {/* Informasi kegiatan */}
        {/* Informasi Kegiatan + Statistik */}
        <Card className="w-full min-w-0 overflow-hidden">
          <div className="h-1 w-full bg-primary" />

          <CardContent className="p-5 md:p-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              {/* Informasi Kegiatan */}
              <div className="flex min-w-0 flex-col justify-center gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {formatActivityType(activity.type)}
                  </Badge>

                  <Badge variant="secondary">
                    {formatActivityStatus(activity.status)}
                  </Badge>

                  {activity.is_paid ? (
                    <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
                      <Wallet className="mr-1 size-3.5" />
                      Berbayar
                    </Badge>
                  ) : (
                    <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      Gratis
                    </Badge>
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight wrap-break-word md:text-2xl">
                    {activity.title}
                  </h2>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 shrink-0" />
                      <span>{formatDate(activity.start_at)}</span>
                    </div>

                    {activity.is_paid && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="size-4 shrink-0" />
                        <span>{formatRupiah(activity.registration_fee)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistik Ringkas */}
              <div
                className={`grid grid-cols-1 gap-3 ${
                  activity.is_paid
                    ? "sm:grid-cols-3 lg:w-105"
                    : "sm:grid-cols-1 lg:w-45"
                }`}
              >
                {/* Total Peserta */}
                <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Users className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Total Peserta
                    </p>
                    <p className="text-xl leading-tight font-bold">
                      {totalParticipants}
                    </p>
                  </div>
                </div>

                {/* Statistik Pembayaran hanya untuk kegiatan berbayar */}
                {activity.is_paid && (
                  <>
                    <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <CheckCircle2 className="size-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Terverifikasi
                        </p>
                        <p className="text-xl leading-tight font-bold">
                          {approvedPayments}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <Clock3 className="size-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Menunggu
                        </p>
                        <p className="text-xl leading-tight font-bold">
                          {pendingPayments}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Judul tabel tanpa Card */}
        <section className="w-full min-w-0 space-y-4">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">
                Peserta Terdaftar
              </h2>
              <p className="text-sm text-muted-foreground">
                Daftar peserta yang mengikuti kegiatan ini.
              </p>
            </div>

            <Badge variant="secondary" className="w-fit shrink-0">
              {totalParticipants} peserta
            </Badge>
          </div>

          {/* Hanya tabel ini yang scroll horizontal */}
          <div className="w-full max-w-full min-w-0 overflow-hidden rounded-xl border bg-background">
            <div className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain">
              <Table className="min-w-262.5">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">No.</TableHead>
                    <TableHead className="min-w-50">Peserta</TableHead>
                    <TableHead className="min-w-42.5">Nomor Anggota</TableHead>
                    <TableHead className="min-w-57.5">Kontak</TableHead>
                    <TableHead className="min-w-45">Tanggal Daftar</TableHead>
                    <TableHead className="min-w-42.5">
                      Status Pendaftaran
                    </TableHead>
                    <TableHead className="min-w-42.5">
                      {activity.is_paid ? "Status Pembayaran" : "Biaya"}
                    </TableHead>
                    <TableHead className="min-w-37.5">Kehadiran</TableHead>
                    <TableHead className="min-w-30 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {participantsWithProof.length > 0 ? (
                    participantsWithProof.map((participant, index) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">
                            {participant.full_name || "Tanpa nama"}
                          </p>
                        </TableCell>

                        <TableCell>
                          {participant.member_number ? (
                            <span className="font-mono text-sm whitespace-nowrap">
                              {participant.member_number}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            {participant.email && (
                              <div className="flex items-start gap-2 text-sm">
                                <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                <span className="break-all">
                                  {participant.email}
                                </span>
                              </div>
                            )}

                            {participant.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="size-4 shrink-0" />
                                <span>{participant.phone}</span>
                              </div>
                            )}

                            {!participant.email && !participant.phone && (
                              <span className="text-sm text-muted-foreground">
                                Tidak ada kontak
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          {formatDate(participant.registered_at)}
                        </TableCell>

                        <TableCell>
                          <RegistrationBadge status={participant.status} />
                        </TableCell>

                        <TableCell>
                          {activity.is_paid ? (
                            <PaymentBadge status={participant.proof_status} />
                          ) : (
                            <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              Gratis
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-max items-center gap-2">
                            {participant.attendance_proof_status ===
                            "approved" ? (
                              <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                <CheckCircle2 className="mr-1 size-3.5" />
                                Hadir
                              </Badge>
                            ) : participant.attendance_proof_status ===
                              "pending" ? (
                              <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
                                <Clock3 className="mr-1 size-3.5" />
                                Menunggu Verifikasi
                              </Badge>
                            ) : participant.attendance_proof_status ===
                              "rejected" ? (
                              <Badge variant="destructive">Bukti Ditolak</Badge>
                            ) : (
                              <Badge variant="outline">Belum Mengirim</Badge>
                            )}

                            <AttendanceProofReview
                              registrationId={participant.id}
                              participantName={
                                participant.full_name || "Peserta"
                              }
                              proofPath={participant.attendance_proof_path}
                              proofUrl={participant.attendanceProofUrl}
                              proofStatus={participant.attendance_proof_status}
                              proofSubmittedAt={
                                participant.attendance_proof_submitted_at
                              }
                              adminNote={
                                participant.attendance_proof_admin_note
                              }
                            />
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <DeleteParticipantButton
                            registrationId={participant.id}
                            participantName={
                              participant.full_name || "peserta ini"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-44 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                            <Users className="size-6 text-muted-foreground" />
                          </div>

                          <div className="space-y-1">
                            <p className="font-medium">Belum ada peserta</p>
                            <p className="text-sm text-muted-foreground">
                              Peserta yang mendaftar akan muncul di sini.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
