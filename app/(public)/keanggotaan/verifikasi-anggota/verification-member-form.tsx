"use client"

import { useState } from "react"
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hash,
  LoaderCircle,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type MemberResult = {
  member_number: string
  full_name: string
  status: "active" | "expired"
  membership_started_at: string | null
  membership_expires_at: string | null
}

function formatDate(date: string | null) {
  if (!date) return "Tidak tersedia"

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return "Tidak tersedia"

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed)
}

export default function VerificationMemberForm() {
  const [memberNumber, setMemberNumber] = useState("")
  const [result, setResult] = useState<MemberResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")

  async function handleVerify(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    const value = memberNumber.trim()

    if (!value) {
      setResult(null)
      setSearched(false)
      setError("Masukkan nomor anggota terlebih dahulu.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)
    setSearched(false)

    try {
      const supabase = createClient()

      const { data, error: rpcError } = await supabase.rpc("verify_member", {
        p_member_number: value,
      })

      if (rpcError) throw rpcError

      const member = Array.isArray(data) ? data[0] : null

      setResult(member ?? null)
      setSearched(true)
    } catch (err) {
      console.error("Gagal memverifikasi anggota:", err)
      setError(
        "Verifikasi belum dapat dilakukan. Silakan coba kembali beberapa saat lagi."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Search card */}
      <form
        onSubmit={handleVerify}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Search className="size-5" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Nomor Anggota
            </h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Masukkan nomor anggota untuk memulai pencarian.
            </p>
          </div>
        </div>

        <label
          htmlFor="member-number"
          className="mt-6 mb-2 block text-sm font-medium text-slate-700"
        >
          Nomor keanggotaan
        </label>

        <div className="relative">
          <Hash className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />

          <Input
            id="member-number"
            name="member-number"
            autoComplete="off"
            spellCheck={false}
            value={memberNumber}
            onChange={(event) => setMemberNumber(event.target.value)}
            placeholder="ASPROKAINDO-2026-000001"
            aria-invalid={Boolean(error)}
            className="h-12 rounded-xl border-slate-200 pl-10 text-sm placeholder:text-slate-400 focus-visible:ring-blue-500"
          />
        </div>

        <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <p>Pastikan nomor anggota ditulis dengan benar.</p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-5 h-11 w-full rounded-xl bg-blue-600 font-medium text-white hover:bg-blue-700"
        >
          {loading ? (
            <>
              <LoaderCircle className="mr-2 size-4 animate-spin" />
              Memeriksa data...
            </>
          ) : (
            <>
              <Search className="mr-2 size-4" />
              Verifikasi Anggota
            </>
          )}
        </Button>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </form>

      {/* Not found */}
      {searched && !result && (
        <div
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle className="size-5" />
            </div>

            <div>
              <h3 className="font-semibold text-amber-950">
                Nomor anggota tidak ditemukan
              </h3>
              <p className="mt-1 text-sm leading-6 text-amber-900/75">
                Periksa kembali nomor yang dimasukkan. Data mungkin belum
                terdaftar atau belum memenuhi syarat untuk ditampilkan dalam
                verifikasi publik.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Member result */}
      {result && (
        <section
          aria-live="polite"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div
            className={
              result.status === "active"
                ? "border-b border-emerald-100 bg-linear-to-r from-emerald-50 to-white p-5 sm:p-6"
                : "border-b border-amber-100 bg-linear-to-r from-amber-50 to-white p-5 sm:p-6"
            }
          >
            <div className="flex items-start gap-3">
              <div
                className={
                  result.status === "active"
                    ? "flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"
                    : "flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
                }
              >
                {result.status === "active" ? (
                  <CheckCircle2 className="size-6" />
                ) : (
                  <Clock3 className="size-6" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                  Hasil verifikasi
                </p>

                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                  {result.status === "active"
                    ? "Keanggotaan Aktif"
                    : "Keanggotaan Kedaluwarsa"}
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {result.status === "active"
                    ? "Nomor anggota ditemukan dan masa keanggotaannya masih berlaku."
                    : "Nomor anggota ditemukan, tetapi masa keanggotaannya telah berakhir."}
                </p>
              </div>

              <BadgeCheck
                className={
                  result.status === "active"
                    ? "size-5 shrink-0 text-emerald-600"
                    : "size-5 shrink-0 text-amber-600"
                }
              />
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <UserRound className="size-6" />
              </div>

              <div className="min-w-0">
                <p className="text-base font-semibold wrap-break-word text-slate-950">
                  {result.full_name}
                </p>
                <p className="mt-1 font-mono text-xs break-all text-slate-500">
                  {result.member_number}
                </p>
              </div>
            </div>

            <div className="my-5 border-t border-dashed border-slate-200" />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <CalendarDays className="size-4" />
                  <span className="text-xs">Tanggal mulai</span>
                </div>

                <p className="mt-2 text-sm font-medium text-slate-900">
                  {formatDate(result.membership_started_at)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <CalendarDays className="size-4" />
                  <span className="text-xs">Berlaku sampai</span>
                </div>

                <p className="mt-2 text-sm font-medium text-slate-900">
                  {formatDate(result.membership_expires_at)}
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-400">
              Informasi ini menampilkan status berdasarkan data keanggotaan yang
              tersedia pada saat verifikasi.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
