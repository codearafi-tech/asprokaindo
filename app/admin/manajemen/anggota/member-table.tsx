"use client"

import * as React from "react"
import Link from "next/link"

import {
  Eye,
  MoreHorizontal,
  Search,
  Trash2,
  Users,
} from "lucide-react"

import { deleteMember } from "./action"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ============================================================
// TYPE
// ============================================================

type Member = {
  id: string
  name: string
  email: string
  memberNumber: string | null
  certificateNumber: string | null
  institution: string
  position: string
  photoUrl: string | null
  registeredAt: string | null
  membershipStartDate: string | null
  membershipExpiryDate: string | null
}

type MemberTableProps = {
  members: Member[]
}

type StatusFilter = "all" | "active" | "expired"

// ============================================================
// HELPER
// ============================================================

function getInitials(name: string) {
  if (!name) return "?"

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
}

// ============================================================
// CEK STATUS MEMBERSHIP
// ============================================================

function isMembershipActive(
  membershipStartDate: string | null,
  membershipExpiryDate: string | null
) {
  if (!membershipStartDate || !membershipExpiryDate) {
    return false
  }

  const now = new Date()
  const start = new Date(membershipStartDate)
  const expiry = new Date(membershipExpiryDate)

  return now >= start && now <= expiry
}

// ============================================================
// COMPONENT
// ============================================================

