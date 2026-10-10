
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Award, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { issueActivityCertificates } from "./action"

type Props = {
  activityId: string
  disabled?: boolean
  alreadyIssued?: boolean
}

export function IssueCertificatesButton({
  activityId,
  disabled = false,
  alreadyIssued = false,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleIssue() {
    if (disabled || isPending) return

    if (!confirming) {
      setConfirming(true)
      return
    }

    startTransition(async () => {
      const result = await issueActivityCertificates(activityId)

      if (!result.success) {
        toast.error("Sertifikat belum diterbitkan", {
          description: result.message,
        })
        setConfirming(false)
        return
      }

      toast.success("Proses sertifikat selesai", {
        description:
          result.issuedCount === 0
            ? result.message
            : `${result.message} ${result.issuedCount} sertifikat baru ditambahkan.`,
      })

      setConfirming(false)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        onClick={handleIssue}
        disabled={disabled || isPending}
      >
        {isPending ? (
          <LoaderCircle className="mr-2 size-4 animate-spin" />
        ) : (
          <Award className="mr-2 size-4" />
        )}
        {isPending
          ? "Memproses..."
          : confirming
            ? "Konfirmasi Terbitkan"
            : alreadyIssued
              ? "Periksa Sertifikat"
              : "Terbitkan Sertifikat"}
      </Button>

      {confirming && !isPending && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirming(false)}
        >
          Batal
        </Button>
      )}
    </div>
  )
}
