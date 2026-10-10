"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

import type { Activity } from "./page"
import { deleteActivity } from "./delete-action"
import { ActivityDetailDialog } from "./activity-detail-dialog"
import { ActivityEditDialog } from "./activity-edit-dialog"

type ActivityTableProps = {
  activities: Activity[]
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date))
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(date))
}

function getTypeLabel(type: Activity["type"]) {
  switch (type) {
    case "training":
      return "Pelatihan"
    case "workshop":
      return "Workshop"
    case "webinar":
      return "Webinar"
    default:
      return type
  }
}

function getStatusLabel(status: Activity["status"]) {
  switch (status) {
    case "draft":
      return "Draft"
    case "published":
      return "Terbit"
    case "completed":
      return "Selesai"
    case "cancelled":
      return "Dibatalkan"
    default:
      return status
  }
}

function getStatusClassName(status: Activity["status"]) {
  switch (status) {
    case "published":
      return "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-50/80"
    case "completed":
      return "border-blue-200/80 bg-blue-50/80 text-blue-700 hover:bg-blue-50/80"
    case "cancelled":
      return "border-red-200/80 bg-red-50/80 text-red-700 hover:bg-red-50/80"
    case "draft":
    default:
      return "border-slate-200/80 bg-slate-50/80 text-slate-700 hover:bg-slate-50/80"
  }
}

function getLocationLabel(activity: Activity) {
  if (activity.location_type === "online") return "Online"
  if (activity.location_type === "hybrid") {
    return activity.location ? `Hybrid · ${activity.location}` : "Hybrid"
  }
  return activity.location || "Offline"
}

function isSameCalendarDay(start: string, end: string) {
  const getDateKey = (date: string) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(date))

    const year = parts.find((part) => part.type === "year")?.value
    const month = parts.find((part) => part.type === "month")?.value
    const day = parts.find((part) => part.type === "day")?.value
    return `${year}-${month}-${day}`
  }

  return getDateKey(start) === getDateKey(end)
}

export function ActivityTable({ activities }: ActivityTableProps) {
  const router = useRouter()

  const [selectedActivity, setSelectedActivity] =
    React.useState<Activity | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const [editActivity, setEditActivity] = React.useState<Activity | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)

  const [deleteTarget, setDeleteTarget] = React.useState<Activity | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isDeleting, startDeleteTransition] = useTransition()

  const handleOpenDetail = (activity: Activity) => {
    setSelectedActivity(activity)
    setDetailOpen(true)
  }

  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open)
    if (!open) setSelectedActivity(null)
  }

  const handleOpenEdit = (activity: Activity) => {
    setEditActivity(activity)
    setEditOpen(true)
  }

  const handleEditOpenChange = (open: boolean) => {
    setEditOpen(open)
    if (!open) setEditActivity(null)
  }

  const handleDeleteActivity = () => {
    if (!deleteTarget) return

    startDeleteTransition(async () => {
      const result = await deleteActivity(deleteTarget.id)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setDeleteOpen(false)
      setDeleteTarget(null)
      router.refresh()
    })
  }

  if (activities.length === 0) {
    return (
      <div className="flex min-h-105 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">Belum ada kegiatan</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Belum ada kegiatan yang dibuat. Tambahkan kegiatan pertama untuk mulai
          mengelola pelatihan, workshop, atau webinar.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="min-w-[320px] font-semibold">
                Kegiatan
              </TableHead>
              <TableHead className="font-semibold">Jenis</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Jadwal</TableHead>
              <TableHead className="font-semibold">Lokasi</TableHead>
              <TableHead className="w-15" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {activities.map((activity) => {
              const sameDay = isSameCalendarDay(
                activity.start_at,
                activity.end_at
              )

              return (
                <TableRow key={activity.id} className="group">
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <CalendarDays className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{activity.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {activity.organizer}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="font-medium">
                      {getTypeLabel(activity.type)}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-medium ${getStatusClassName(activity.status)}`}
                    >
                      {getStatusLabel(activity.status)}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex min-w-52.5 flex-col gap-1">
                      <div className="flex items-start gap-2 text-sm font-medium">
                        <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>
                          {sameDay
                            ? formatDate(activity.start_at)
                            : `${formatDate(activity.start_at)} – ${formatDate(activity.end_at)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatTime(activity.start_at)} -{" "}
                        {formatTime(activity.end_at)} WIB
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex max-w-55 items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {getLocationLabel(activity)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menu kegiatan</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          onSelect={() => handleOpenDetail(activity)}
                          className="cursor-pointer"
                        >
                          Lihat Detail
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onSelect={() => handleOpenEdit(activity)}
                          className="cursor-pointer"
                        >
                          Edit Kegiatan
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/manajemen/kegiatan/${activity.id}/peserta`}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Users className="h-4 w-4" />
                            <span>Peserta</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/manajemen/kegiatan/${activity.id}/batch`}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <ChevronRight className="h-4 w-4" />
                            <span>Kelola Gelombang</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onSelect={() => {
                            setDeleteTarget(activity)
                            setDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus Kegiatan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setDeleteOpen(open)
            if (!open) setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kegiatan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Kegiatan <strong>{deleteTarget?.title}</strong> akan dihapus.
              Tindakan ini tidak dapat dibatalkan. Pastikan data peserta dan
              data terkait lainnya sudah diperiksa sebelum melanjutkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting || !deleteTarget}
              onClick={(event) => {
                event.preventDefault()
                handleDeleteActivity()
              }}
                className="bg-red-600! text-white! hover:bg-red-700! focus-visible:ring-red-600!"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus Kegiatan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ActivityDetailDialog
        activity={selectedActivity}
        flyerUrl={selectedActivity?.flyer_url ?? null}
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
      />

      <ActivityEditDialog
        activity={editActivity}
        open={editOpen}
        onOpenChange={handleEditOpenChange}
      />
    </>
  )
}
