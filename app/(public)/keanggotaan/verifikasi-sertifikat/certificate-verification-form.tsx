
"use client"

import { useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CertificateVerificationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [certificateType, setCertificateType] = useState<
    "anggota" | "kegiatan"
  >(
    searchParams.get("jenis") === "kegiatan" ? "kegiatan" : "anggota",
  )

  const [certificateNumber, setCertificateNumber] = useState(
    searchParams.get("nomor") || "",
  )

  const [certificateId, setCertificateId] = useState(
    searchParams.get("id") || "",
  )

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const params = new URLSearchParams({
      jenis: certificateType,
    })

    if (certificateType === "anggota") {
      const nomor = certificateNumber.trim()

      if (!nomor) {
        setError("Masukkan nomor sertifikat anggota.")
        return
      }

      if (nomor.length > 200) {
        setError("Nomor sertifikat terlalu panjang.")
        return
      }

      params.set("nomor", nomor)
    } else {
      const id = certificateId.trim()

      if (!id) {
        setError("Masukkan ID sertifikat kegiatan.")
        return
      }

      if (id.length > 100) {
        setError("ID sertifikat terlalu panjang.")
        return
      }

      params.set("id", id)
    }

    const targetUrl =
      `/keanggotaan/verifikasi-sertifikat?${params.toString()}`

    const currentUrl =
      `${window.location.pathname}${window.location.search}`

    // Muat ulang jika pengguna mengirim parameter yang sama.
    if (targetUrl === currentUrl) {
      window.location.reload()
      return
    }

    setLoading(true)
    router.push(targetUrl)
  }

  function changeCertificateType(type: "anggota" | "kegiatan") {
    setCertificateType(type)
    setError("")
    setLoading(false)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 pb-6 pt-8 text-center sm:px-8">

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Verifikasi Sertifikat
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Periksa keaslian sertifikat keanggotaan dan sertifikat kegiatan
          yang diterbitkan melalui sistem ASPROKAINDO.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-8">
        <div className="space-y-2">
          <Label>Jenis Sertifikat</Label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => changeCertificateType("anggota")}
              aria-pressed={certificateType === "anggota"}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                certificateType === "anggota"
                  ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/10"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <BadgeCheck className="h-5 w-5" />
              Sertifikat Anggota
            </button>

            <button
              type="button"
              onClick={() => changeCertificateType("kegiatan")}
              aria-pressed={certificateType === "kegiatan"}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                certificateType === "kegiatan"
                  ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/10"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <FileCheck2 className="h-5 w-5" />
              Sertifikat Kegiatan
            </button>
          </div>
        </div>

        {certificateType === "anggota" ? (
          <div className="space-y-2">
            <Label htmlFor="certificate-number">
              Nomor Sertifikat
            </Label>

            <Input
              id="certificate-number"
              value={certificateNumber}
              onChange={(event) =>
                setCertificateNumber(event.target.value)
              }
              placeholder="Masukkan nomor sertifikat anggota"
              autoComplete="off"
              maxLength={200}
              required
              className="h-11"
            />

            <p className="text-xs leading-5 text-slate-500">
              Masukkan nomor sertifikat yang tercantum pada sertifikat
              keanggotaan.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="certificate-id">
              ID Sertifikat
            </Label>

            <Input
              id="certificate-id"
              value={certificateId}
              onChange={(event) =>
                setCertificateId(event.target.value)
              }
              placeholder="Masukkan ID sertifikat kegiatan"
              autoComplete="off"
              maxLength={100}
              required
              className="h-11"
            />

            <p className="text-xs leading-5 text-slate-500">
              Masukkan ID sertifikat kegiatan. Jika membuka halaman melalui
              QR code, ID akan terisi otomatis.
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full gap-2 bg-blue-700 font-semibold hover:bg-blue-800"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Membuka verifikasi...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Verifikasi Sertifikat
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 text-center sm:px-8">
        <p className="text-xs leading-5 text-slate-500">
          <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-blue-600" />
          Verifikasi dilakukan berdasarkan data yang tersimpan di sistem
          ASPROKAINDO.
        </p>
      </div>
    </div>
  )
}
