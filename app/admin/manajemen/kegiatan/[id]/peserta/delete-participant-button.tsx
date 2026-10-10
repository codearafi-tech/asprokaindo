
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { deleteParticipant } from "./action"

type Props = {
  registrationId: string
  participantName: string
}

export function DeleteParticipantButton({
  registrationId,
  participantName,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function handleDelete() {
    if (pending) return

    startTransition(async () => {
      try {
        const result = await deleteParticipant(registrationId)

        if (!result.success) {
          toast.error(result.message)
          return
        }

        toast.success(result.message)
        setOpen(false)
        router.refresh()
      } catch (error) {
        console.error("Gagal menghapus peserta:", error)
        toast.error("Terjadi kesalahan saat menghapus peserta.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={pending ? undefined : setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="size-8"
          aria-label={`Hapus peserta ${participantName}`}
          title="Hapus peserta"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="size-4" />
            </span>
            Hapus peserta ini?
          </AlertDialogTitle>

          <AlertDialogDescription>
            Pendaftaran peserta{" "}
            <strong className="font-semibold text-foreground">
              {participantName}
            </strong>{" "}
            akan dihapus dari kegiatan ini. Akun dan profil anggota tidak akan
            dihapus. Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            Batal
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              handleDelete()
            }}
            className="bg-red-600! text-white! hover:bg-red-700!"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 size-4" />
                Ya, Hapus Peserta
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
