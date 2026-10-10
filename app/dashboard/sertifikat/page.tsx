import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Award,
  CalendarDays,
  ChevronRight,
  FileBadge,
  ShieldCheck,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))
}

export default async function CertificatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: certificates, error } = await supabase
    .from("activity_certificates")
    .select(
      `
      id,
      certificate_number,
      issued_at,
      activity_title,
      certificate_title,
      organizer
    `
    )
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false })

  if (error) {
    console.error("Gagal mengambil sertifikat:", error)
    throw new Error("Gagal memuat daftar sertifikat.")
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7">
      {/* Page heading */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sertifikat Kegiatan
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Seluruh sertifikat kegiatan yang telah diterbitkan untuk Anda
            tersimpan di sini.
          </p>
        </div>
      </header>

      {/* Summary */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <p className="text-sm font-medium">Sertifikat Anda</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Dokumen resmi yang sudah diterbitkan
          </p>
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl border bg-background">
          <span className="text-sm font-semibold tabular-nums">
            {certificates?.length ?? 0}
          </span>
        </div>
      </div>

      {/* Certificate list */}
      {certificates && certificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {certificates.map((certificate) => (
            <Card
              key={certificate.id}
              className="group relative overflow-hidden rounded-2xl border bg-card pt-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              {/* Navy-gold accent */}
              {/* Electric blue accent */}
              <div className="relative h-1.5 overflow-hidden bg-linear-to-r from-blue-600 via-cyan-400 to-indigo-500">
                <div className="absolute inset-0 bg-linear-to-r from-blue-400 via-cyan-300 to-violet-400 opacity-80 blur-[3px]" />
                <div className="absolute inset-0 bg-linear-to-r from-blue-500 via-cyan-300 to-indigo-400" />
              </div>

              <CardContent className="space-y-5">
                {/* Card header */}
                {/* Card header */}
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/70 text-blue-600">
                    <Award className="size-4.5" strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span>Telah diterbitkan</span>
                    </div>

                    <h2 className="line-clamp-2 text-base leading-snug font-semibold tracking-tight text-foreground">
                      {certificate.certificate_title ||
                        certificate.activity_title ||
                        "Sertifikat Kegiatan"}
                    </h2>

                    <p className="truncate text-xs text-muted-foreground">
                      {certificate.organizer || "ASPROKA INDONESIA"}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="rounded-xl border bg-muted/30 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[11px] text-muted-foreground">
                        Tanggal diterbitkan
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(certificate.issued_at)}
                      </p>
                    </div>
                  </div>

                  <div className="my-3 border-t border-dashed" />

                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] text-muted-foreground">
                      Nomor sertifikat
                    </p>
                    <p
                      title={certificate.certificate_number}
                      className="font-mono text-xs leading-relaxed break-all text-foreground/80"
                    >
                      {certificate.certificate_number}
                    </p>
                  </div>
                </div>

                {/* Action */}
                <Button asChild className="h-10 w-full rounded-lg">
                  <Link href={`/dashboard/sertifikat/${certificate.id}`}>
                    <span>Lihat Sertifikat</span>
                    <ChevronRight className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border-dashed shadow-none">
          <CardContent className="flex flex-col items-center px-5 py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
              <Award
                className="size-8 text-muted-foreground"
                strokeWidth={1.5}
              />
            </div>

            <h2 className="font-semibold tracking-tight">
              Belum ada sertifikat
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Sertifikat akan muncul di sini setelah admin menerbitkan
              sertifikat untuk kegiatan yang Anda ikuti.
            </p>

            <Button asChild variant="outline" className="mt-5 rounded-lg">
              <Link href="/dashboard/kegiatan">
                Jelajahi Kegiatan
                <ChevronRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
