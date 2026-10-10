"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  FileBadge2,
  ImagePlus,
  FileText,
  MapPin,
  Upload,
  UserRound,
  Video,
  Wallet,
  X,
} from "lucide-react"
import { toast } from "sonner"

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

import type { Activity } from "./page"
import { updateActivity } from "./action"

type ActivityEditDialogProps = {
  activity: Activity | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? ""

  return (
    `${get("year")}-${get("month")}-${get("day")}` +
    `T${get("hour")}:${get("minute")}`
  )
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function ActivityEditDialog({
  activity,
  open,
  onOpenChange,
}: ActivityEditDialogProps) {
  const router = useRouter()

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const [type, setType] = React.useState<"training" | "workshop" | "webinar">(
    "training"
  )

  const [status, setStatus] = React.useState<
    "draft" | "published" | "completed" | "cancelled"
  >("draft")

  const [locationType, setLocationType] = React.useState<
    "offline" | "online" | "hybrid"
  >("offline")

  const [isPaid, setIsPaid] = React.useState(false)
  const [registrationFee, setRegistrationFee] = React.useState("")

  const [flyerPreview, setFlyerPreview] = React.useState<string | null>(null)
  const [flyerFile, setFlyerFile] = React.useState<File | null>(null)

  React.useEffect(() => {
    if (!activity || !open) return

    setType(activity.type)
    setStatus(activity.status)
    setLocationType(activity.location_type)

    setIsPaid(activity.is_paid)
    setRegistrationFee(
      activity.is_paid ? String(activity.registration_fee) : ""
    )

    setFlyerPreview(activity.flyer_url ?? null)
    setFlyerFile(null)
    setErrorMessage("")
  }, [activity, open])

  React.useEffect(() => {
    return () => {
      if (flyerPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(flyerPreview)
      }
    }
  }, [flyerPreview])

  const handleFlyerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    setErrorMessage("")

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = ""
      setErrorMessage("Ukuran flyer maksimal 5 MB.")
      toast.error("Ukuran flyer terlalu besar", {
        description: "Ukuran flyer maksimal 5 MB.",
      })
      return
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      event.target.value = ""
      setErrorMessage("Format flyer harus JPG, PNG, atau WEBP.")
      toast.error("Format flyer tidak valid", {
        description: "Gunakan file JPG, PNG, atau WEBP.",
      })
      return
    }

    setFlyerFile(file)
    setFlyerPreview(URL.createObjectURL(file))
  }

  const handleRemoveNewFlyer = () => {
    setFlyerFile(null)
    setFlyerPreview(activity?.flyer_url ?? null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    setErrorMessage("")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activity || isSubmitting) return

    const fee = isPaid ? Number(registrationFee) : 0

    if (isPaid && (!Number.isSafeInteger(fee) || fee <= 0)) {
      const message =
        "Masukkan nominal biaya yang valid dan lebih besar dari Rp0."

      setErrorMessage(message)

      toast.error("Nominal biaya tidak valid", {
        description: message,
      })

      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const formElement = event.currentTarget
      const formData = new FormData(formElement)

      formData.set("type", type)
      formData.set("status", status)
      formData.set("location_type", locationType)

      formData.set("is_paid", isPaid ? "true" : "false")
      formData.set("registration_fee", String(fee))

      // Pastikan field lokasi dan Zoom selalu terkirim,
      // termasuk ketika mode kegiatan diubah.
      if (locationType === "online") {
        formData.set("location", "")
      }

      if (locationType === "offline") {
        formData.set("zoom_url", "")
      }

      const result = await updateActivity(activity.id, formData)

      if (!result.success) {
        setErrorMessage(result.message)

        toast.error("Gagal memperbarui kegiatan", {
          description: result.message,
        })

        return
      }

      toast.success("Berhasil!", {
        description: "Perubahan kegiatan berhasil disimpan.",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Gagal memperbarui kegiatan:", error)

      const message = "Terjadi kesalahan saat memperbarui kegiatan."

      setErrorMessage(message)

      toast.error("Terjadi kesalahan", {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!activity) {
    return null
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isSubmitting) return

        if (!value) {
          setErrorMessage("")
          setFlyerFile(null)
        }

        onOpenChange(value)
      }}
    >
      <DialogContent
        key={activity.id}
        className="flex h-[min(92vh,800px)] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>Edit Kegiatan</DialogTitle>
          <DialogDescription>
            Perbarui informasi, jadwal, biaya, dan pengaturan kegiatan.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-8 p-6">
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm leading-5 text-destructive"
                >
                  {errorMessage}
                </div>
              )}

              {/* INFORMASI KEGIATAN */}
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
                  <Label htmlFor="edit-title">Judul Kegiatan</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    defaultValue={activity.title}
                    placeholder="Contoh: Pelatihan Digital Marketing"
                    required
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Jenis Kegiatan</Label>
                    <Select
                      value={type}
                      onValueChange={(value) => setType(value as typeof type)}
                    >
                      <SelectTrigger id="edit-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="training">Pelatihan</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="webinar">Webinar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value) =>
                        setStatus(value as typeof status)
                      }
                    >
                      <SelectTrigger id="edit-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Terbit</SelectItem>
                        <SelectItem value="completed">Selesai</SelectItem>
                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Deskripsi</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={activity.description ?? ""}
                    placeholder="Jelaskan mengenai kegiatan..."
                    rows={5}
                    className="resize-none"
                  />
                </div>
              </section>

              {/* BIAYA PENDAFTARAN */}
              <section className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Biaya Pendaftaran</h3>
                    <p className="text-xs text-muted-foreground">
                      Tentukan apakah kegiatan gratis atau berbayar.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-payment-type">Jenis Biaya</Label>
                  <Select
                    value={isPaid ? "paid" : "free"}
                    onValueChange={(value) => {
                      const paid = value === "paid"

                      setIsPaid(paid)

                      if (!paid) {
                        setRegistrationFee("")
                      } else if (!registrationFee) {
                        setRegistrationFee("")
                      }
                    }}
                  >
                    <SelectTrigger id="edit-payment-type" className="w-full">
                      <SelectValue placeholder="Pilih jenis biaya" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratis</SelectItem>
                      <SelectItem value="paid">Berbayar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isPaid ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-registration-fee">
                      Nominal Biaya (Rp)
                    </Label>
                    <Input
                      id="edit-registration-fee"
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
                      Masukkan nominal rupiah tanpa titik atau pemisah.
                    </p>

                    {Number(registrationFee) > 0 &&
                      Number.isSafeInteger(Number(registrationFee)) && (
                        <div className="rounded-lg border bg-muted/30 px-4 py-3">
                          <p className="text-xs text-muted-foreground">
                            Pratinjau biaya
                          </p>
                          <p className="mt-1 text-lg font-semibold">
                            {formatRupiah(Number(registrationFee))}
                          </p>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 px-4 py-3">
                    <p className="text-sm font-medium">Rp0 — Gratis</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Peserta tidak perlu membayar biaya pendaftaran.
                    </p>
                  </div>
                )}
              </section>

              {/* FLYER */}
              <section className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <ImagePlus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Flyer Kegiatan</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ganti flyer jika diperlukan. Maksimal 5 MB.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-muted/20">
                  <div className="relative flex min-h-55 items-center justify-center bg-muted/30 p-4">
                    {flyerPreview ? (
                      <img
                        src={flyerPreview}
                        alt={`Flyer ${activity.title}`}
                        className="max-h-80 w-auto max-w-full rounded-lg object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium">
                          Tidak ada flyer
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Upload flyer baru.
                        </p>
                      </div>
                    )}

                    {flyerFile && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-4 right-4 h-8 w-8 rounded-full shadow-sm"
                        onClick={handleRemoveNewFlyer}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Batalkan flyer baru</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 border-t px-4 py-3">
                    <Input
                      ref={fileInputRef}
                      id="edit-flyer"
                      name="flyer"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFlyerChange}
                    />

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Upload className="h-4 w-4 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {flyerFile ? flyerFile.name : "Flyer saat ini"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {flyerFile
                          ? "File baru akan menggantikan flyer lama."
                          : "Pilih file baru jika ingin mengganti flyer."}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      Ganti Flyer
                    </Button>
                  </div>
                </div>
              </section>

              {/* JADWAL */}
              <section className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Jadwal Kegiatan</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Kegiatan dapat berlangsung satu hari atau beberapa hari.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start-at">Tanggal & Waktu Mulai</Label>
                    <Input
                      id="edit-start-at"
                      name="start_at"
                      type="datetime-local"
                      defaultValue={toDateTimeLocal(activity.start_at)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-end-at">Tanggal & Waktu Selesai</Label>
                    <Input
                      id="edit-end-at"
                      name="end_at"
                      type="datetime-local"
                      defaultValue={toDateTimeLocal(activity.end_at)}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* PENDAFTARAN */}
              <section className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold">Periode Pendaftaran</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Atur periode pendaftaran peserta.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-registration-start">
                      Pendaftaran Dibuka
                    </Label>
                    <Input
                      id="edit-registration-start"
                      name="registration_start_at"
                      type="datetime-local"
                      defaultValue={toDateTimeLocal(
                        activity.registration_start_at
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-registration-end">
                      Pendaftaran Ditutup
                    </Label>
                    <Input
                      id="edit-registration-end"
                      name="registration_end_at"
                      type="datetime-local"
                      defaultValue={toDateTimeLocal(
                        activity.registration_end_at
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* LOKASI */}
              <section className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Lokasi</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tentukan mode pelaksanaan kegiatan.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-location-type">Mode Kegiatan</Label>
                  <Select
                    value={locationType}
                    onValueChange={(value) =>
                      setLocationType(value as typeof locationType)
                    }
                  >
                    <SelectTrigger id="edit-location-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(locationType === "offline" || locationType === "hybrid") && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Lokasi Pelaksanaan</Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="edit-location"
                        name="location"
                        defaultValue={activity.location ?? ""}
                        className="pl-9"
                        placeholder="Contoh: Aula ASPROKA Indonesia"
                        required
                      />
                    </div>
                  </div>
                )}

                {(locationType === "online" || locationType === "hybrid") && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-zoom-url">Link Zoom</Label>
                    <div className="relative">
                      <Video className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="edit-zoom-url"
                        name="zoom_url"
                        type="url"
                        defaultValue={activity.zoom_url ?? ""}
                        className="pl-9"
                        placeholder="https://zoom.us/..."
                        required
                      />
                    </div>
                  </div>
                )}

                {locationType === "online" && (
                  <input type="hidden" name="location" value="" readOnly />
                )}

                {locationType === "offline" && (
                  <input type="hidden" name="zoom_url" value="" readOnly />
                )}
              </section>

              {/* SERTIFIKAT */}
              <section className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <FileBadge2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Sertifikat</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Informasi yang digunakan pada sertifikat.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-organizer">Penyelenggara</Label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="edit-organizer"
                        name="organizer"
                        defaultValue={activity.organizer}
                        placeholder="Nama organisasi / penyelenggara"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-certificate-title">
                      Judul Sertifikat
                    </Label>
                    <Input
                      id="edit-certificate-title"
                      name="certificate_title"
                      defaultValue={activity.certificate_title}
                      placeholder="Contoh: Sertifikat Peserta"
                      required
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t bg-muted/20 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
