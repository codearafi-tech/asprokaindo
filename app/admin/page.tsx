import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Users,
  Wallet,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value)
}

export default async function Dashboard() {
  const supabase = await createClient()

  const [
    { count: totalMembers, error: totalError },
    { count: activeMembers, error: activeError },
    { count: pendingMembers, error: pendingError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "member"),

    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "member")
      .eq("verification_status", "verified"),

    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "member")
      .eq("verification_status", "pending"),
  ])

  const stats = [
    {
      title: "Total Anggota",
      value: totalError ? null : (totalMembers ?? 0),
      description: "Seluruh akun dengan peran anggota",
      icon: Users,
      iconClass: "bg-blue-50 text-blue-700",
      href: "/admin/manajemen/anggota",
    },
    {
      title: "Anggota Terverifikasi",
      value: activeError ? null : (activeMembers ?? 0),
      description: "Anggota dengan status terverifikasi",
      icon: BadgeCheck,
      iconClass: "bg-emerald-50 text-emerald-700",
      href: "/admin/manajemen/anggota",
    },
    {
      title: "Menunggu Verifikasi",
      value: pendingError ? null : (pendingMembers ?? 0),
      description: "Anggota dengan status pending",
      icon: ClipboardCheck,
      iconClass: "bg-amber-50 text-amber-700",
      href: "/admin/verifikasi",
    },
  ]

  const managementItems = [
    {
      title: "Manajemen Anggota",
      description:
        "Kelola data anggota, status keanggotaan, dan informasi profil.",
      icon: Users,
      href: "/admin/manajemen/anggota",
      iconClass: "bg-blue-50 text-blue-700",
    },
    {
      title: "Keuangan",
      description:
        "Buka pengelolaan transaksi dan informasi keuangan asosiasi.",
      icon: Wallet,
      href: "/admin/keuangan",
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Manajemen Kegiatan",
      description:
        "Kelola kegiatan, informasi acara, dan kebutuhan administrasi.",
      icon: CalendarDays,
      href: "/admin/manajemen/kegiatan",
      iconClass: "bg-violet-50 text-violet-700",
    },
    {
      title: "Verifikasi Anggota",
      description: "Tinjau pengajuan keanggotaan yang membutuhkan pemeriksaan.",
      icon: ClipboardCheck,
      href: "/admin/verifikasi",
      iconClass: "bg-amber-50 text-amber-700",
    },
  ]

  return (
    <div className="relative space-y-8 pb-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border bg-background p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-24 size-48 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500" />
              Panel Administrator
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Dashboard Admin
            </h1>

            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Pantau keanggotaan, kelola kegiatan, dan akses administrasi
              ASPROKAI dari satu tempat.
            </p>
          </div>

          <Button asChild className="shrink-0 gap-2">
            <Link href="/admin/manajemen/anggota">
              Kelola Anggota
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Statistik Anggota */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Ringkasan Keanggotaan
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Informasi anggota berdasarkan data profil di database.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon

            return (
              <Card
                key={stat.title}
                className="group transition-shadow hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>

                  <div
                    className={`flex size-10 items-center justify-center rounded-xl ${stat.iconClass}`}
                  >
                    <Icon className="size-5" />
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="text-3xl font-semibold tracking-tight tabular-nums">
                    {stat.value === null ? "—" : formatNumber(stat.value)}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {stat.description}
                  </p>

                  <Link
                    href={stat.href}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary"
                  >
                    Lihat detail
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Modul Administrasi */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Modul Administrasi
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Akses cepat ke fitur utama pengelolaan asosiasi.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {managementItems.map((item) => {
            const Icon = item.icon

            return (
              <Card
                key={item.title}
                className="group transition-all hover:border-primary/30 hover:shadow-md"
              >
                <CardContent className="flex gap-4 p-5">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold tracking-tight">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {item.description}
                    </p>

                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="mt-3 -ml-3 gap-1.5 px-3"
                    >
                      <Link href={item.href}>
                        Buka modul
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Pengelolaan Keuangan & Kegiatan */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CreditCard className="size-5" />
              </div>

              <div>
                <CardTitle className="text-base">
                  Pengelolaan Keuangan
                </CardTitle>
                <CardDescription className="mt-1">
                  Administrasi keuangan asosiasi
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Buka modul keuangan untuk mengelola data transaksi dan
              administrasi pembayaran yang tersedia.
            </p>

            <Button asChild variant="outline" className="mt-4 gap-2">
              <Link href="/admin/keuangan">
                Buka Keuangan
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <CalendarDays className="size-5" />
              </div>

              <div>
                <CardTitle className="text-base">Kegiatan ASPROKAI</CardTitle>
                <CardDescription className="mt-1">
                  Pengelolaan kegiatan dan acara
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Akses pengelolaan kegiatan untuk memperbarui informasi acara dan
              administrasi pelaksanaannya.
            </p>

            <Button asChild variant="outline" className="mt-4 gap-2">
              <Link href="/admin/manajemen/kegiatan">
                Buka Kegiatan
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
