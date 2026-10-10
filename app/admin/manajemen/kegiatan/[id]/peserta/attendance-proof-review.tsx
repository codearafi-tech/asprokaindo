
"use client"

import { useState, useTransition } from "react"
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  approveAttendanceProof,
  rejectAttendanceProof,
} from "./action"

type Props = {
  registrationId: string
  participantName: string
  proofPath: string | null
  proofUrl: string | null
  proofStatus: string | null
  proofSubmittedAt: string | null
  adminNote: string | null
}

function formatDate(value: string | null) {
  if (!value) return "-"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date)
}

export function AttendanceProofReview({
  registrationId,
  participantName,
  proofPath,
  proofUrl,
  proofStatus,
  proofSubmittedAt,
  adminNote,
}: Props) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState("")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  const status = proofStatus ?? "not_submitted"
  const canReview = status === "pending" && Boolean(proofPath)

  function handleApprove() {
    if (!canReview) return

    startTransition(async () => {
      const result = await approveAttendanceProof(registrationId)

      setMessage(result.message)

      if (result.success) {
        setOpen(false)
      }
    })
  }

  function handleReject() {
    if (!canReview) return

    if (!note.trim()) {
      setMessage("Catatan penolakan wajib diisi.")
      return
    }

    startTransition(async () => {
      const result = await rejectAttendanceProof(
        registrationId,
        note.trim(),
      )

      setMessage(result.message)

      if (result.success) {
        setNote("")
        setOpen(false)
      }
    })
  }

  return (
    <>
      <div className="flex min-w-max flex-wrap items-center gap-2">
    
        {proofPath && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setMessage("")
              setOpen(true)
            }}
          >
            <FileCheck2 className="mr-2 size-4" />
            Review bukti
          </Button>
        )}

        {status === "rejected" && adminNote && (
          <p className="max-w-48 text-xs text-muted-foreground">
            Catatan: {adminNote}
          </p>
        )}

        {message && (
          <p className="max-w-48 text-xs text-muted-foreground">
            {message}
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Bukti Daftar Hadir</DialogTitle>
            <DialogDescription>
              Periksa bukti daftar hadir milik {participantName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p>
                <span className="text-muted-foreground">
                  Status:{" "}
                </span>
                <span className="font-medium">{status}</span>
              </p>

              <p className="mt-1">
                <span className="text-muted-foreground">
                  Dikirim:{" "}
                </span>
                {formatDate(proofSubmittedAt)}
              </p>
            </div>

            {proofUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-lg border bg-muted/20 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofUrl}
                    alt={`Bukti daftar hadir ${participantName}`}
                    className="mx-auto max-h-[50vh] w-auto max-w-full rounded object-contain"
                  />
                </div>

                <Button asChild variant="outline" className="w-full">
                  <a href={proofUrl} target="_blank" rel="noreferrer">
                    <Eye className="mr-2 size-4" />
                    Buka bukti di tab baru
                  </a>
                </Button>
              </div>
            ) : (
              <p className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">
                Bukti tidak dapat dibuka. Periksa file di bucket
                attendance-proofs dan pastikan path tersimpan dengan benar.
              </p>
            )}

            {status === "rejected" && adminNote && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
                <p className="font-medium">Catatan penolakan sebelumnya</p>
                <p className="mt-1 text-muted-foreground">{adminNote}</p>
              </div>
            )}

            {canReview && (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor={`attendance-note-${registrationId}`}
                    className="text-sm font-medium"
                  >
                    Catatan penolakan
                  </label>

                  <Textarea
                    id={`attendance-note-${registrationId}`}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Wajib diisi jika bukti ditolak."
                    rows={3}
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isPending}
                  >
                    <XCircle className="mr-2 size-4" />
                    {isPending ? "Memproses..." : "Tolak bukti"}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleApprove}
                    disabled={isPending || !proofUrl}
                  >
                    <CheckCircle2 className="mr-2 size-4" />
                    {isPending ? "Memproses..." : "Setujui bukti"}
                  </Button>
                </div>
              </>
            )}

            {!canReview && (
              <p className="text-sm text-muted-foreground">
                Bukti ini tidak sedang menunggu review.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
