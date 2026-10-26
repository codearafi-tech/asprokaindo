"use client"

import { CalendarDays, Images, MapPin, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { ActivityStatus, GalleryPhoto } from "./gallery-activity-form"

export type GalleryActivity = {
  id: string
  title: string
  slug: string
  description: string | null
  activity_date: string
  location: string | null
  cover_image_path: string | null
  status: ActivityStatus
  created_at: string
  gallery_photos: GalleryPhoto[]
}

type GalleryActivityCardProps = {
  activity: GalleryActivity
  getPublicUrl: (path: string | null) => string
  onEdit: (activity: GalleryActivity) => void
  onDelete: (activity: GalleryActivity) => void
}

export function GalleryActivityCard({
  activity,
  getPublicUrl,
  onEdit,
  onDelete,
}: GalleryActivityCardProps) {
  const photoCount = activity.gallery_photos?.length ?? 0

  const formattedDate = activity.activity_date
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${activity.activity_date.slice(0, 10)}T12:00:00`))
    : "-"

  const coverUrl = getPublicUrl(activity.cover_image_path)

  return (
    <article className="overflow-hidden rounded-2xl border bg-card">
      {/* Foto sampul */}
      <div className="relative aspect-4/3 bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Sampul kegiatan ${activity.title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Images className="h-10 w-10" />
            <span className="text-sm">Belum ada foto sampul</span>
          </div>
        )}

        {/* Status kegiatan */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              activity.status === "published"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {activity.status === "published" ? "Dipublikasikan" : "Draft"}
          </span>
        </div>

        {/* Jumlah foto */}
        <div className="absolute right-3 bottom-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
            <Images className="h-3.5 w-3.5" />
            {photoCount} foto
          </span>
        </div>
      </div>

      {/* Informasi kegiatan */}
      <div className="space-y-4 p-4">
        <div>
          <h3 className="line-clamp-2 leading-6 font-semibold">
            {activity.title}
          </h3>

          {activity.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {activity.description}
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formattedDate}</span>
          </div>

          {activity.location && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="line-clamp-2">{activity.location}</span>
            </div>
          )}
        </div>

        {/* Tombol aksi shadcn/ui */}
        <div className="flex gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onEdit(activity)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={() => onDelete(activity)}
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
        </div>
      </div>
    </article>
  )
}
