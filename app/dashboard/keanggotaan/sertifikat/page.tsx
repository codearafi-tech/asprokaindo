import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { QRCodeSVG } from "qrcode.react"
import { DownloadPngButton } from "@/components/ui/download-png-button"
import { DownloadPdfButton } from "@/components/ui/download-pdf-button"

export default async function SertifikatKeanggotaanPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Ambil data profil anggota
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      email,
      role,
      verification_status,
      member_number,
      certificate_number,
      membership_start_date,
      membership_expiry_date
    `
    )
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    redirect("/dashboard")
  }

  // Sertifikat hanya untuk anggota yang sudah diverifikasi
  if (profile.role !== "member" || profile.verification_status !== "verified") {
    redirect("/verification")
  }

  // Ambil nama anggota
  const { data: memberDetails } = await supabase
    .from("member_details")
    .select("full_name, title_prefix, title_suffix")
    .eq("user_id", user.id)
    .maybeSingle()

  const baseName =
    memberDetails?.full_name || profile.full_name || "Nama Anggota"

  const fullName =
    memberDetails?.full_name || profile.full_name || "Nama Anggota"

  // URL halaman publik untuk verifikasi sertifikat anggota
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "")

  const certificateVerificationUrl =
    `${siteUrl}/keanggotaan/verifikasi-sertifikat` +
    `?jenis=anggota&nomor=${encodeURIComponent(
      profile.certificate_number || ""
    )}`

  // Format tanggal Indonesia
  const formatDate = (date: string | null) => {
    if (!date) return "-"

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`))
  }

  return (
    <div className="min-h-full space-y-8">
      {/* Header halaman */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sertifikat Keanggotaan
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          Sertifikat resmi yang menunjukkan status keanggotaan Anda di
          ASPROKAINDO.
        </p>
      </div>

      {/* Preview sertifikat */}
      <div className="rounded-2xl border bg-muted/20 p-3 shadow-sm sm:p-6">
        <div className="flex justify-center">
          <Card
            id="membership-certificate"
            className="relative w-full max-w-280 overflow-hidden rounded-none border-0 bg-white p-0 shadow-2xl"
          >
            {/* Canvas sertifikat landscape */}
            <div
              className="relative w-full overflow-hidden bg-white text-slate-900"
              style={{
                aspectRatio: "1.414 / 1",
                backgroundImage: `
                  linear-gradient(rgba(30, 58, 138, 0.035) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(30, 58, 138, 0.035) 1px, transparent 1px)
                `,
                backgroundSize: "36px 36px",
              }}
            >
              {/* Bingkai */}
              <div className="pointer-events-none absolute inset-[2%] rounded-md border border-indigo-200" />
              <div className="pointer-events-none absolute inset-[3%] rounded-md border border-indigo-100" />

              {/* Watermark logo */}
              <div
                className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <img
                  src="/Asproka-logo.png"
                  alt=""
                  className="h-[48%] w-[48%] object-contain"
                  style={{
                    opacity: 0.055,
                    filter: "grayscale(100%)",
                  }}
                />
              </div>

              {/* Header: logo kiri, nomor sertifikat kanan */}
              <div className="absolute top-[6%] right-[6%] left-[6%] z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <img
                    src="/Asproka-textLogo.png"
                    alt="Logo ASPROKAINDO"
                    className="h-auto w-10 object-contain sm:w-40"
                  />
                </div>

                <div className="max-w-[55%] text-right">
                  <p className="text-[6px] font-medium tracking-wider text-slate-400 sm:text-[9px]">
                    CERTIFICATE ID
                  </p>
                  <p className="mt-1 font-mono text-[6px] break-all text-slate-600 sm:text-[10px]">
                    {profile.certificate_number || "-"}
                  </p>
                </div>
              </div>

              {/* Identitas sertifikat */}
              <div className="absolute top-[30%] right-[7%] left-[7%] z-10 flex flex-col items-center text-center">
                <h2 className="mt-2 text-base font-bold tracking-[0.06em] text-slate-800 sm:text-4xl sm:tracking-[0.08em]">
                  SERTIFIKAT KEANGGOTAAN
                </h2>

                <p className="mt-3 text-[7px] tracking-[0.18em] text-slate-500 sm:mt-5 sm:text-xs">
                  DIBERIKAN KEPADA
                </p>

                <h3 className="mt-1 max-w-full text-base font-semibold wrap-break-word text-indigo-950 sm:mt-2 sm:text-3xl">
                  {fullName}
                </h3>

                <div className="mt-2 h-0.5 w-12 rounded-full bg-indigo-500 sm:mt-4 sm:w-24" />

                <p className="mt-2 max-w-2xl text-[6px] leading-relaxed text-slate-500 sm:mt-4 sm:text-sm">
                  Telah terdaftar sebagai anggota resmi{" "}
                  <span className="text-blue-700">
                    Asosiasi Profesi Pengembang Kecerdasan Artifisial Indonesia
                  </span>{" "}
                  dan memiliki hak keanggotaan sesuai ketentuan organisasi.
                </p>
              </div>

              {/* Informasi bawah: nomor anggota - QR - masa keanggotaan */}
              <div className="absolute right-[7%] bottom-[8%] left-[7%] z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-8">
                {/* Nomor anggota */}
                <div className="min-w-0 text-center">
                  <p className="text-[6px] font-semibold tracking-wider text-slate-400 sm:text-[10px]">
                    NOMOR ANGGOTA
                  </p>
                  <p className="mt-1 font-mono text-[7px] font-semibold wrap-break-word text-slate-800 sm:text-sm">
                    {profile.member_number || "-"}
                  </p>
                </div>

                {/* QR verifikasi */}
                <div className="flex flex-col items-center">
                  <div className="rounded-md border border-indigo-100 bg-white p-1 sm:rounded-lg sm:p-2">
                    <QRCodeSVG
                      value={certificateVerificationUrl}
                      size={76}
                      bgColor="#FFFFFF"
                      fgColor="#0B2B6F"
                      level="H"
                      marginSize={1}
                      className="h-[clamp(44px,9vw,76px)] w-[clamp(44px,9vw,76px)]"
                    />
                  </div>
                  <p className="mt-1 text-[5px] font-medium tracking-wider text-slate-400 sm:text-[8px]">
                    SCAN TO VERIFY
                  </p>
                </div>

                {/* Masa keanggotaan */}
                <div className="min-w-0 text-center">
                  <p className="text-[6px] font-semibold tracking-wider text-slate-400 sm:text-[10px]">
                    MASA KEANGGOTAAN
                  </p>
                  <p className="mt-1 text-[6px] font-semibold text-slate-800 sm:text-xs">
                    {formatDate(profile.membership_start_date)}
                  </p>
                  <p className="text-[6px] text-slate-500 sm:text-[10px]">
                    s.d. {formatDate(profile.membership_expiry_date)}
                  </p>
                </div>
              </div>

              {/* Aksen bawah */}
              <div className="absolute bottom-0 left-0 h-1 w-full bg-indigo-600 sm:h-1.5" />
            </div>
          </Card>
        </div>
      </div>

      {/* Unduh sertifikat */}
      <div className="flex flex-col items-center gap-3 border-t pt-6 sm:flex-row sm:justify-between">
        <div>
          <p className="text-sm font-medium">Simpan sertifikat Anda</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Unduh sertifikat dalam format PNG atau PDF.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <DownloadPngButton
            targetId="membership-certificate"
            fileName={`Sertifikat-Keanggotaan-${profile.member_number}`}
          />

          <DownloadPdfButton
            targetId="membership-certificate"
            fileName={`Sertifikat-Keanggotaan-${profile.member_number}`}
            orientation="landscape"
            format="a4"
          />
        </div>
      </div>
    </div>
  )
}
