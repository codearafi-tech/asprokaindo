"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  Building2,
  Search,
  UserRound,
  Users,
} from "lucide-react"
import { Input } from "@/components/ui/input"

export type DirectoryMember = {
  id: string
  name: string
  memberNumber: string
  profession: string
  institution: string | null
  photoUrl: string | null
  membershipExpiryDate: string | null
  isActive: boolean
}

function formatExpiry(date: string | null) {
  if (!date) return null

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export default function DirectoryMembers({
  members,
}: {
  members: DirectoryMember[]
}) {
  const [search, setSearch] = useState("")

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return members

    return members.filter((member) =>
      [
        member.name,
        member.memberNumber,
        member.profession,
        member.institution ?? "",
      ].some((value) => value.toLowerCase().includes(query))
    )
  }, [members, search])

  return (
    <div>
      {/* Search bar dibuat full width dan informasi jumlah anggota diletakkan di atasnya */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, nomor, atau instansi..."
            aria-label="Cari anggota"
            className="h-12 w-full rounded-xl border-border bg-background pl-10 pr-4 text-sm"
          />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            {filteredMembers.length} anggota ditemukan
          </p>
        </div>
      </div>

      {filteredMembers.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((member) => (
            <article
              key={member.id}
              className="group overflow-hidden rounded-2xl border border-border/70 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-linear-to-br from-slate-100 to-blue-50">
                {member.photoUrl ? (
                  <Image
                    src={member.photoUrl}
                    alt={`Foto ${member.name}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex size-20 items-center justify-center rounded-full border border-white bg-white/80 text-blue-700 shadow-sm">
                      <UserRound className="size-9" />
                    </div>
                  </div>
                )}

                <div className="absolute left-3 top-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-md ${
                      member.isActive
                        ? "bg-white/95 text-emerald-700"
                        : "bg-white/95 text-amber-700"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        member.isActive
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {member.isActive ? "Aktif" : "Tidak aktif"}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 font-semibold leading-6 text-foreground">
                      {member.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                      {member.profession}
                    </p>
                  </div>
                </div>

                {member.institution && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                    <Building2 className="mt-0.5 size-4 shrink-0" />
                    <span className="line-clamp-2">
                      {member.institution}
                    </span>
                  </div>
                )}

                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    Nomor Anggota
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-foreground">
                    {member.memberNumber}
                  </p>

                  {member.membershipExpiryDate && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Berlaku sampai {formatExpiry(member.membershipExpiryDate)}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-5 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-semibold text-foreground">
            Anggota tidak ditemukan
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Coba gunakan nama, nomor anggota, atau nama instansi yang berbeda.
          </p>
        </div>
      )}
    </div>
  )
}