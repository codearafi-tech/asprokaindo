"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  kegiatan: "Kegiatan",
  sertifikat: "Sertifikat",
  pengaturan: "Pengaturan",
  profil: "Profil",
  pembayaran: "Pembayaran",
  verifikasi: "Verifikasi",
  riwayat: "Riwayat",
}

function formatSegment(segment: string) {
  if (breadcrumbLabels[segment]) {
    return breadcrumbLabels[segment]
  }

  // Ubah slug menjadi judul yang lebih mudah dibaca
  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function MemberBreadcrumbs() {
  const pathname = usePathname()

  const segments = pathname.split("/").filter(Boolean)

  const items = segments.map((segment, index) => ({
    label: formatSegment(segment),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }))

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap overflow-hidden text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <div
              key={item.href}
              className="flex min-w-0 items-center gap-2"
            >
              {index > 0 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}

              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="truncate font-medium text-foreground">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href}
                      className="truncate text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}