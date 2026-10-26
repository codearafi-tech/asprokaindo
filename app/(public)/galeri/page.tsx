"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarDays, Images, Loader2, MapPin, Search, X } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const BUCKET = "gallery-images"

type GalleryPhoto = {
  id: string
  activity_id: string
  image_path: string
  caption: string | null
  display_order: number
}

type GalleryActivity = {
  id: string
  title: string
  slug: string
  description: string | null
  activity_date: string
  location: string | null
  cover_image_path: string | null
  status: "draft" | "published"
  gallery_photos: GalleryPhoto[]
}

export default function GaleriPage() {
  const supabase = React.useMemo(() => createClient(), [])

  const [activities, setActivities] = React.useState<GalleryActivity[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [selectedActivity, setSelectedActivity] =
    React.useState<GalleryActivity | null>(null)

  const getPublicUrl = React.useCallback(
    (path: string | null) => {
      if (!path) return ""

      if (path.startsWith("http://") || path.startsWith("https://")) {
        return path
      }

      return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    },
    [supabase]
  )

  React.useEffect(() => {
    let cancelled = false

    async function loadGallery() {
      setLoading(true)
      setError("")

      const { data, error: queryError } = await supabase
        .from("gallery_activities")
        .select(
          `
          id,
          title,
          slug,
          description,
          activity_date,
          location,
          cover_image_path,
          status,
          gallery_photos (
            id,
            activity_id,
            image_path,
            caption,
            display_order
          )
        `
        )
        .eq("status", "published")
        .order("activity_date", { ascending: false })

      if (cancelled) return

      if (queryError) {
        console.error("Gagal memuat galeri:", queryError)
        setError("Galeri belum dapat dimuat. Silakan coba lagi.")
        setLoading(false)
        return
      }

      const rows = (data ?? []) as unknown as GalleryActivity[]

      rows.forEach((activity) => {
        activity.gallery_photos ??= []
        activity.gallery_photos.sort(
          (a, b) => a.display_order - b.display_order
        )
      })

      setActivities(rows)
      setLoading(false)
    }

    void loadGallery()

    return () => {
      cancelled = true
    }
  }, [supabase])

  const filteredActivities = activities.filter((activity) => {
    const keyword = search.trim().toLowerCase()

    return (
      activity.title.toLowerCase().includes(keyword) ||
      (activity.description ?? "").toLowerCase().includes(keyword) ||
      (activity.location ?? "").toLowerCase().includes(keyword)
    )
  })

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${date.slice(0, 10)}T12:00:00`))
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}

      <section className="relative isolate overflow-hidden bg-linear-to-br from-[#071633] via-[#102b65] to-[#1b3d80]">
        <div className="pointer-events-none absolute -top-32 -right-32 -z-10 size-96 rounded-full bg-blue-400/15 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 pt-28 pb-14 md:pb-16 lg:px-20">
          <h1 className="mt-4 max-w-3xl text-4xl tracking-tight text-white md:text-5xl">
            Galeri Kegiatan
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
            Dokumentasi berbagai kegiatan, program, dan aktivitas ASPROKAINDO
            dalam mendukung pengembangan kompetensi profesional dan kemajuan
            ekosistem kecerdasan artifisial Indonesia.
          </p>
        </div>
      </section>

      {/* Daftar galeri */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 md:py-24 lg:px-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Dokumentasi Kegiatan</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {activities.length} kegiatan dipublikasikan
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari kegiatan..."
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-60 items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Memuat galeri...
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center text-center">
            <Images className="mb-4 h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold">
              {search ? "Kegiatan tidak ditemukan" : "Belum ada kegiatan"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {search
                ? "Coba kata kunci pencarian yang lain."
                : "Dokumentasi kegiatan yang telah dipublikasikan akan tampil di sini."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.map((activity) => {
              const coverUrl = getPublicUrl(activity.cover_image_path)

              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => setSelectedActivity(activity)}
                  className="group overflow-hidden rounded-xl border bg-card text-left transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-muted">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={activity.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Images className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}

                    <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white">
                      <Images className="h-3.5 w-3.5" />
                      {activity.gallery_photos.length} foto
                    </span>
                  </div>

                  <div className="space-y-3 p-5">
                    <h3 className="line-clamp-2 text-lg font-semibold">
                      {activity.title}
                    </h3>

                    {activity.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(activity.activity_date)}
                      </span>

                      {activity.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {activity.location}
                        </span>
                      )}
                    </div>

                    <div className="pt-1 text-sm font-medium text-primary">
                      Lihat dokumentasi →
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Detail kegiatan dan foto */}
      <Dialog
        open={Boolean(selectedActivity)}
        onOpenChange={(open) => {
          if (!open) setSelectedActivity(null)
        }}
      >
        <DialogContent className="max-h-[90dvh] max-w-5xl overflow-y-auto">
          {selectedActivity && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6 text-xl">
                  {selectedActivity.title}
                </DialogTitle>

                <DialogDescription>
                  <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(selectedActivity.activity_date)}
                    </span>

                    {selectedActivity.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {selectedActivity.location}
                      </span>
                    )}
                  </span>
                </DialogDescription>
              </DialogHeader>

              {selectedActivity.description && (
                <p className="text-sm leading-6 whitespace-pre-line text-muted-foreground">
                  {selectedActivity.description}
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedActivity.gallery_photos.map((photo) => (
                  <figure key={photo.id} className="space-y-2">
                    <img
                      src={getPublicUrl(photo.image_path)}
                      alt={
                        photo.caption || `Dokumentasi ${selectedActivity.title}`
                      }
                      loading="lazy"
                      className="aspect-4/3 w-full rounded-lg border object-cover"
                    />

                    {photo.caption && (
                      <figcaption className="text-sm text-muted-foreground">
                        {photo.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedActivity(null)}
                >
                  <X className="h-4 w-4" />
                  Tutup
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
