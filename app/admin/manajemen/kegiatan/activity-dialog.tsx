"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  Clock3,
  FileImage,
  FileText,
  Link2,
  MapPin,
  Upload,
  Video,
  X,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { createActivity } from "./action"

type ActivityDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_FLYER_SIZE = 5 * 1024 * 1024
const ALLOWED_FLYER_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function ActivityDialog({ open, onOpenChange }: ActivityDialogProps) {
  const router = useRouter()

  const formRef = React.useRef<HTMLFormElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [activityType, setActivityType] = React.useState<
    "training" | "workshop" | "webinar"
  >("training")
  const [locationType, setLocationType] = React.useState<
    "offline" | "online" | "hybrid"
  >("offline")

  const [isPaid, setIsPaid] = React.useState(false)
  const [registrationFee, setRegistrationFee] = React.useState("")
  const [errorMessage, setErrorMessage] = React.useState("")

  const [flyerFile, setFlyerFile] = React.useState<File | null>(null)
  const [flyerPreview, setFlyerPreview] = React.useState<string | null>(null)

  const clearFlyerPreview = React.useCallback(() => {
    setFlyerPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview)
      }

      return null
    })
  }, [])

  const removeFlyer = () => {
    clearFlyerPreview()
    setFlyerFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // =========================================================
  // RESET
  // =========================================================

  const resetForm = () => {
    formRef.current?.reset()

    setActivityType("training")
    setLocationType("offline")
    setIsPaid(false)
    setRegistrationFee("")
    setErrorMessage("")
    setFlyerFile(null)

    clearFlyerPreview()

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // =========================================================
  // FILE CHANGE
  // =========================================================
  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFlyerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null

    setErrorMessage("")

    if (!file) return

    if (!ALLOWED_FLYER_TYPES.includes(file.type)) {
      event.currentTarget.value = ""
      setErrorMessage("Format flyer harus JPG, PNG, atau WEBP.")
      return
    }

    if (file.size > MAX_FLYER_SIZE) {
      event.currentTarget.value = ""
      setErrorMessage("Ukuran flyer maksimal 5 MB.")
      return
    }

    setFlyerFile(file)
    setFlyerPreview(URL.createObjectURL(file))
  }

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) return

    setErrorMessage("")

    const fee = isPaid ? Number(registrationFee) : 0
    if (isPaid && (!Number.isSafeInteger(fee) || fee <= 0)) {
      setErrorMessage(
        "Masukkan nominal biaya yang valid dan lebih besar dari Rp0."
      )
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await createActivity(formData)

      if (!result.success) {
        setErrorMessage(result.message)
        return
      }

      resetForm()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Gagal membuat kegiatan:", error)
      setErrorMessage("Terjadi kesalahan saat membuat kegiatan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // =========================================================
  // DIALOG CHANGE
  // =========================================================

  const handleOpenChange = (value: boolean) => {
    if (isSubmitting) return

    if (!value) {
      resetForm()
    }

    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[min(92vh,800px)] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        {/* HEADER */}
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle className="text-lg font-semibold">
            Tambah Kegiatan
          </DialogTitle>
          <DialogDescription>
            Buat kegiatan baru dan simpan sebagai draft sebelum diterbitkan
            kepada anggota.
          </DialogDescription>
        </DialogHeader>

        {/* FORM */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-8 p-6">
              {/* INFORMASI */}
              <section className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      Informasi Kegiatan
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Informasi utama mengenai kegiatan.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Judul Kegiatan</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Contoh: Pelatihan Digital Marketing"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Jenis Kegiatan</Label>
                    <Select
                      value={activityType}
                      onValueChange={(value) =>
                        setActivityType(value as typeof activityType)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="training">Pelatihan</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="webinar">Webinar</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="type" value={activityType} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Status</Label>
                      <p className="text-xs text-muted-foreground">
                        (Kegiatan dibuat sebagai draft)
                      </p>
                    </div>
                    <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                      Draft
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Jelaskan secara singkat mengenai kegiatan ini..."
                    className="min-h-27.5 resize-none"
                  />
                </div>
              </section>

              {/* BIAYA PENDAFTARAN */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Biaya Pendaftaran</h3>
                    <p className="text-xs text-muted-foreground">
                      Tentukan apakah kegiatan ini gratis atau berbayar.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_type">Jenis Biaya</Label>
                  <Select
                    value={isPaid ? "paid" : "free"}
                    onValueChange={(value) => {
                      const paid = value === "paid"
                      setIsPaid(paid)
                      if (!paid) setRegistrationFee("")
                    }}
                  >
                    <SelectTrigger id="payment_type" className="w-full">
                      <SelectValue placeholder="Pilih jenis biaya" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratis</SelectItem>
                      <SelectItem value="paid">Berbayar</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    name="is_paid"
                    value={isPaid ? "true" : "false"}
                  />
                </div>

                {isPaid ? (
                  <div className="space-y-2">
                    <Label htmlFor="registration_fee">Nominal Biaya (Rp)</Label>
                    <Input
                      id="registration_fee"
                      name="registration_fee"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      placeholder="Contoh: 150000"
                      value={registrationFee}
                      onChange={(event) =>
                        setRegistrationFee(event.target.value)
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Masukkan nominal dalam rupiah tanpa titik atau tanda
                      pemisah.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 px-4 py-3">
                    <p className="text-sm font-medium">Rp0 — Gratis</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Anggota tidak perlu mengunggah bukti pembayaran untuk
                      kegiatan ini.
                    </p>
                    <input type="hidden" name="registration_fee" value="0" />
                  </div>
                )}
              </section>

              {/* FLYER */}
              {/* FLYER */}
              <section className="space-y-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <FileImage className="h-4 w-4 text-primary" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold">Flyer Kegiatan</h3>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, atau WEBP, maksimal 5 MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input selalu terpasang di DOM */}
                <input
                  ref={fileInputRef}
                  id="flyer"
                  name="flyer"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFlyerChange}
                  disabled={isSubmitting}
                />

                {!flyerFile ? (
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={isSubmitting}
                    className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-8 text-center transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <p className="text-sm font-medium">Upload flyer kegiatan</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      JPG, PNG, atau WEBP · Maks. 5 MB
                    </p>

                    <span className="mt-4 inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium shadow-sm">
                      Pilih File
                    </span>
                  </button>
                ) : (
                  <div className="overflow-hidden rounded-xl border bg-muted/20">
                    <div className="relative flex justify-center bg-muted/30 p-3">
                      {flyerPreview && (
                        <img
                          src={flyerPreview}
                          alt="Preview flyer kegiatan"
                          className="max-h-72 w-auto max-w-full rounded-lg object-contain"
                        />
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-5 right-5 h-8 w-8 rounded-full shadow-sm"
                        onClick={removeFlyer}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Hapus flyer</span>
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 border-t px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {flyerFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(flyerFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={openFilePicker}
                        disabled={isSubmitting}
                      >
                        Ganti
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              {/* JADWAL */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Jadwal</h3>
                    <p className="text-xs text-muted-foreground">
                      Tentukan waktu pelaksanaan dan periode pendaftaran.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_at">Tanggal & Waktu Mulai</Label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="start_at"
                        name="start_at"
                        type="datetime-local"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_at">Tanggal & Waktu Selesai</Label>
                    <div className="relative">
                      <Clock3 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="end_at"
                        name="end_at"
                        type="datetime-local"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs leading-5 text-muted-foreground">
                    Kegiatan dapat berlangsung lebih dari satu hari. Pastikan
                    waktu selesai berada setelah waktu mulai.
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="mb-4">
                    <p className="text-sm font-medium">Periode Pendaftaran</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Tentukan kapan anggota dapat melakukan pendaftaran.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="registration_start_at">
                        Pendaftaran Dibuka
                      </Label>
                      <Input
                        id="registration_start_at"
                        name="registration_start_at"
                        type="datetime-local"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registration_end_at">
                        Pendaftaran Ditutup
                      </Label>
                      <Input
                        id="registration_end_at"
                        name="registration_end_at"
                        type="datetime-local"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* LOKASI */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Lokasi</h3>
                    <p className="text-xs text-muted-foreground">
                      Tentukan bagaimana kegiatan dilaksanakan.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mode Kegiatan</Label>
                  <Select
                    value={locationType}
                    onValueChange={(value) =>
                      setLocationType(value as typeof locationType)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    name="location_type"
                    value={locationType}
                  />
                </div>

                {(locationType === "offline" || locationType === "hybrid") && (
                  <div className="space-y-2">
                    <Label htmlFor="location">Lokasi</Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="location"
                        name="location"
                        placeholder="Contoh: Aula ASPROKA Indonesia"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                )}

                {(locationType === "online" || locationType === "hybrid") && (
                  <div className="space-y-2">
                    <Label htmlFor="zoom_url">Link Zoom</Label>
                    <div className="relative">
                      <Video className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="zoom_url"
                        name="zoom_url"
                        type="url"
                        placeholder="https://zoom.us/j/..."
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* SERTIFIKAT */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Link2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      Informasi Sertifikat
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Informasi yang akan digunakan pada sertifikat.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="organizer">Penyelenggara</Label>
                    <Input
                      id="organizer"
                      name="organizer"
                      placeholder="Contoh: ASPROKA Indonesia"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certificate_title">Judul Sertifikat</Label>
                    <Input
                      id="certificate_title"
                      name="certificate_title"
                      placeholder="Contoh: Sertifikat Peserta"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* ERROR */}
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <DialogFooter className="shrink-0 border-t bg-muted/20 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan sebagai Draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