export default function MemberTable({
  members,
}: MemberTableProps) {
  // ==========================================================
  // STATE
  // ==========================================================

  const [search, setSearch] = React.useState("")

  const [statusFilter, setStatusFilter] =
    React.useState<StatusFilter>("all")

  const [memberToDelete, setMemberToDelete] =
    React.useState<Member | null>(null)

  const [isDeleting, setIsDeleting] =
    React.useState(false)

  // ==========================================================
  // FILTER DATA
  // ==========================================================

  const filteredMembers = React.useMemo(() => {
    const query = search.trim().toLowerCase()

    return members.filter((member) => {
      // ------------------------------------------------------
      // FILTER MASA BERLAKU
      // ------------------------------------------------------

      const active = isMembershipActive(
        member.membershipStartDate,
        member.membershipExpiryDate
      )

      if (
        statusFilter === "active" &&
        !active
      ) {
        return false
      }

      if (
        statusFilter === "expired" &&
        active
      ) {
        return false
      }

      // ------------------------------------------------------
      // FILTER SEARCH
      // ------------------------------------------------------

      if (!query) {
        return true
      }

      return [
        member.name,
        member.email,
        member.memberNumber,
        member.institution,
        member.position,
      ].some((value) =>
        value?.toLowerCase().includes(query)
      )
    })
  }, [
    members,
    search,
    statusFilter,
  ])

  // ==========================================================
  // DELETE MEMBER
  // ==========================================================

  async function handleDeleteMember() {
    if (!memberToDelete) {
      return
    }

    try {
      setIsDeleting(true)

      const result = await deleteMember(
        memberToDelete.id
      )

      if (!result.success) {
        throw new Error(
          result.message ||
            "Gagal menghapus data member."
        )
      }

      setMemberToDelete(null)

      // Refresh halaman agar data terbaru
      // langsung diambil dari server.
      window.location.reload()
    } catch (error) {
      console.error(
        "Gagal menghapus member:",
        error
      )

      alert(
        error instanceof Error
          ? error.message
          : "Gagal menghapus data member."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // ==========================================================
  // LABEL FILTER
  // ==========================================================

  const filterLabel =
    statusFilter === "all"
      ? "Semua Status"
      : statusFilter === "active"
        ? "Aktif"
        : "Kedaluwarsa"

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-4">

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        {/* ====================================================
            FILTER
        ==================================================== */}

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">

          {/* SEARCH */}

          <div className="relative w-full sm:w-105">
            <Search
              className="
                pointer-events-none
                absolute
                top-1/2
                left-3
                h-4
                w-4
                -translate-y-1/2
                text-muted-foreground
              "
            />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari nama, nomor anggota, email..."
              className="h-10 pl-9"
            />
          </div>

          {/* FILTER MASA BERLAKU */}

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(
                value as StatusFilter
              )
            }
          >
            <SelectTrigger className="h-10 w-full sm:w-45">
              <SelectValue placeholder="Masa berlaku">
                {filterLabel}
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Semua Status
              </SelectItem>

              <SelectItem value="active">
                Aktif
              </SelectItem>

              <SelectItem value="expired">
                Kedaluwarsa
              </SelectItem>
            </SelectContent>
          </Select>

        </div>

        {/* ====================================================
            COUNT
        ==================================================== */}

        <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />

          <span>
            {filteredMembers.length} dari{" "}
            {members.length} anggota
          </span>
        </div>

      </div>

      {/* ======================================================
          TABLE CARD
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">

        <div className="overflow-x-auto">

          <Table className="min-w-250">

            {/* ==================================================
                HEADER
            ================================================== */}

            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">

                <TableHead className="h-11 w-[30%] px-4 font-semibold">
                  Anggota
                </TableHead>

                <TableHead className="h-11 w-[22%] font-semibold">
                  Nomor Anggota
                </TableHead>

                <TableHead className="h-11 w-[15%] font-semibold">
                  Instansi
                </TableHead>

                <TableHead className="h-11 w-[18%] font-semibold">
                  Jabatan
                </TableHead>

                <TableHead className="h-11 w-[10%] font-semibold">
                  Masa Berlaku
                </TableHead>

                <TableHead className="h-11 w-15 px-4 text-right font-semibold">
                  Aksi
                </TableHead>

              </TableRow>
            </TableHeader>

            {/* ==================================================
                BODY
            ================================================== */}

            <TableBody>

              {filteredMembers.length > 0 ? (

                filteredMembers.map((member) => {

                  const active =
                    isMembershipActive(
                      member.membershipStartDate,
                      member.membershipExpiryDate
                    )

                  return (
                    <TableRow
                      key={member.id}
                      className="
                        group
                        transition-colors
                        hover:bg-muted/30
                      "
                    >

                      {/* ========================================
                          ANGGOTA
                      ======================================== */}

                      <TableCell className="px-4 py-3.5">

                        <div className="flex items-center gap-3">

                          <Avatar className="h-10 w-10 shrink-0 border">

                            <AvatarImage
                              src={
                                member.photoUrl ??
                                undefined
                              }
                              alt={member.name}
                              className="object-cover"
                            />

                            <AvatarFallback className="text-xs font-medium">
                              {getInitials(
                                member.name
                              )}
                            </AvatarFallback>

                          </Avatar>

                          <div className="min-w-0">

                            <p
                              className="
                                truncate
                                leading-5
                                font-medium
                              "
                              title={member.name}
                            >
                              {member.name}
                            </p>

                            <p
                              className="
                                mt-0.5
                                truncate
                                text-xs
                                text-muted-foreground
                              "
                              title={member.email}
                            >
                              {member.email}
                            </p>

                          </div>

                        </div>

                      </TableCell>

                      {/* ========================================
                          NOMOR ANGGOTA
                      ======================================== */}

                      <TableCell>

                        {member.memberNumber ? (

                          <span
                            className="
                              font-mono
                              text-sm
                              tracking-tight
                              whitespace-nowrap
                            "
                          >
                            {member.memberNumber}
                          </span>

                        ) : (

                          <span className="text-muted-foreground">
                            -
                          </span>

                        )}

                      </TableCell>

                      {/* ========================================
                          INSTANSI
                      ======================================== */}

                      <TableCell>

                        <span
                          className="
                            block
                            max-w-45
                            truncate
                            text-sm
                          "
                          title={member.institution}
                        >
                          {member.institution}
                        </span>

                      </TableCell>

                      {/* ========================================
                          JABATAN
                      ======================================== */}

                      <TableCell>

                        <span
                          className="
                            block
                            max-w-55
                            truncate
                            text-sm
                          "
                          title={member.position}
                        >
                          {member.position}
                        </span>

                      </TableCell>

                      {/* ========================================
                          MASA BERLAKU
                      ======================================== */}

                      <TableCell>

                        {active ? (

                          <Badge className="border-emerald-200/80 bg-emerald-50/80 text-emerald-700 font-medium hover:bg-emerald-50/80">
                            Aktif
                          </Badge>

                        ) : (

                          <Badge
                            variant="destructive"
                            className="font-medium"
                          >
                            Kedaluwarsa
                          </Badge>

                        )}

                      </TableCell>

                      {/* ========================================
                          AKSI
                      ======================================== */}

                      <TableCell className="px-4 text-right">

                        <DropdownMenu>

                          <DropdownMenuTrigger asChild>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="
                                h-8
                                w-8
                                opacity-70
                                transition-opacity
                                hover:opacity-100
                              "
                            >
                              <MoreHorizontal className="h-4 w-4" />

                              <span className="sr-only">
                                Buka menu anggota
                              </span>
                            </Button>

                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="w-48"
                          >

                            {/* ==================================
                                LIHAT DETAIL
                            ================================== */}

                            <DropdownMenuItem asChild>

                              <Link
                                href={`/admin/manajemen/anggota/${member.id}`}
                                className="
                                  flex
                                  cursor-pointer
                                  items-center
                                  gap-2
                                "
                              >
                                <Eye className="h-4 w-4" />

                                <span>
                                  Lihat Detail
                                </span>
                              </Link>

                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* ==================================
                                HAPUS DATA
                            ================================== */}

                            <DropdownMenuItem
                              className="
                                cursor-pointer
                                text-destructive
                                focus:bg-destructive/10
                                focus:text-destructive
                              "
                              onSelect={() =>
                                setMemberToDelete(
                                  member
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />

                              <span>
                                Hapus Data
                              </span>
                            </DropdownMenuItem>

                          </DropdownMenuContent>

                        </DropdownMenu>

                      </TableCell>

                    </TableRow>
                  )
                })

              ) : (

                /* =================================================
                   EMPTY STATE
                ================================================= */

                <TableRow>

                  <TableCell
                    colSpan={6}
                    className="h-40 text-center"
                  >

                    <div className="flex flex-col items-center justify-center gap-2">

                      <div className="rounded-full bg-muted p-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <div>

                        <p className="text-sm font-medium">
                          Tidak ada anggota
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">

                          {search &&
                          statusFilter !== "all"
                            ? `Tidak ada anggota yang sesuai dengan pencarian dan filter ${statusFilter === "active" ? "aktif" : "kedaluwarsa"}.`
                            : search
                              ? "Tidak ada anggota yang sesuai dengan pencarian."
                              : statusFilter !== "all"
                                ? `Tidak ada anggota dengan status ${statusFilter === "active" ? "aktif" : "kedaluwarsa"}.`
                                : "Belum ada anggota terverifikasi."}

                        </p>

                      </div>

                    </div>

                  </TableCell>

                </TableRow>

              )}

            </TableBody>

          </Table>

        </div>

      </div>

      {/* ======================================================
          DELETE CONFIRMATION
      ====================================================== */}

      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setMemberToDelete(null)
          }
        }}
      >

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>
              Hapus Data Member?
            </AlertDialogTitle>

            <AlertDialogDescription>

              Apakah Anda yakin ingin menghapus data member{" "}

              <span className="font-medium text-foreground">
                {memberToDelete?.name}
              </span>

              ?

              <br />

              <span className="mt-2 block">
                Tindakan ini akan menghapus data
                member dari sistem dan tidak dapat
                dibatalkan.
              </span>

            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel
              disabled={isDeleting}
            >
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDeleteMember}
              className="
                bg-destructive
                text-destructive-foreground
                hover:bg-destructive/90
              "
            >
              {isDeleting
                ? "Menghapus..."
                : "Ya, Hapus Member"}
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </div>
  )
}