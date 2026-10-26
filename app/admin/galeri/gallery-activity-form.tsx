"use client"

import type { ChangeEvent, FormEvent } from "react"
import {
  ImagePlus,
  Loader2,
  MapPin,
  Star,
  Trash2,
  Upload,
  X,
  CalendarDays,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export type ActivityStatus = "draft" | "published"

export type GalleryPhoto = {
  id: string
  activity_id: string
  image_path: string
  caption: string | null
  display_order: number
}

export type SelectedGalleryPhoto = {
  file: File
  preview: string
  key: string
}

type GalleryActivityFormProps = {
  title: string
  setTitle: (value: string) => void
  description: string
  setDescription: (value: string) => void
  activityDate: string
  setActivityDate: (value: string) => void
  location: string
  setLocation: (value: string) => void
  status: ActivityStatus
  setStatus: (value: ActivityStatus) => void
  existingPhotos: GalleryPhoto[]
  selectedPhotos: SelectedGalleryPhoto[]
  coverPhoto: string
  setCoverPhoto: (value: string) => void
  removedPhotoIds: string[]
  onFileChange: (files: FileList | null) => void
  onRemoveNewPhoto: (photo: SelectedGalleryPhoto) => void
  onRemoveExistingPhoto: (photo: GalleryPhoto) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  saving: boolean
  getPublicUrl: (path: string | null) => string
}

export function GalleryActivityForm({
  title,
  setTitle,
  description,
  setDescription,
  activityDate,
  setActivityDate,
  location,
  setLocation,
  status,
  setStatus,
  existingPhotos,
  selectedPhotos,
  coverPhoto,
  setCoverPhoto,
  removedPhotoIds,
  onFileChange,
  onRemoveNewPhoto,
  onRemoveExistingPhoto,
  onSubmit,
  onCancel,
  saving,
  getPublicUrl,
}: GalleryActivityFormProps) {
  const visibleExistingPhotos = existingPhotos.filter(
    (photo) => !removedPhotoIds.includes(photo.id)
  )

  const totalPhotos = visibleExistingPhotos.length + selectedPhotos.length

  const isCover = (key: string) => coverPhoto === key

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    onFileChange(event.target.files)
    event.target.value = ""
  }

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-col">
      <div className="space-y-6 p-5 sm:p-6">
        {/* Informasi kegiatan */}
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Informasi Kegiatan</h3>
            <p className="text-sm text-muted-foreground">
              Masukkan informasi utama kegiatan yang akan ditampilkan.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gallery-title">Judul Kegiatan *</Label>
            <Input
              id="gallery-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Contoh: Pelatihan Digital Marketing"
              maxLength={150}
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gallery-description">Deskripsi Kegiatan</Label>
            <Textarea
              id="gallery-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ceritakan secara singkat kegiatan yang dilaksanakan..."
              rows={4}
              disabled={saving}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gallery-date">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Tanggal Kegiatan *
                </span>
              </Label>
              <Input
                id="gallery-date"
                type="date"
                value={activityDate}
                onChange={(event) => setActivityDate(event.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gallery-location">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Lokasi Kegiatan
                </span>
              </Label>
              <Input
                id="gallery-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Contoh: Yogyakarta"
                maxLength={200}
                disabled={saving}
              />
            </div>
          </div>
        </section>

        <div className="border-t" />

        {/* Dokumentasi foto */}
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Dokumentasi Foto</h3>
              <p className="text-sm text-muted-foreground">
                Pilih foto kegiatan dan tentukan satu foto sebagai sampul.
                Maksimal 30 foto, masing-masing 5 MB.
              </p>
            </div>

            <span className="shrink-0 text-sm text-muted-foreground">
              {totalPhotos}/30 foto
            </span>
          </div>

          {/* Upload foto */}
          <label
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-6 text-center hover:bg-muted/50 ${
              saving || totalPhotos >= 30
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            <ImagePlus className="h-8 w-8 text-muted-foreground" />

            <span className="text-sm font-medium">Klik untuk memilih foto</span>
            <span className="text-sm text-muted-foreground">
              JPG, PNG, atau WebP
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              disabled={saving || totalPhotos >= 30}
              onChange={handleFileInput}
            />
          </label>

          {totalPhotos === 0 ? (
            <div className="flex flex-col items-center gap-2 border p-8 text-center">
              <Upload className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Belum ada foto yang dipilih.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {/* Foto yang sudah tersimpan */}
              {visibleExistingPhotos.map((photo) => {
                const photoKey = `existing:${photo.id}`
                const cover = isCover(photoKey)

                return (
                  <div
                    key={photo.id}
                    className={`relative overflow-hidden border-2 ${
                      cover ? "border-primary" : "border-border"
                    }`}
                  >
                    <div className="aspect-square bg-muted">
                      <img
                        src={getPublicUrl(photo.image_path)}
                        alt={photo.caption || "Foto kegiatan"}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {cover && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-background px-2 py-1 text-xs font-medium">
                        <Star className="h-3 w-3 fill-current" />
                        Sampul
                      </span>
                    )}

                    <div className="flex flex-wrap items-center gap-2 bg-background p-2">
                      <Button
                        type="button"
                        variant={cover ? "default" : "secondary"}
                        size="sm"
                        className="min-w-0 flex-1"
                        onClick={() => setCoverPhoto(photoKey)}
                        disabled={saving || cover}
                      >
                        <Star className="h-4 w-4" />
                        <span className="truncate">
                          {cover ? "Foto Sampul" : "Jadikan Sampul"}
                        </span>
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => onRemoveExistingPhoto(photo)}
                        disabled={saving}
                        aria-label="Hapus foto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}

              {/* Foto baru */}
              {selectedPhotos.map((photo) => {
                const cover = isCover(photo.key)

                return (
                  <div
                    key={photo.key}
                    className={`relative overflow-hidden border-2 ${
                      cover ? "border-primary" : "border-border"
                    }`}
                  >
                    <div className="aspect-square bg-muted">
                      <img
                        src={photo.preview}
                        alt={photo.file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {cover && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-background px-2 py-1 text-xs font-medium">
                        <Star className="h-3 w-3 fill-current" />
                        Sampul
                      </span>
                    )}

                    <div className="flex flex-wrap items-center gap-2 bg-background p-2">
                      <Button
                        type="button"
                        variant={cover ? "default" : "secondary"}
                        size="sm"
                        className="min-w-0 flex-1"
                        onClick={() => setCoverPhoto(photo.key)}
                        disabled={saving || cover}
                      >
                        <Star className="h-4 w-4" />
                        <span className="truncate">
                          {cover ? "Foto Sampul" : "Jadikan Sampul"}
                        </span>
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => onRemoveNewPhoto(photo)}
                        disabled={saving}
                        aria-label="Hapus foto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="truncate px-2 py-1 text-xs text-muted-foreground">
                      {photo.file.name}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Foto sampul akan digunakan sebagai gambar utama kegiatan. Pastikan
            satu foto sudah dipilih sebagai sampul sebelum menyimpan.
          </p>
        </section>

        <div className="border-t" />

        {/* Status publikasi */}
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Status Publikasi</h3>
            <p className="text-sm text-muted-foreground">
              Tentukan apakah kegiatan langsung ditampilkan di halaman galeri.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant={status === "draft" ? "default" : "outline"}
              onClick={() => setStatus("draft")}
              disabled={saving}
            >
              Simpan sebagai Draft
            </Button>

            <Button
              type="button"
              variant={status === "published" ? "default" : "outline"}
              onClick={() => setStatus("published")}
              disabled={saving}
            >
              Publikasikan
            </Button>
          </div>
        </section>
      </div>

      {/* Footer dengan latar solid */}
      <div className="sticky bottom-0 z-20 mt-auto flex shrink-0 flex-col-reverse gap-2 border-t bg-white p-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Batal
        </Button>

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Menyimpan..." : "Simpan Kegiatan"}
        </Button>
      </div>
    </form>
  )
}
