"use client"

import * as React from "react"

import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  UserRound,
  BriefcaseBusiness,
  CreditCard,
  XCircle,
} from "lucide-react"

import { useRouter } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

import { Separator } from "@/components/ui/separator"

import { Textarea } from "@/components/ui/textarea"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { approveVerification, rejectVerification } from "./action"

import type { VerificationSubmission } from "./page"

type VerificationDetailDialogProps = {
  submission: VerificationSubmission | null

  open: boolean

  onOpenChange: (open: boolean) => void
}

function formatDate(date: string | null) {
  if (!date) {
    return "-"
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID").format(Number(amount))
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p className="text-sm leading-6 font-medium wrap-break-word">
        {value !== null && value !== undefined && String(value).trim() !== ""
          ? value
          : "-"}
      </p>
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <h3 className="text-sm font-semibold">{children}</h3>
    </div>
  )
}

function isPdfFile(path: string | null) {
  if (!path) {
    return false
  }

  return path.toLowerCase().split("?")[0].endsWith(".pdf")
}

export function VerificationDetailDialog({
  submission,
  open,
  onOpenChange,
}: VerificationDetailDialogProps) {
  const router = useRouter()

  const [isApproving, setIsApproving] = React.useState(false)

  const [isRejecting, setIsRejecting] = React.useState(false)

  const [showRejectConfirmation, setShowRejectConfirmation] =
    React.useState(false)

  const [rejectionReason, setRejectionReason] = React.useState("")

  if (!submission) {
    return null
  }

  const verificationId = submission.id

  const details = submission.details

  const name =
    submission.profile?.full_name || details?.full_name || "Nama belum tersedia"

  const isPending = submission.status === "submitted"

  const paymentProofUrl = submission.payment_proof_url

  const paymentProofIsPdf = isPdfFile(submission.payment_proof_path)

  async function handleApprove() {
    try {
      setIsApproving(true)

      await approveVerification(verificationId)

      onOpenChange(false)

      router.refresh()
    } catch (error) {
      console.error("Gagal menyetujui verifikasi:", error)

      alert(
        error instanceof Error ? error.message : "Gagal menyetujui pengajuan."
      )
    } finally {
      setIsApproving(false)
    }
  }

  async function handleReject() {
    const reason = rejectionReason.trim()

    if (!reason) {
      return
    }

    try {
      setIsRejecting(true)

      await rejectVerification(verificationId, reason)

      setShowRejectConfirmation(false)

      setRejectionReason("")

      onOpenChange(false)

      router.refresh()
    } catch (error) {
      console.error("Gagal menolak verifikasi:", error)

      alert(error instanceof Error ? error.message : "Gagal menolak pengajuan.")
    } finally {
      setIsRejecting(false)
    }
  }

  function handleDialogChange(value: boolean) {
    if (isApproving || isRejecting) {
      return
    }

    onOpenChange(value)

    if (!value) {
      setShowRejectConfirmation(false)
      setRejectionReason("")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-hidden p-0">
          {/* ================================================= */}
          {/* HEADER */}
          {/* ================================================= */}

          <DialogHeader className="border-b px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4 pr-6">
              <div className="min-w-0">
                <DialogTitle className="text-xl">Detail Verifikasi</DialogTitle>

                <DialogDescription className="mt-1">
                  Periksa data dan bukti pembayaran sebelum memberikan
                  keputusan.
                </DialogDescription>
              </div>

              <div className="shrink-0">
                {submission.status === "submitted" && (
                  <Badge variant="secondary" className="gap-1">
                    <Clock3 className="size-3" />
                    Menunggu
                  </Badge>
                )}

                {submission.status === "approved" && (
                  <Badge className="gap-1 border-blue-200/80 bg-blue-50/80 text-blue-700 font-medium hover:bg-blue-50/80" variant="outline">
                    <CheckCircle2 className="size-3" />
                    Terverifikasi
                  </Badge>
                )}

                {submission.status === "rejected" && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="size-3" />
                    Ditolak
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* ================================================= */}
          {/* CONTENT */}
          {/* ================================================= */}

          <div className="max-h-[75vh] overflow-y-auto">
            <div className="space-y-7 p-5 sm:space-y-8 sm:p-6">
              {/* ================================================= */}
              {/* INFORMASI AKUN */}
              {/* ================================================= */}

              <section className="space-y-5">
                <SectionTitle icon={UserRound}>Informasi Akun</SectionTitle>

                <div className="grid grid-cols-1 gap-5 rounded-xl border bg-muted/20 p-5 md:grid-cols-2">
                  <DetailItem label="Nama Akun" value={name} />

                  <DetailItem label="Email" value={submission.profile?.email} />
                </div>
              </section>

              <Separator />

              {/* ================================================= */}
              {/* DATA PRIBADI */}
              {/* ================================================= */}

              <section className="space-y-5">
                <SectionTitle icon={UserRound}>Data Pribadi</SectionTitle>

                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                  <DetailItem label="Nama Lengkap" value={details?.full_name} />

                  <DetailItem
                    label="Gelar"
                    value={
                      [details?.title_prefix, details?.title_suffix]
                        .filter(Boolean)
                        .join(" ") || "-"
                    }
                  />

                  <DetailItem
                    label="Tempat Lahir"
                    value={details?.birth_place}
                  />

                  <DetailItem
                    label="Tanggal Lahir"
                    value={formatDate(details?.birth_date ?? null)}
                  />

                  <DetailItem label="Jenis Kelamin" value={details?.gender} />

                  <DetailItem label="Kode Pos" value={details?.postal_code} />
                </div>
              </section>

              <Separator />

              {/* ================================================= */}
              {/* ALAMAT */}
              {/* ================================================= */}

              <section className="space-y-5">
                <SectionTitle icon={MapPin}>Alamat</SectionTitle>

                <div className="space-y-5">
                  <DetailItem label="Alamat Lengkap" value={details?.address} />

                  <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
                    <DetailItem label="Provinsi" value={details?.province} />

                    <DetailItem
                      label="Kabupaten / Kota"
                      value={details?.city}
                    />

                    <DetailItem label="Kecamatan" value={details?.district} />
                  </div>
                </div>
              </section>

              <Separator />

              {/* ================================================= */}
              {/* DATA PROFESIONAL */}
              {/* ================================================= */}

              <section className="space-y-5">
                <SectionTitle icon={BriefcaseBusiness}>
                  Data Profesional
                </SectionTitle>

                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                  <DetailItem label="Pekerjaan" value={details?.occupation} />

                  <DetailItem
                    label="Instansi"
                    value={details?.institution_name}
                  />

                  <DetailItem label="Jabatan" value={details?.position} />

                  <DetailItem
                    label="Pendidikan Terakhir"
                    value={details?.education}
                  />

                  <DetailItem
                    label="Pengalaman Kerja"
                    value={
                      details?.work_experience_years !== null &&
                      details?.work_experience_years !== undefined
                        ? `${details.work_experience_years} tahun`
                        : "-"
                    }
                  />

                  <DetailItem
                    label="Kompetensi"
                    value={details?.competencies}
                  />
                </div>
              </section>

              <Separator />

              {/* ================================================= */}
              {/* PROFIL PROFESIONAL */}
              {/* ================================================= */}

              <section className="space-y-5">
                <SectionTitle icon={ExternalLink}>
                  Profil Profesional
                </SectionTitle>

                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                  <DetailItem label="LinkedIn" value={details?.linkedin_url} />

                  <DetailItem label="Website" value={details?.website_url} />
                </div>
              </section>

              <Separator />

              {/* ================================================= */}
              {/* PEMBAYARAN */}
              {/* ================================================= */}

              <section className="space-y-5">
                <SectionTitle icon={CreditCard}>Pembayaran</SectionTitle>

                {/* Summary pembayaran */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border bg-muted/20 p-5">
                    <p className="text-xs text-muted-foreground">
                      Nominal Pembayaran
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      Rp {formatCurrency(submission.amount)}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-5">
                    <p className="text-xs text-muted-foreground">
                      Tanggal Pengajuan
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {formatDate(submission.created_at)}
                    </p>
                  </div>
                </div>

                {/* Bukti pembayaran */}
                <div className="overflow-hidden rounded-xl border">
                  <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">Bukti Pembayaran</p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Dokumen yang diunggah oleh anggota.
                      </p>
                    </div>

                    {paymentProofUrl && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <a
                          href={paymentProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 size-4" />
                          Buka File
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="p-4 sm:p-6">
                    {!paymentProofUrl ? (
                      <div className="flex min-h-45 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 text-center">
                        <FileText className="mb-3 h-9 w-9 text-muted-foreground" />

                        <p className="text-sm font-medium">
                          Bukti pembayaran tidak tersedia
                        </p>

                        <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                          URL bukti pembayaran belum berhasil dibuat.
                        </p>
                      </div>
                    ) : paymentProofIsPdf ? (
                      <div className="overflow-hidden rounded-lg border bg-muted/20">
                        <iframe
                          src={paymentProofUrl}
                          title="Bukti pembayaran"
                          className="h-125 w-full"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-center overflow-hidden rounded-lg border bg-muted/20 p-2 sm:p-4">
                        <img
                          src={paymentProofUrl}
                          alt="Bukti pembayaran"
                          className="max-h-130 w-auto max-w-full rounded-md object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          {isPending && (
            <div className="border-t bg-muted/20 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  Pastikan seluruh data dan bukti pembayaran telah sesuai.
                </p>

                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isApproving || isRejecting}
                    onClick={() => setShowRejectConfirmation(true)}
                    className="flex-1 sm:flex-none"
                  >
                    <XCircle className="mr-2 size-4" />
                    Tolak
                  </Button>

                  <Button
                    type="button"
                    disabled={isApproving || isRejecting}
                    onClick={handleApprove}
                    className="flex-1 sm:flex-none"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Menyetujui...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 size-4" />
                        Setujui
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================================================= */}
      {/* CONFIRMATION TOLAK */}
      {/* ================================================= */}

      <AlertDialog
        open={showRejectConfirmation}
        onOpenChange={(value) => {
          if (!isRejecting) {
            setShowRejectConfirmation(value)

            if (!value) {
              setRejectionReason("")
            }
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Pengajuan?</AlertDialogTitle>

            <AlertDialogDescription>
              Pengajuan dari{" "}
              <span className="font-medium text-foreground">{name}</span> akan
              ditolak. Silakan berikan alasan penolakan agar anggota mengetahui
              hal yang perlu diperbaiki.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <label htmlFor="rejection-reason" className="text-sm font-medium">
              Alasan Penolakan
            </label>

            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Contoh: Bukti pembayaran tidak sesuai dengan nominal yang ditentukan."
              disabled={isRejecting}
              className="min-h-27.5 resize-none"
            />

            <p className="text-xs text-muted-foreground">
              Alasan ini akan disimpan sebagai catatan admin.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Batal</AlertDialogCancel>

            <AlertDialogAction
              disabled={isRejecting || !rejectionReason.trim()}
              onClick={handleReject}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menolak...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 size-4" />
                  Ya, Tolak Pengajuan
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
