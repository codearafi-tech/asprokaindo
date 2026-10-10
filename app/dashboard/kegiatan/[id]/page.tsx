import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import {
  registerForActivity,
  submitAttendanceProof,
  submitPaymentProof,
} from "./action"

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Video,
  UserRound,
  Award,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    registered?: string
    error?: string
    payment?: string
    attendance?: string
  }>
}

function formatDateTime(date: string | null) {
  if (!date) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date))
}

function formatRupiah(amount: number | string | null) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0))
}

const errorMessages: Record<string, string> = {
  required: "Semua kolom pendaftaran wajib diisi.",
  invalid: "Periksa kembali data yang kamu masukkan.",
  not_open: "Pendaftaran kegiatan belum dibuka.",
  closed: "Periode pendaftaran kegiatan sudah berakhir.",
  activity: "Kegiatan tidak ditemukan atau belum diterbitkan.",
  database: "Status pendaftaran gagal diperiksa.",
  registration: "Pendaftaran gagal. Silakan coba lagi.",
  payment_file: "Pilih file bukti pembayaran terlebih dahulu.",
  payment_invalid:
    "Bukti pembayaran harus berupa JPG, PNG, atau WEBP maksimal 5 MB.",
  payment_upload: "Bukti pembayaran gagal diunggah.",
  payment_database: "Bukti pembayaran gagal disimpan ke database.",
  payment_required:
    "Pembayaran harus disetujui sebelum mengunggah bukti kehadiran.",
  attendance_file: "Pilih foto bukti kehadiran terlebih dahulu.",
  attendance_invalid: "Foto harus berupa JPG, PNG, atau WEBP maksimal 5 MB.",
  attendance_upload: "Bukti kehadiran gagal diunggah.",
  attendance_database: "Bukti kehadiran gagal disimpan ke database.",
}

function paymentStatusLabel(status: string | null) {
  switch (status) {
    case "approved":
      return "Disetujui"
    case "pending":
      return "Menunggu verifikasi"
    case "rejected":
      return "Ditolak"
    default:
      return "Belum diunggah"
  }
}

function attendanceStatusLabel(status: string | null) {
  switch (status) {
    case "approved":
      return "Disetujui"
    case "pending":
      return "Menunggu verifikasi"
    case "rejected":
      return "Ditolak"
    default:
      return "Belum diunggah"
  }
}

