import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  CalendarDays,
  Clock3,
  MapPin,
  Video,
  Users,
  ArrowUpRight,
  CalendarClock,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

function formatDate(date: string | null) {
  if (!date) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date))
}

function formatDateTime(date: string | null) {
  if (!date) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date))
}

function getRegistrationInfo(
  start: string | null,
  end: string | null,
  now: number
) {
  if (start && now < new Date(start).getTime()) {
    return {
      label: "Segera Dibuka",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    }
  }

  if (end && now > new Date(end).getTime()) {
    return {
      label: "Pendaftaran Ditutup",
      className: "border-red-200 bg-red-50 text-red-700",
    }
  }

  return {
    label: "Pendaftaran Dibuka",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }
}

function getTypeLabel(type: string | null) {
  const labels: Record<string, string> = {
    training: "Pelatihan",
    workshop: "Workshop",
    webinar: "Webinar",
  }

  return labels[type ?? ""] ?? "Kegiatan"
}

export default async function KegiatanPage() {
  const supabase = await createClient()

  const { data: activities, error } = await supabase
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
      image_path
    `
    )
    .eq("status", "published")
    .order("start_at", { ascending: true })

  if (error) {
    console.error("Gagal mengambil kegiatan:", error.message)

    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Kegiatan</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Kegiatan belum dapat dimuat. Silakan coba kembali beberapa saat
            lagi.
          </CardContent>
        </Card>
      </div>
    )
  }

  const now = Date.now()

  const items = await Promise.all(
    (activities ?? []).map(async (activity) => {
      let flyerUrl: string | null = null

      if (activity.image_path) {
        const { data, error } = await supabase.storage
          .from("activity-flyers")
          .createSignedUrl(activity.image_path, 3600)

        if (error) {
          console.error(
            `Gagal membuat URL poster ${activity.title}:`,
            error.message
          )
        } else {
          flyerUrl = data.signedUrl
        }
      }

      const registration = getRegistrationInfo(
        activity.registration_start_at,
        activity.registration_end_at,
        now
      )

      return {
        ...activity,
        flyerUrl,
        registration,
        isOnline: activity.location_type === "online",
        isHybrid: activity.location_type === "hybrid",
      }
    })
  )

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <section className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Kegiatan Asosiasi
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Temukan pelatihan, workshop, dan webinar yang diselenggarakan
              untuk anggota.
            </p>
          </div>

          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
            {items.length} kegiatan tersedia
          </Badge>
        </div>
      </section>

      {/* Daftar kegiatan */}
      {items.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <CalendarClock className="h-7 w-7 text-muted-foreground" />
            </div>

            <h2 className="text-lg font-semibold">Belum ada kegiatan</h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Kegiatan yang telah diterbitkan oleh admin akan muncul di halaman
              ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-start">
          {items.map((activity) => (
            <Card
              key={activity.id}
              // Tambahkan overflow-hidden langsung di Card agar sudutnya melengkung mengikuti card
              className="group flex flex-col overflow-hidden rounded-2xl  transition-shadow hover:shadow-md py-0 gap-0"
            >
              {/* Poster (Full-bleed di bagian atas card tanpa ada space) */}
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {activity.flyerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activity.flyerUrl}
                    alt={`Poster ${activity.title}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-10 w-10" />
                    <span className="text-xs">Poster kegiatan</span>
                  </div>
                )}

                <Badge
                  variant="secondary"
                  className="absolute top-3 left-3 border bg-white"
                >
                  {getTypeLabel(activity.type)}
                </Badge>
              </div>

              {/* Konten Card di bawah gambar */}
              <CardContent className="flex flex-1 flex-col justify-between space-y-2 py-4">
                {/* Judul dan deskripsi */}
                <div className="space-y-2">
                  <h2 className="line-clamp-2 text-lg leading-7 font-semibold tracking-tight">
                    {activity.title}
                  </h2>
                </div>

                {/* Informasi kegiatan */}
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Jadwal kegiatan
                      </p>
                      <p className="mt-1 font-medium">
                        {formatDate(activity.start_at)}
                      </p>
                      {activity.end_at && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          s.d. {formatDate(activity.end_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    {activity.isOnline ? (
                      <Video className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Lokasi</p>
                      <p className="mt-1 font-medium">
                        {activity.isOnline
                          ? "Online (Zoom Meeting)"
                          : activity.isHybrid
                            ? "Hybrid"
                            : activity.location || "Belum ditentukan"}
                      </p>
                      {activity.isHybrid && activity.location && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {activity.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Periode pendaftaran */}
                <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    Periode pendaftaran
                  </div>

                  <p className="text-sm font-medium">
                    {formatDate(activity.registration_start_at)}
                    {" — "}
                    {formatDate(activity.registration_end_at)}
                  </p>

                  <Badge
                    variant="outline"
                    className={activity.registration.className}
                  >
                    {activity.registration.label}
                  </Badge>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t pt-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Penyelenggara
                    </p>
                    <p className="truncate text-sm font-medium">
                      {activity.organizer || "ASPROKAINDONESIA"}
                    </p>
                  </div>

                  <Button asChild size="sm" className="shrink-0 gap-2">
                    <Link href={`/dashboard/kegiatan/${activity.id}`}>
                      Lihat Detail
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
