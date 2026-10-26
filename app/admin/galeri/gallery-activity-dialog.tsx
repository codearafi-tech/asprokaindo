
"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Images } from "lucide-react"

type GalleryActivityDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: boolean
  saving?: boolean
  children: React.ReactNode
}

export function GalleryActivityDialog({
  open,
  onOpenChange,
  editing,
  saving = false,
  children,
}: GalleryActivityDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (saving && !nextOpen) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Images className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {editing ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
              </DialogTitle>

              <DialogDescription className="mt-1 text-sm text-slate-500">
                {editing
                  ? "Perbarui informasi dan dokumentasi foto kegiatan."
                  : "Lengkapi informasi kegiatan dan unggah dokumentasi foto."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
