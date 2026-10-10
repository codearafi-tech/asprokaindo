import Link from "next/link"
import { redirect } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  Award,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileBadge,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Registration = {
  id: string
  activity_id: string
  status: string | null
  registered_at: string | null
}

type Activity = {
  id: string
  title: string
  type: string | null
  status: string | null
  start_at: string | null
}

type Certificate = {
  id: string
  certificate_number: string
  issued_at: string
  activity_title: string | null
  certificate_title: string | null
  organizer: string | null
}

type StatCardProps = {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  iconClassName?: string
}

function formatDate(value: string | null) {
  if (!value) return "Belum tersedia"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "Belum tersedia"

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date)
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

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 11) return "Selamat pagi"
  if (hour < 15) return "Selamat siang"
  if (hour < 18) return "Selamat sore"
  return "Selamat malam"
}

function getVerificationLabel(status: string | null) {
  switch (status) {
    case "verified":
      return "Terverifikasi"
    case "pending":
      return "Menunggu verifikasi"
    case "rejected":
      return "Verifikasi ditolak"
    default:
      return "Belum terverifikasi"
  }
}

function getActivityStatus(status: string | null) {
  switch (status) {
    case "published":
      return "Dibuka"
    case "completed":
      return "Selesai"
    case "cancelled":
      return "Dibatalkan"
    case "draft":
      return "Draft"
    default:
      return status || "Belum diketahui"
  }
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = "",
}: StatCardProps) {
  return (
    <Card className="min-w-0 rounded-xl bg-card">
      <CardContent className="flex items-start gap-3 py-0">
        {/* Ikon */}
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon className="size-4" strokeWidth={2} />
        </div>

        {/* Informasi */}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <p className="text-2xl leading-tight font-semibold wrap-break-word">
            {value}
          </p>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // =========================================================
  // 1. PROFILE ANGGOTA
  // =========================================================

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      full_name,
      role,
      verification_status,
      member_number,
      registered_at,
      membership_start_date,
      membership_expiry_date
    `
    )
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("Gagal mengambil profil dashboard:", profileError)
    throw new Error("Gagal memuat profil anggota.")
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <UserRound className="size-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Profil belum tersedia</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Data profil untuk akun ini belum ditemukan. Silakan lengkapi proses
            pendaftaran atau hubungi administrator.
          </p>
          <Button asChild>
            <Link href="/dashboard/pengaturan">Buka Pengaturan</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (profile.role !== "member") {
    redirect("/admin")
  }

  // =========================================================
  // 2. STATISTIK PENDAFTARAN KEGIATAN
  // =========================================================

  const { count: registrationCount, error: registrationCountError } =
    await supabase
      .from("activity_registrations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "cancelled")

  if (registrationCountError) {
    console.error("Gagal menghitung kegiatan anggota:", registrationCountError)
  }

  // Ambil pendaftaran terbaru untuk menampilkan kegiatan.
  const { data: registrationData, error: registrationsError } = await supabase
    .from("activity_registrations")
    .select("id, activity_id, status, registered_at")
    .eq("user_id", user.id)
    .neq("status", "cancelled")
    .order("registered_at", { ascending: false })
    .limit(5)

  if (registrationsError) {
    console.error("Gagal mengambil kegiatan anggota:", registrationsError)
  }

  const registrations: Registration[] = registrationData ?? []

  // =========================================================
  // 3. DETAIL KEGIATAN TERBARU
  // Query terpisah agar tidak bergantung pada nama relasi JOIN.
  // =========================================================

  const activityIds = [
    ...new Set(registrations.map((item) => item.activity_id)),
  ]

  let recentActivities: Activity[] = []

  if (activityIds.length > 0) {
    const { data: activityData, error: activitiesError } = await supabase
      .from("activities")
      .select("id, title, type, status, start_at")
      .in("id", activityIds)

    if (activitiesError) {
      console.error("Gagal mengambil detail kegiatan:", activitiesError)
    } else {
      const activityMap = new Map(
        (activityData ?? []).map((activity) => [activity.id, activity])
      )

      recentActivities = registrations
        .map((registration) => activityMap.get(registration.activity_id))
        .filter((activity): activity is Activity => Boolean(activity))
    }
  }

  // =========================================================
  // 4. SERTIFIKAT ANGGOTA
  // =========================================================

  const [
    { count: certificateCount, error: certificateCountError },
    { data: certificateData, error: certificatesError },
  ] = await Promise.all([
    supabase
      .from("activity_certificates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),

    supabase
      .from("activity_certificates")
      .select(
        `
        id,
        certificate_number,
        issued_at,
        activity_title,
        certificate_title,
        organizer
      `
      )
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false })
      .limit(3),
  ])

  if (certificateCountError) {
    console.error("Gagal menghitung sertifikat anggota:", certificateCountError)
  }

  if (certificatesError) {
    console.error("Gagal mengambil sertifikat:", certificatesError)
  }

  const certificates: Certificate[] = certificateData ?? []

  // =========================================================
  // 5. STATUS DAN MASA KEANGGOTAAN
  // =========================================================

  const now = new Date()

  const expiryDate = profile.membership_expiry_date
    ? new Date(profile.membership_expiry_date)
    : null

  const startDate = profile.membership_start_date
    ? new Date(profile.membership_start_date)
    : null

  const hasValidExpiry =
    expiryDate !== null && !Number.isNaN(expiryDate.getTime())

  const hasValidStart = startDate !== null && !Number.isNaN(startDate.getTime())

  const remainingDays = hasValidExpiry
    ? Math.max(
        0,
        Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0

  const isMembershipActive =
    profile.verification_status === "verified" &&
    hasValidExpiry &&
    expiryDate.getTime() > now.getTime()

  const membershipStatus = isMembershipActive
    ? "Aktif"
    : profile.verification_status !== "verified"
      ? "Belum Aktif"
      : hasValidExpiry && expiryDate.getTime() <= now.getTime()
        ? "Kedaluwarsa"
        : "Belum Aktif"

  const formattedExpiry = hasValidExpiry
    ? formatDate(profile.membership_expiry_date)
    : null

  const formattedStart = hasValidStart
    ? formatDate(profile.membership_start_date)
    : null

  const memberName =
    profile.full_name?.trim() ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Anggota"

  const firstName = memberName.split(/\s+/)[0]

  // =========================================================
  // 6. RENDER DASHBOARD
  // =========================================================

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8 sm:space-y-8">
      {/* HEADER SAMBUTAN */}
      <section className="relative overflow-hidden rounded-2xl bg-[#1b3d80] p-5 text-white sm:p-8">
        <div className="pointer-events-none absolute -top-20 -right-12 size-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -top-10 -right-2 size-44 rounded-full border border-amber-300/20" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-slate-300">{getGreeting()},</p>

              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {firstName}!
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Pantau keanggotaan, kegiatan, dan sertifikat Anda melalui satu
                dashboard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge
                className={
                  isMembershipActive
                    ? "border-0 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/15"
                    : "border-0 bg-amber-400/15 text-amber-200 hover:bg-amber-400/15"
                }
              >
                {isMembershipActive ? "Keanggotaan Aktif" : membershipStatus}
              </Badge>

              <Badge className="border border-white/15 bg-white/10 text-white hover:bg-white/10">
                {profile.member_number || "Nomor anggota belum tersedia"}
              </Badge>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              asChild
              className="bg-amber-400 text-slate-950 hover:bg-amber-300"
            >
              <Link href="/dashboard/kegiatan">
                <CalendarDays className="mr-2 size-4" />
                Jelajahi Kegiatan
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/dashboard/pengaturan">
                <UserRound className="mr-2 size-4" />
                Profil Saya
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* STATISTIK UTAMA */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Ringkasan Keanggotaan
          </h2>
          <p className="text-sm text-muted-foreground">
            Informasi terkini mengenai akun dan aktivitas Anda.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            title="Status Keanggotaan"
            value={membershipStatus}
            description={
              isMembershipActive
                ? "Keanggotaan Anda aktif"
                : "Periksa status dan masa berlaku Anda"
            }
            icon={ShieldCheck}
            iconClassName={
              isMembershipActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }
          />

          <StatCard
            title="Kegiatan Diikuti"
            value={registrationCount ?? 0}
            description="Total pendaftaran tidak dibatalkan"
            icon={CalendarDays}
            iconClassName="bg-blue-100 text-blue-700"
          />

          <StatCard
            title="Sertifikat Terbit"
            value={certificateCount ?? 0}
            description="Sertifikat kegiatan milik Anda"
            icon={Award}
            iconClassName="bg-amber-100 text-amber-700"
          />

          <StatCard
            title="Sisa Masa Aktif"
            value={isMembershipActive ? `${remainingDays} hari` : "—"}
            description={
              formattedExpiry
                ? `Berlaku sampai ${formattedExpiry}`
                : "Tanggal kedaluwarsa belum tersedia"
            }
            icon={Clock3}
            iconClassName="bg-violet-100 text-violet-700"
          />
        </div>
      </section>

      {/* INFORMASI KEANGGOTAAN */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Informasi Keanggotaan</CardTitle>
              <p className="text-sm text-muted-foreground">
                Identitas dan periode keanggotaan Anda.
              </p>
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="size-5" />
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Nama Anggota</p>
                <p className="mt-1 font-semibold wrap-break-word">{memberName}</p>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Nomor Anggota</p>
                <p className="mt-1 font-mono text-sm font-semibold wrap-break-word">
                  {profile.member_number || "Belum tersedia"}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">
                  Status Verifikasi
                </p>
                <div className="mt-2">
                  <Badge
                    variant={
                      profile.verification_status === "verified"
                        ? "default"
                        : profile.verification_status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {getVerificationLabel(profile.verification_status)}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Terdaftar Sejak</p>
                <p className="mt-1 font-medium">
                  {formatDate(profile.registered_at)}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">
                  Awal Masa Keanggotaan
                </p>
                <p className="mt-1 font-medium">
                  {formattedStart || "Belum tersedia"}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">
                  Akhir Masa Keanggotaan
                </p>
                <p className="mt-1 font-medium">
                  {formattedExpiry || "Belum tersedia"}
                </p>
              </div>
            </div>

            {isMembershipActive && remainingDays <= 30 && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <Clock3 className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-medium">
                    Masa keanggotaan segera berakhir
                  </p>
                  <p className="mt-1 text-sm">
                    Sisa masa aktif Anda {remainingDays} hari. Silakan hubungi
                    administrator untuk informasi perpanjangan.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/pengaturan">
                  Kelola Profil
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AKUN */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Informasi Akun</CardTitle>
            <p className="text-sm text-muted-foreground">
              Akun yang digunakan untuk mengakses portal.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserRound className="size-5 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <p className="font-medium break-all">
                  {profile.email || user.email || "Email tidak tersedia"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Email akun terdaftar
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-5" />
              </div>

              <div className="min-w-0">
                <p className="font-medium">Akun terautentikasi</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Anda sedang mengakses portal menggunakan sesi akun yang aktif.
                </p>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <WalletCards className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">Layanan Anggota</p>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Akses kegiatan, arsip sertifikat, dan pengaturan data
                keanggotaan dari portal ini.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* KEGIATAN DAN SERTIFIKAT */}
      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        {/* KEGIATAN TERBARU */}
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Kegiatan Saya</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Kegiatan terbaru yang Anda daftarkan.
              </p>
            </div>

            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/kegiatan">
                Lihat semua
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex min-w-0 items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/30 sm:p-4"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <CalendarDays className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="leading-snug font-medium wrap-break-word">
                        {activity.title}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatActivityType(activity.type)}
                        {" · "}
                        {formatDate(activity.start_at)}
                      </p>

                      <div className="mt-2">
                        <Badge variant="secondary">
                          {getActivityStatus(activity.status)}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                    >
                      <Link
                        href={`/dashboard/kegiatan/${activity.id}`}
                        aria-label={`Lihat ${activity.title}`}
                      >
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center">
                <CalendarDays className="size-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Belum ada kegiatan</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kegiatan yang Anda daftarkan akan muncul di sini.
                  </p>
                </div>

                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/kegiatan">Jelajahi Kegiatan</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SERTIFIKAT TERBARU */}
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">Sertifikat Terbaru</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Arsip sertifikat kegiatan yang telah diterbitkan.
              </p>
            </div>

            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/sertifikat">
                Lihat semua
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent>
            {certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="flex min-w-0 items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/30 sm:p-4"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <FileBadge className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="leading-snug font-medium wrap-break-word">
                        {certificate.certificate_title ||
                          certificate.activity_title ||
                          "Sertifikat Kegiatan"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Diterbitkan {formatDate(certificate.issued_at)}
                      </p>

                      <p className="mt-1 font-mono text-[11px] break-all text-muted-foreground">
                        {certificate.certificate_number}
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      <Link href={`/dashboard/sertifikat/${certificate.id}`}>
                        Lihat
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center">
                <Award className="size-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Belum ada sertifikat</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sertifikat akan muncul setelah admin menerbitkannya.
                  </p>
                </div>

                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/kegiatan">Lihat Kegiatan</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* AKSES CEPAT */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Akses Cepat</h2>
          <p className="text-sm text-muted-foreground">
            Buka layanan yang sering Anda gunakan.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/dashboard/kegiatan"
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <CalendarDays className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium">Kegiatan</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Jelajahi kegiatan asosiasi
              </p>
            </div>

            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/dashboard/sertifikat"
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Award className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium">Sertifikat</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Lihat arsip sertifikat Anda
              </p>
            </div>

            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/dashboard/pengaturan"
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Users className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium">Pengaturan Profil</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Kelola data pribadi Anda
              </p>
            </div>

            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  )
}
