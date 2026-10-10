"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

type BreadcrumbItem = {
  label: string
  href?: string
}

const breadcrumbMap: Record<string, string> = {
  admin: "Dashboard",
  manajemen: "Manajemen",
  anggota: "Anggota",
  kegiatan: "Kegiatan",
  verifikasi: "Verifikasi",
}

export function AdminBreadcrumb() {
  const pathname = usePathname()

  const [memberName, setMemberName] = React.useState<string | null>(null)

  const segments = pathname.split("/").filter(Boolean)

  /*
   * Cek apakah halaman yang sedang dibuka
   * merupakan halaman detail anggota.
   *
   * Contoh:
   * /admin/manajemen/anggota/[id]
   */
  const isMemberDetailPage =
    segments.length === 4 &&
    segments[0] === "admin" &&
    segments[1] === "manajemen" &&
    segments[2] === "anggota"

  const memberId = isMemberDetailPage ? segments[3] : null

  React.useEffect(() => {
    if (!memberId) {
      setMemberName(null)
      return
    }

    let cancelled = false

    async function fetchMemberName() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("member_details")
        .select("full_name")
        .eq("user_id", memberId)
        .single()

      if (cancelled) {
        return
      }

      if (error || !data?.full_name) {
        setMemberName("Detail Anggota")
        return
      }

      setMemberName(data.full_name)
    }

    fetchMemberName()

    return () => {
      cancelled = true
    }
  }, [memberId])

  const items: BreadcrumbItem[] = []

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1

    /*
     * Jika ini adalah UUID / ID halaman detail anggota,
     * jangan tampilkan ID tersebut.
     *
     * Ganti dengan nama anggota.
     */
    if (isMemberDetailPage && index === 3) {
      items.push({
        label: memberName ?? "Detail Anggota",
      })

      return
    }

    const label =
      breadcrumbMap[segment] ??
      segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())

    /*
     * Manajemen hanya merupakan grouping menu,
     * bukan halaman.
     *
     * Jadi Manajemen tidak memiliki href.
     */
    const isNonPageSegment = segment === "manajemen"

    let href: string | undefined

    /*
     * Breadcrumb terakhir adalah halaman aktif,
     * sehingga tidak perlu menjadi link.
     */
    if (!isLast && !isNonPageSegment) {
      href = "/" + segments.slice(0, index + 1).join("/")
    }

    items.push({
      label,
      href,
    })
  })

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={
                index === items.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {item.label}
            </span>
          )}

          {index < items.length - 1 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
