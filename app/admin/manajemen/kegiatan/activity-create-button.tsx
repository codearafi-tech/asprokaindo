"use client"

import * as React from "react"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

import { ActivityDialog } from "./activity-dialog"

export function ActivityCreateButton() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Kegiatan
      </Button>

      <ActivityDialog
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}