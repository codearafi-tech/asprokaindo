"use client"

import * as React from "react"

import {
  CheckCircle2,
  Clock3,
  Eye,
  Users,
  XCircle,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"

import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  VerificationDetailDialog,
} from "./verification-detail-dialog"

import type {
  VerificationSubmission,
} from "./page"

type VerificationTableProps = {
  submissions: VerificationSubmission[]
}

function getInitials(name: string) {
  if (!name) {
    return "?"
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) =>
      word.charAt(0)
    )
    .join("")
    .toUpperCase()
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(date))
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(
    "id-ID"
  ).format(Number(amount))
}

export default function VerificationTable({
  submissions,
}: VerificationTableProps) {
  const [
    selectedSubmission,
    setSelectedSubmission,
  ] =
    React.useState<VerificationSubmission | null>(
      null
    )

  return (
    <>
      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="flex min-h-75 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>

              <p className="font-medium">
                Belum ada pengajuan verifikasi
              </p>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Pengajuan dari anggota akan
                muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-225">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-11 w-[32%] px-6 font-semibold">
                      Anggota
                    </TableHead>

                    <TableHead className="h-11 w-[17%] font-semibold">
                      Nominal
                    </TableHead>

                    <TableHead className="h-11 w-[18%] font-semibold">
                      Status
                    </TableHead>

                    <TableHead className="h-11 w-[17%] font-semibold">
                      Diajukan
                    </TableHead>

                    <TableHead className="h-11 w-[16%] px-6 text-right font-semibold">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {submissions.map(
                    (submission) => {
                      const name =
                        submission.profile
                          ?.full_name ||
                        submission.details
                          ?.full_name ||
                        "Nama belum tersedia"

                      return (
                        <TableRow
                          key={
                            submission.id
                          }
                          className="group transition-colors hover:bg-muted/30"
                        >
                          {/* Anggota */}
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 shrink-0 border">
                                <AvatarFallback className="text-xs font-medium">
                                  {getInitials(
                                    name
                                  )}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0">
                                <p
                                  className="truncate font-medium"
                                  title={name}
                                >
                                  {name}
                                </p>

                                <p
                                  className="mt-0.5 truncate text-xs text-muted-foreground"
                                  title={
                                    submission
                                      .profile
                                      ?.email ??
                                    "-"
                                  }
                                >
                                  {submission
                                    .profile
                                    ?.email ??
                                    "-"}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Nominal */}
                          <TableCell>
                            <span className="whitespace-nowrap text-sm font-medium">
                              Rp{" "}
                              {formatCurrency(
                                submission.amount
                              )}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            {submission.status ===
                              "submitted" && (
                              <Badge
                                variant="secondary"
                                className="gap-1 font-medium"
                              >
                                <Clock3 className="size-3" />
                                Menunggu
                              </Badge>
                            )}

                            {submission.status ===
                              "approved" && (
                              <Badge className="gap-1 border-blue-200/80 bg-blue-50/80 text-blue-700 font-medium hover:bg-blue-50/80">
                                <CheckCircle2 className="size-3" />
                                Terverifikasi
                              </Badge>
                            )}

                            {submission.status ===
                              "rejected" && (
                              <Badge
                                variant="destructive"
                                className="gap-1 font-medium"
                              >
                                <XCircle className="size-3" />
                                Ditolak
                              </Badge>
                            )}
                          </TableCell>

                          {/* Tanggal */}
                          <TableCell>
                            <span className="whitespace-nowrap text-sm text-muted-foreground">
                              {formatDate(
                                submission.created_at
                              )}
                            </span>
                          </TableCell>

                          {/* Aksi */}
                          <TableCell className="px-6 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() =>
                                setSelectedSubmission(
                                  submission
                                )
                              }
                            >
                              <Eye className="size-4" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    }
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <VerificationDetailDialog
        submission={
          selectedSubmission
        }
        open={
          !!selectedSubmission
        }
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSubmission(
              null
            )
          }
        }}
      />
    </>
  )
}