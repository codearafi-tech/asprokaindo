import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"
import { PrintCertificateButton } from "./print-certificate-button"

type PageProps = {
  params: Promise<{ id: string }>
}

function formatActivityDate(value: string | null) {
  if (!value) return "-"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date)
}

export default async function CertificatePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Ambil sertifikat milik pengguna yang sedang login
  const { data: certificate, error } = await supabase
    .from("activity_certificates")
    .select(
      `
      id,
      user_id,
      certificate_number,
      issued_at,
      participant_name,
      activity_title,
      certificate_title,
      organizer,
      activity_start_at
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("Gagal mengambil sertifikat:", error)
    throw new Error("Gagal mengambil data sertifikat.")
  }

  if (!certificate) {
    notFound()
  }

  const participantName = certificate.participant_name || "Nama Peserta"

  const eventTitle =
    certificate.certificate_title || certificate.activity_title || "Kegiatan"

  const organizer = certificate.organizer || "ASPROKAINDO"

  // URL halaman publik untuk verifikasi sertifikat kegiatan
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "")

  const certificateVerificationUrl =
    `${siteUrl}/keanggotaan/verifikasi-sertifikat` +
    `?jenis=kegiatan` +
    `&id=${encodeURIComponent(certificate.id)}` +
    `&nomor=${encodeURIComponent(certificate.certificate_number || "")}`

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-8">
      {/* Header halaman */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sertifikat Kegiatan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sertifikat partisipasi kegiatan ASPROKAINDO.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/sertifikat">Kembali ke Sertifikat</Link>
          </Button>
        </div>
      </div>

      {/* Preview sertifikat */}
      <div className="rounded-2xl border bg-muted/20 p-3 shadow-sm sm:p-6 print:border-0 print:bg-white print:p-0">
        <section
          id="certificate"
          className="certificate-paper relative mx-auto w-full max-w-280 overflow-hidden bg-white text-slate-900 shadow-xl print:shadow-none"
          style={{
            aspectRatio: "1.414 / 1",
            backgroundImage: `
              linear-gradient(rgba(30, 58, 138, 0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(30, 58, 138, 0.035) 1px, transparent 1px)
            `,
            backgroundSize: "36px 36px",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          {/* Bingkai sertifikat */}
          <div className="pointer-events-none absolute inset-[2%] rounded-md border border-indigo-200" />
          <div className="pointer-events-none absolute inset-[3%] rounded-md border border-indigo-100" />

          {/* Watermark logo ASPROKAINDO */}
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

          {/* Header: logo kiri dan nomor sertifikat kanan */}
          <header className="absolute top-[6%] right-[6%] left-[6%] z-10 flex items-center justify-between gap-4">
            <img
              src="/Asproka-textLogo.png"
              alt="Logo ASPROKAINDO"
              className="h-auto w-10 object-contain sm:w-40"
            />

            <div className="max-w-[55%] text-right">
              <p className="text-[6px] font-medium tracking-wider text-slate-400 sm:text-[9px]">
                CERTIFICATE ID
              </p>

              <p className="mt-1 font-mono text-[6px] break-all text-slate-600 sm:text-[10px]">
                {certificate.certificate_number || "-"}
              </p>
            </div>
          </header>

          {/* Konten utama */}
          <div className="absolute top-[25%] right-[7%] left-[7%] z-10 flex flex-col items-center text-center">
            <h1 className="mt-2 text-base font-bold tracking-[0.06em] text-slate-800 sm:text-4xl sm:tracking-[0.08em]">
              SERTIFIKAT
            </h1>

            <p className="mt-1 text-[7px] font-semibold tracking-[0.3em] text-blue-700 sm:mt-2 sm:text-sm">
              PARTISIPASI
            </p>

            <p className="mt-3 text-[7px] tracking-[0.18em] text-slate-500 sm:mt-5 sm:text-xs">
              DIBERIKAN KEPADA
            </p>

            <h2 className="mt-1 max-w-full text-base font-semibold wrap-break-word sm:mt-2 sm:text-3xl">
              {participantName}
            </h2>

            <div className="mt-2 h-0.5 w-12 rounded-full bg-blue-700 sm:mt-4 sm:w-24" />

            <p className="mt-2 text-[6px] leading-relaxed text-slate-500 sm:mt-4 sm:text-sm">
              Atas partisipasinya dalam kegiatan
            </p>

            <h3 className="wrap-break-words mt-1 max-w-full text-[10px] font-bold text-slate-800 sm:mt-2 sm:text-xl">
              {eventTitle}
            </h3>

            <p className="mt-1 max-w-[90%] text-[6px] leading-relaxed text-slate-500 sm:mt-2 sm:text-xs">
              Diselenggarakan oleh{" "}
              <span className="font-semibold text-blue-700">{organizer}</span>
              {certificate.activity_start_at && (
                <>
                  {" "}
                  pada tanggal{" "}
                  {formatActivityDate(certificate.activity_start_at)}
                </>
              )}
              .
            </p>
          </div>

          {/* Informasi bawah: penyelenggara, QR, tanggal terbit */}
          <footer className="absolute right-[7%] bottom-[8%] left-[7%] z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-8">
            {/* Penyelenggara */}
            <div className="min-w-0 text-center">
              <p className="text-[6px] font-semibold tracking-wider text-slate-400 sm:text-[10px]">
                PENYELENGGARA
              </p>

              <p className="mt-1 text-[7px] font-semibold wrap-break-word text-slate-800 sm:text-sm">
                {organizer}
              </p>
            </div>

            {/* QR Code verifikasi */}
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

            {/* Tanggal terbit */}
            <div className="min-w-0 text-center">
              <p className="text-[6px] font-semibold tracking-wider text-slate-400 sm:text-[10px]">
                TANGGAL TERBIT
              </p>

              <p className="mt-1 text-[7px] font-semibold text-slate-800 sm:text-sm">
                {formatActivityDate(certificate.issued_at)}
              </p>
            </div>
          </footer>

          {/* Aksen bawah */}
          <div className="absolute bottom-0 left-0 h-1 w-full bg-blue-700 sm:h-1.5" />
        </section>
      </div>

      {/* Informasi dan aksi cetak */}
      <div className="flex items-center justify-between">
        <div className="border-t pt-5 print:hidden">
          <p className="text-sm font-medium">Simpan sertifikat kegiatan</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Gunakan fitur cetak browser untuk menyimpan sertifikat sebagai PDF.
          </p>
        </div>
        <div>
          <PrintCertificateButton />
        </div>
      </div>

      {/* Pengaturan cetak */}
      <style>{`
        @page {
          size: A4 landscape;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 297mm;
            height: 210mm;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }

          #certificate,
          #certificate * {
            visibility: visible;
          }

          #certificate {
            position: absolute;
            inset: 0;
            width: 297mm;
            height: 210mm;
            max-width: none;
            aspect-ratio: auto;
            margin: 0;
            box-sizing: border-box;
            box-shadow: none;
            page-break-inside: avoid;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  )
}