export default async function DetailKegiatanPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select(
      `
      id,
      title,
      type,
      status,
      description,
      start_at,
      end_at,
      registration_start_at,
      registration_end_at,
      location_type,
      location,
      organizer,
      certificate_title,
      image_path,
      is_paid,
      registration_fee
    `
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle()

  if (activityError) {
    console.error("Gagal mengambil kegiatan:", activityError.message)
    throw new Error("Detail kegiatan gagal dimuat.")
  }

  if (!activity) notFound()

  const { data: registration, error: registrationError } = await supabase
    .from("activity_registrations")
    .select(
      `
      id,
      full_name,
      member_number,
      phone,
      status,
      attendance_status,
      proof_path,
      proof_status,
      proof_admin_note,
      attendance_proof_path,
      attendance_proof_status,
      attendance_proof_admin_note
    `
    )
    .eq("activity_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (registrationError) {
    console.error("Gagal memeriksa pendaftaran:", registrationError.message)
    throw new Error("Status pendaftaran gagal dimuat.")
  }

  const isRegistered = !!registration && registration.status !== "cancelled"

  const now = Date.now()

  const beforeStart =
    !!activity.registration_start_at &&
    now < new Date(activity.registration_start_at).getTime()

  const afterEnd =
    !!activity.registration_end_at &&
    now > new Date(activity.registration_end_at).getTime()

  const registrationOpen = !beforeStart && !afterEnd

  const isOnline = activity.location_type === "online"
  const isHybrid = activity.location_type === "hybrid"
  const isPaid = activity.is_paid === true

  const paymentApproved =
    isRegistered && (!isPaid || registration.proof_status === "approved")

  let zoomUrl: string | null = null

  if (paymentApproved && (isOnline || isHybrid)) {
    const { data: accessLink, error: accessError } = await supabase
      .from("activity_access_links")
      .select("zoom_url")
      .eq("activity_id", activity.id)
      .maybeSingle()

    if (accessError) {
      console.error("Gagal mengambil link Zoom:", accessError.message)
    } else {
      zoomUrl = accessLink?.zoom_url ?? null
    }
  }

  let flyerUrl: string | null = null

  if (activity.image_path) {
    const { data, error: flyerError } = await supabase.storage
      .from("activity-flyers")
      .createSignedUrl(activity.image_path, 3600)

    if (flyerError) {
      console.error("Gagal mengambil poster:", flyerError.message)
    } else {
      flyerUrl = data.signedUrl
    }
  }

  // Status bukti kehadiran dari database
  const attendanceStatus = isRegistered
    ? registration.attendance_proof_status
    : null

  // Kartu kehadiran hanya ditampilkan jika peserta memenuhi syarat.
  const showAttendanceCard = isRegistered && paymentApproved

  const showAttendanceForm =
    showAttendanceCard && (!attendanceStatus || attendanceStatus === "rejected")

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <Button asChild variant="ghost" className="-ml-3 gap-2">
        <Link href="/dashboard/kegiatan">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke kegiatan
        </Link>
      </Button>

      {query.registered === "1" && isRegistered && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Pendaftaran berhasil. Silakan lanjutkan proses pembayaran jika
          kegiatan ini berbayar.
        </div>
      )}

      {query.payment === "submitted" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Bukti pembayaran berhasil dikirim dan sedang menunggu verifikasi
          admin.
        </div>
      )}

      {query.payment === "approved" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Pembayaran kamu telah disetujui.
        </div>
      )}

      {query.attendance === "submitted" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Bukti kehadiran berhasil dikirim dan sedang menunggu verifikasi admin.
        </div>
      )}

      {query.attendance === "pending" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Bukti kehadiran sudah dikirim dan sedang menunggu verifikasi admin.
          Kamu tidak dapat mengirim bukti baru sebelum proses verifikasi
          selesai.
        </div>
      )}

      {query.attendance === "approved" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Bukti kehadiran kamu telah disetujui.
        </div>
      )}

      {query.error && errorMessages[query.error] && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessages[query.error]}
        </div>
      )}

      <Card className="overflow-hidden rounded-2xl">
        {flyerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flyerUrl}
            alt={`Poster ${activity.title}`}
            className="h-100 w-full bg-muted object-cover"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-muted">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        <CardContent className="space-y-6 p-5 md:p-8">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {activity.type === "training"
                  ? "Pelatihan"
                  : activity.type === "workshop"
                    ? "Workshop"
                    : activity.type === "webinar"
                      ? "Webinar"
                      : "Kegiatan"}
              </Badge>

              <Badge variant={isPaid ? "outline" : "secondary"}>
                {isPaid ? "Berbayar" : "Gratis"}
              </Badge>

              {isRegistered && (
                <Badge className="bg-emerald-600 hover:bg-emerald-600">
                  Sudah Terdaftar
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {activity.title}
            </h1>

            <p className="text-sm leading-7 whitespace-pre-line text-muted-foreground">
              {activity.description || "Deskripsi kegiatan belum tersedia."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border p-4">
              <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Jadwal kegiatan</p>
                <p className="mt-1 font-medium">
                  {formatDateTime(activity.start_at)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sampai {formatDateTime(activity.end_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border p-4">
              {isOnline ? (
                <Video className="mt-0.5 h-5 w-5 text-muted-foreground" />
              ) : (
                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
              )}

              <div>
                <p className="text-sm text-muted-foreground">Lokasi</p>
                <p className="mt-1 font-medium">
                  {isOnline
                    ? "Online melalui Zoom"
                    : isHybrid
                      ? `Hybrid${activity.location ? ` — ${activity.location}` : ""}`
                      : activity.location || "Belum ditentukan"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border p-4 sm:col-span-2">
              <Clock3 className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Periode pendaftaran
                </p>
                <p className="mt-1 font-medium">
                  {formatDateTime(activity.registration_start_at)}
                  {" — "}
                  {formatDateTime(activity.registration_end_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border p-4 sm:col-span-2">
              <Award className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Biaya pendaftaran
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {isPaid ? formatRupiah(activity.registration_fee) : "Gratis"}
                </p>
                {isPaid && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Unggah bukti transfer setelah mendaftar. Akses Zoom akan
                    tersedia setelah pembayaran disetujui.
                  </p>
                )}
              </div>
            </div>
          </div>

          {(isOnline || isHybrid) && (
            <div className="rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <Video className="mt-1 h-5 w-5 text-muted-foreground" />
                <div className="flex-1 space-y-2">
                  <h2 className="font-semibold">Akses Zoom</h2>

                  {zoomUrl ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Pembayaran dan pendaftaran kamu sudah memenuhi syarat
                        akses.
                      </p>
                      <a
                        href={zoomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-sm font-medium text-primary underline underline-offset-4"
                      >
                        Bergabung melalui Zoom
                      </a>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {!isRegistered
                        ? "Link Zoom hanya tersedia untuk peserta terdaftar."
                        : isPaid && !paymentApproved
                          ? "Link Zoom akan tersedia setelah pembayaran disetujui admin."
                          : "Link Zoom belum tersedia. Silakan periksa kembali nanti."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isRegistered ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
                <h2 className="font-semibold">Data pendaftaran kamu</h2>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Nama</p>
                    <p className="mt-1 font-medium">{registration.full_name}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Nomor anggota</p>
                    <p className="mt-1 font-medium">
                      {registration.member_number || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Nomor telepon</p>
                    <p className="mt-1 font-medium">
                      {registration.phone || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Status pendaftaran</p>
                    <p className="mt-1 font-medium">Terdaftar</p>
                  </div>
                </div>
              </div>

              {isPaid && (
                <Card className="rounded-xl shadow-none">
                  <CardHeader>
                    <CardTitle className="text-lg">Bukti pembayaran</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Nominal: {formatRupiah(activity.registration_fee)}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-3">
                      <span className="text-sm text-muted-foreground">
                        Status pembayaran
                      </span>
                      <Badge
                        variant={
                          registration.proof_status === "approved"
                            ? "default"
                            : registration.proof_status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {paymentStatusLabel(registration.proof_status)}
                      </Badge>
                    </div>

                    {registration.proof_status !== "approved" && (
                      <form
                        action={submitPaymentProof.bind(null, activity.id)}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="payment_proof">
                            Pilih foto bukti transfer
                          </Label>
                          <Input
                            id="payment_proof"
                            name="payment_proof"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG, atau WEBP. Maksimal 5 MB.
                          </p>
                        </div>

                        <Button type="submit" className="w-full sm:w-auto">
                          Kirim bukti pembayaran
                        </Button>
                      </form>
                    )}

                    {registration.proof_status === "approved" && (
                      <p className="text-sm text-emerald-700">
                        Pembayaran disetujui. Kamu dapat mengikuti kegiatan
                        sesuai jadwal.
                      </p>
                    )}

                    {registration.proof_status === "rejected" && (
                      <p className="text-sm text-destructive">
                        Bukti pembayaran ditolak. Silakan periksa kembali dan
                        unggah ulang.
                        {registration.proof_admin_note
                          ? ` Catatan admin: ${registration.proof_admin_note}`
                          : ""}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {showAttendanceCard && (
                <Card className="rounded-xl shadow-none">
                  <CardHeader>
                    <CardTitle className="text-lg">Bukti kehadiran</CardTitle>

                    <p className="text-sm text-muted-foreground">
                      {attendanceStatus === "pending"
                        ? "Bukti kehadiran sudah dikirim dan sedang menunggu verifikasi admin."
                        : attendanceStatus === "approved"
                          ? "Bukti kehadiran kamu telah disetujui admin."
                          : attendanceStatus === "rejected"
                            ? "Bukti kehadiran ditolak. Silakan perbaiki sesuai catatan admin dan unggah ulang."
                            : "Unggah foto sebagai bukti kehadiran kegiatan."}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-3">
                      <span className="text-sm text-muted-foreground">
                        Status kehadiran
                      </span>

                      <Badge
                        variant={
                          attendanceStatus === "rejected"
                            ? "destructive"
                            : attendanceStatus === "approved"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {attendanceStatusLabel(attendanceStatus)}
                      </Badge>
                    </div>

                    {attendanceStatus === "pending" && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                        Bukti kehadiran sudah diterima. Kamu tidak dapat
                        mengirim bukti baru sampai admin menyelesaikan
                        verifikasi.
                      </div>
                    )}

                    {attendanceStatus === "rejected" && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <p className="font-medium">Bukti kehadiran ditolak</p>

                        {registration.attendance_proof_admin_note ? (
                          <p className="mt-1 whitespace-pre-line">
                            Catatan admin:{" "}
                            {registration.attendance_proof_admin_note}
                          </p>
                        ) : (
                          <p className="mt-1">
                            Silakan unggah ulang bukti kehadiran yang sesuai.
                          </p>
                        )}
                      </div>
                    )}

                    {attendanceStatus === "approved" && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        Bukti kehadiran kamu telah disetujui.
                      </div>
                    )}

                    {showAttendanceForm && (
                      <form
                        action={submitAttendanceProof.bind(null, activity.id)}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="attendance_proof">
                            {attendanceStatus === "rejected"
                              ? "Pilih foto bukti kehadiran baru"
                              : "Pilih foto bukti kehadiran"}
                          </Label>

                          <Input
                            id="attendance_proof"
                            name="attendance_proof"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            required
                          />

                          <p className="text-xs text-muted-foreground">
                            JPG, PNG, atau WEBP. Maksimal 5 MB.
                          </p>
                        </div>

                        <Button type="submit" className="w-full sm:w-auto">
                          {attendanceStatus === "rejected"
                            ? "Kirim Ulang Bukti Kehadiran"
                            : "Kirim Bukti Kehadiran"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="rounded-xl shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Daftar kegiatan</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Isi data peserta untuk mendaftarkan diri ke kegiatan ini.
                  {isPaid
                    ? ` Biaya pendaftaran ${formatRupiah(activity.registration_fee)}.`
                    : " Kegiatan ini gratis."}
                </p>
              </CardHeader>

              <CardContent>
                {!registrationOpen ? (
                  <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                    {beforeStart
                      ? "Pendaftaran belum dibuka."
                      : "Pendaftaran sudah ditutup."}
                  </p>
                ) : (
                  <form
                    action={registerForActivity.bind(null, activity.id)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nama lengkap</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        placeholder="Masukkan nama lengkap"
                        autoComplete="name"
                        maxLength={150}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="member_number">Nomor anggota</Label>
                      <Input
                        id="member_number"
                        name="member_number"
                        placeholder="Contoh: ASPROKAINDO-2026-001"
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Nomor telepon</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="Contoh: 08xxxxxxxxxx"
                        autoComplete="tel"
                        maxLength={30}
                        required
                      />
                    </div>

                    {isPaid && (
                      <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div>
                          <Label htmlFor="payment_proof">
                            Bukti pembayaran{" "}
                            <span className="text-red-600">*</span>
                          </Label>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Unggah bukti transfer sebesar{" "}
                            {formatRupiah(activity.registration_fee)}.
                          </p>
                        </div>

                        <Input
                          id="payment_proof"
                          name="payment_proof"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          required
                        />

                        <p className="text-xs text-muted-foreground">
                          JPG, PNG, atau WEBP. Maksimal 5 MB.
                        </p>
                      </div>
                    )}

                    <Button type="submit" className="w-full gap-2 sm:w-auto">
                      <UserRound className="h-4 w-4" />
                      Daftar Sekarang
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          <p className="text-sm text-muted-foreground">
            Penyelenggara: {activity.organizer || "ASPROKAINDONESIA"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
