"use client"

import * as React from "react"

import {
  CalendarDays,
  Clock3,
  ExternalLink,
  FileBadge2,
  MapPin,
  MonitorPlay,
  UserRound,
  Wallet,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import type { Activity } from "./page"

type ActivityDetailDialogProps = {
  activity: Activity | null
  flyerUrl: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const typeLabels = {
  training: "Pelatihan",
  workshop: "Workshop",
  webinar: "Webinar",
} as const

const statusLabels = {
  draft: "Draft",
  published: "Terbit",
  completed: "Selesai",
  cancelled: "Dibatalkan",
} as const

const statusClasses = {
  draft:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  published:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  completed:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  cancelled:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
} as const

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date))
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date))
}

function formatRupiah(amount: number | string | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0))
}

function InfoItem({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType
  label: string
  value?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>

        {children ?? (
          <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
        )}
      </div>
    </div>
  )
}

function DetailCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  icon: React.ElementType
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <p className="mt-1 text-sm leading-5 font-medium">{value}</p>
    </div>
  )
}

export function ActivityDetailDialog({
  activity,
  flyerUrl,
  open,
  onOpenChange,
}: ActivityDetailDialogProps) {
  if (!activity) return null

  const typeLabel = typeLabels[activity.type]
  const statusLabel = statusLabels[activity.status]

  const isOnline =
    activity.location_type === "online" || activity.location_type === "hybrid"

  const hasRegistrationPeriod =
    Boolean(activity.registration_start_at) ||
    Boolean(activity.registration_end_at)

  const isPaid = Boolean(activity.is_paid)
  const registrationFee = Number(activity.registration_fee ?? 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92vh,820px)] w-[calc(100%-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        {/* HEADER */}
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-md">
                  {typeLabel}
                </Badge>

                <Badge
                  variant="outline"
                  className={`rounded-md ${statusClasses[activity.status]}`}
                >
                  {statusLabel}
                </Badge>

                <Badge
                  variant="outline"
                  className={
                    isPaid
                      ? "rounded-md border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                      : "rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                  }
                >
                  {isPaid ? "Berbayar" : "Gratis"}
                </Badge>
              </div>

              <DialogTitle className="text-xl font-semibold tracking-tight">
                Detail Kegiatan
              </DialogTitle>

              <DialogDescription className="mt-1">
                Informasi lengkap kegiatan dan penyelenggaraan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-8 p-6">
            {/* HERO */}
            <section className="grid gap-6 md:grid-cols-[260px_1fr]">
              {/* FLYER */}
              <div className="overflow-hidden rounded-2xl border bg-muted/30">
                {flyerUrl ? (
                  <div className="flex min-h-80 items-center justify-center bg-muted/20 p-3">
                    <img
                      src={flyerUrl}
                      alt={`Flyer ${activity.title}`}
                      className="max-h-105 w-full rounded-xl object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-80 items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                        <FileBadge2 className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <p className="text-sm font-medium">Tidak ada flyer</p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Flyer belum diunggah
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* HERO INFORMATION */}
              <div className="flex flex-col justify-center">
                <div>
                  <p className="text-sm font-medium text-primary">
                    {typeLabel}
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    {activity.title}
                  </h2>

                  {activity.description && (
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {activity.description}
                    </p>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-5">
                  <InfoItem
                    icon={CalendarDays}
                    label="Tanggal Kegiatan"
                    value={formatDate(activity.start_at)}
                  />

                  <InfoItem
                    icon={Clock3}
                    label="Waktu Kegiatan"
                    value={`${formatTime(activity.start_at)} - ${formatTime(
                      activity.end_at
                    )} WIB`}
                  />

                  <InfoItem icon={MapPin} label="Mode Kegiatan">
                    <div className="mt-0.5">
                      <p className="text-sm font-medium">
                        {activity.location_type === "offline"
                          ? "Offline"
                          : activity.location_type === "online"
                            ? "Online"
                            : "Hybrid"}
                      </p>

                      {activity.location && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {activity.location}
                        </p>
                      )}
                    </div>
                  </InfoItem>

                  {/* BIAYA PENDAFTARAN */}
                  <InfoItem icon={Wallet} label="Biaya Pendaftaran">
                    <div className="mt-0.5">
                      <p className="text-base font-semibold">
                        {isPaid ? formatRupiah(registrationFee) : "Gratis"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {isPaid
                          ? "Peserta wajib melakukan pembayaran sesuai nominal."
                          : "Tidak ada biaya pendaftaran untuk kegiatan ini."}
                      </p>
                    </div>
                  </InfoItem>
                </div>
              </div>
            </section>

            {/* DETAIL INFORMATION */}
            <section>
              <div className="mb-4">
                <h3 className="text-base font-semibold">Informasi Kegiatan</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Informasi administratif dan pelaksanaan kegiatan.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailCard
                  icon={UserRound}
                  label="Penyelenggara"
                  value={activity.organizer || "Tidak ditentukan"}
                />

                <DetailCard
                  icon={CalendarDays}
                  label="Mulai Kegiatan"
                  value={formatDateTime(activity.start_at)}
                />

                <DetailCard
                  icon={Clock3}
                  label="Selesai Kegiatan"
                  value={formatDateTime(activity.end_at)}
                />

                {hasRegistrationPeriod && (
                  <DetailCard
                    icon={CalendarDays}
                    label="Periode Pendaftaran"
                    value={
                      <>
                        {activity.registration_start_at
                          ? formatDateTime(activity.registration_start_at)
                          : "Tidak ditentukan"}

                        {" — "}

                        {activity.registration_end_at
                          ? formatDateTime(activity.registration_end_at)
                          : "Tidak ditentukan"}
                      </>
                    }
                  />
                )}

                <DetailCard
                  icon={Wallet}
                  label="Biaya Pendaftaran"
                  value={isPaid ? formatRupiah(registrationFee) : "Gratis"}
                />

                <DetailCard
                  icon={FileBadge2}
                  label="Judul Sertifikat"
                  value={activity.certificate_title || "Tidak ditentukan"}
                />

                <DetailCard
                  icon={MapPin}
                  label="Lokasi"
                  value={
                    activity.location ??
                    (activity.location_type === "online"
                      ? "Dilaksanakan secara online"
                      : "Tidak ditentukan")
                  }
                />
              </div>
            </section>

            {/* DESCRIPTION */}
            {activity.description && (
              <section>
                <div className="mb-4">
                  <h3 className="text-base font-semibold">Tentang Kegiatan</h3>
                </div>

                <div className="rounded-xl border bg-muted/20 p-5">
                  <p className="text-sm leading-7 whitespace-pre-line text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
              </section>
            )}

            {/* ONLINE */}
            {isOnline && (
              <section>
                <div className="rounded-xl border bg-muted/20 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
                        <MonitorPlay className="h-5 w-5 text-primary" />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold">
                          Kegiatan Online
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Kegiatan ini menggunakan platform online.
                        </p>
                      </div>
                    </div>

                    {activity.zoom_url && (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={activity.zoom_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Buka Zoom
                          <ExternalLink className="ml-2 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* CERTIFICATE */}
            <section>
              <div className="rounded-xl border bg-background p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <FileBadge2 className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">
                      Sertifikat Kegiatan
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Judul sertifikat
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {activity.certificate_title || "Belum ditentukan"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="shrink-0 border-t bg-muted/20 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
