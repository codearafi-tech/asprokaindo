"use client"

import { useEffect, useId, useRef, useState } from "react"
import { toPng } from "html-to-image"
import jsPDF from "jspdf"
import { Award, Download, Loader2, RotateCcw } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"

// ============================================================
// TIPE
// ============================================================

interface MemberCardProps {
  fullName: string
  position?: string | null
  photoUrl?: string | null
  memberNumber: string
  membershipExpiryDate: string | null
  verificationUrl: string
}

// ============================================================
// KONSTANTA
// ============================================================

// Ukuran internal kartu (rasio kartu ID standar CR80)
const CARD_WIDTH = 856
const CARD_HEIGHT = 540

// Resolusi export
const PIXEL_RATIO = 3

// Warna brand: biru, putih, merah
const NAVY = "#0B2B6F"
const NAVY_DARK = "#071A47"
const NAVY_LIGHT = "#1650B0"
const ACCENT = "#D62839"
const WHITE = "#FFFFFF"

// ============================================================
// HELPER
// ============================================================

function formatDate(date: string | null) {
  if (!date) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A"
  )
}

/**
 * Membersihkan gelar dari nama.
 *
 * Contoh:
 * "Dr. A'rafi Laksmana, S.Kom., M.Kom."
 * menjadi:
 * "A'rafi Laksmana"
 */
function cleanMemberName(name: string) {
  let cleanName = name.trim()

  // Gelar depan
  cleanName = cleanName.replace(
    /^(dr\.?|drg\.?|prof\.?|ir\.?|h\.?|hj\.?|ust\.?|ustadz\.?|kyai\.?|kh\.?)\s+/i,
    ""
  )

  // Gelar belakang umum
  cleanName = cleanName.replace(
    /(?:,\s*)?(S\.?Kom\.?|S\.?T\.?|S\.?E\.?|S\.?Pd\.?|S\.?Si\.?|S\.?H\.?|S\.?Sos\.?|S\.?Ak\.?|M\.?Kom\.?|M\.?T\.?|M\.?M\.?|M\.?Pd\.?|M\.?Si\.?|M\.?E\.?|Ph\.?D\.?|MBA|CSP|CISA|CISM|CIPM|CPA)\.?$/i,
    ""
  )

  return cleanName.trim()
}

function getNameFontSize(name: string) {
  const length = name.length

  if (length <= 18) return 20
  if (length <= 26) return 20
  return 28
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Gagal memuat gambar kartu."))
    image.src = src
  })
}

// ============================================================
// LOGO
// ============================================================

// Versi untuk latar gelap (dipakai di header kartu belakang)
function LogoMark({ size = 52 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-white shadow-md"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: size * 0.64,
          height: size * 0.64,
          borderRadius: size * 0.18,
          background: `linear-gradient(135deg, ${NAVY_LIGHT}, ${NAVY_DARK})`,
        }}
      >
        <Award
          className="text-white"
          style={{
            width: size * 0.36,
            height: size * 0.36,
          }}
        />
      </div>
    </div>
  )
}

// Versi untuk latar putih (dipakai di kartu depan)
function LogoMarkBlue({ size = 56 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center shadow-md"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: `linear-gradient(135deg, ${NAVY_LIGHT}, ${NAVY_DARK})`,
      }}
    >
      <Award
        className="text-white"
        style={{ width: size * 0.5, height: size * 0.5 }}
      />
    </div>
  )
}

// ============================================================
// INFO ITEM (label di atas, nilai di bawah) — kartu depan
// ============================================================

function InfoItem({
  label,
  value,
  mono = false,
  size = 20,
  clamp = 1,
}: {
  label: string
  value: string
  mono?: boolean
  size?: number
  clamp?: number
}) {
  return (
    <div className="min-w-0">
      <p
        className="leading-none font-medium"
        style={{
          fontSize: 11,
          letterSpacing: "0.22em",
          color: "#94A3B8",
        }}
      >
        {label}
      </p>

      <p
        className={`mt-2 font-semibold ${mono ? "font-mono" : ""}`}
        style={{
          fontSize: size,
          lineHeight: 1.2,
          color: "#1E293B",
          letterSpacing: mono ? "0.02em" : "0",
          display: "-webkit-box",
          WebkitLineClamp: clamp,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </p>
    </div>
  )
}

// ============================================================
// FRONT CARD
// ============================================================

function FrontCard({
  fullName,
  position,
  photoUrl,
  memberNumber,
  membershipExpiryDate,
  verificationUrl,
  rounded = true,
}: MemberCardProps & {
  rounded?: boolean
}) {
  const displayName = cleanMemberName(fullName)

  // ID unik agar gradient SVG tidak bentrok antara preview & export
  const uid = useId().replace(/:/g, "")

  // Garis batas antara panel biru dan area putih
  const boundary = "M352 0 C330 120 270 230 320 350 C360 440 440 510 540 540"

  const words = displayName.split(/\s+/)
  const firstWord = words[0] ?? ""
  const restWords = words.slice(1).join(" ")

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: rounded ? 28 : 0,
        background: "#FFFFFF",
      }}
    >
      {/* ======================================================
          PANEL BIRU MELENGKUNG
      ====================================================== */}

      <svg
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <defs>
          <linearGradient id={`${uid}-blue`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2A62C4" />
            <stop offset="35%" stopColor={NAVY_LIGHT} />
            <stop offset="70%" stopColor={NAVY} />
            <stop offset="100%" stopColor={NAVY_DARK} />
          </linearGradient>
        </defs>

        {/* Panel utama */}
        <path d={`${boundary} H0 V0 Z`} fill={`url(#${uid}-blue)`} />

        {/* Lengkung terang */}
        <path
          d="M0 0 H236 C196 130 176 290 246 410 C282 470 330 515 372 540 H0 Z"
          fill="rgba(90,150,255,0.22)"
        />

        {/* Lengkung gelap */}
        <path
          d="M0 150 C96 220 126 340 84 540 H0 Z"
          fill="rgba(7,26,71,0.45)"
        />

        {/* Garis merah mengikuti lengkung */}
        <path
          d={boundary}
          transform="translate(10 0)"
          fill="none"
          stroke={ACCENT}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>

      {/* ======================================================
          FOTO (menumpuk di batas biru dan putih)
      ====================================================== */}

      <div
        className="absolute bg-white"
        style={{
          left: 52,
          top: 118,
          width: 236,
          height: 306,
          padding: 6,
          borderRadius: 8,
        }}
      >
        <div
          className="h-full w-full overflow-hidden"
          style={{ background: "#E8EDF5" }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={displayName}
              crossOrigin="anonymous"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background: `linear-gradient(160deg, ${NAVY_LIGHT}, ${NAVY_DARK})`,
              }}
            >
              <span
                className="font-bold text-white/60"
                style={{ fontSize: 64 }}
              >
                {getInitials(displayName)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          TEKS DI PANEL BIRU (kiri bawah)
      ====================================================== */}

      <div className="absolute text-white" style={{ left: 52, bottom: 44 }}>
        <p
          className="leading-none font-light"
          style={{ fontSize: 26, letterSpacing: "0.02em" }}
        >
          Kartu Anggota
        </p>

        <p
          className="mt-2 leading-none font-medium text-white/70"
          style={{ fontSize: 10, letterSpacing: "0.32em" }}
        >
          ASPROKAINDO
        </p>
      </div>

      {/* ======================================================
          AREA PUTIH (kanan)
      ====================================================== */}

      <div
        className="absolute flex flex-col"
        style={{
          left: 380,
          right: 44,
          top: 0,
          bottom: 0,
          paddingTop: 52,
          paddingBottom: 56,
        }}
      >
        {/* Logo + nama organisasi */}
        <div className="flex items-center gap-4">
          <div>
            <img src="/Asproka-logo.png" alt="asosiaso logo" className="w-12" />
          </div>

          <div className="min-w-0">
            <p
              className="font-bold uppercase"
              style={{
                fontSize: 15,
                lineHeight: 1.35,
                letterSpacing: "0.015em",
                color: NAVY_DARK,
              }}
            >
              ASOSIASI PROFESI PENGEMBANG <br /> KECERDASAN ARTIFISIAL INDONESIA
            </p>
          </div>
        </div>
        {/* Informasi anggota */}
        <div className="mt-12">
          <InfoItem
            label="NAMA ANGGOTA"
            value={displayName.toUpperCase()}
            size={getNameFontSize(displayName)}
            clamp={2}
          />
        </div>
        <div className="mt-5">
          <InfoItem label="NOMOR ANGGOTA" value={memberNumber} mono size={20} />
        </div>
        <div className="mt-5">
          <InfoItem
            label="BERLAKU SAMPAI"
            value={formatDate(membershipExpiryDate)}
            size={20}
            mono
          />
        </div>
      </div>

      {/* ======================================================
          QR VERIFIKASI (kanan bawah)
      ====================================================== */}

      <div
        className="absolute flex items-end gap-4"
        style={{ right: 44, bottom: 36 }}
      >
        <div
          className="bg-white"
          style={{
            width: 96,
            height: 96,
            padding: 7,
            borderRadius: 10,
            border: "1px solid #E2E8F0",
          }}
        >
          <QRCodeSVG
            value={verificationUrl}
            size={80}
            bgColor="#FFFFFF"
            fgColor={NAVY}
            level="M"
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// BACK CARD
// ============================================================

const VERIFICATION_STEPS = [
  "Scan QR Code menggunakan kamera ponsel.",
  "Buka halaman verifikasi yang tampil.",
  "Pastikan nama dan nomor anggota sesuai dengan kartu.",
]

function BackCard({
  fullName,
  memberNumber,
  verificationUrl,
  rounded = true,
}: Pick<MemberCardProps, "fullName" | "memberNumber" | "verificationUrl"> & {
  rounded?: boolean
}) {
  const displayName = cleanMemberName(fullName)

  return (
    <div
      className="relative overflow-hidden bg-white text-slate-900"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: rounded ? 28 : 0,
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="flex items-center justify-between px-11 text-white"
        style={{
          height: 100,
          background: `linear-gradient(
            135deg,
            ${NAVY_DARK} 0%,
            ${NAVY} 60%,
            ${NAVY_LIGHT} 100%
          )`,
        }}
      >
        <div className="flex items-center gap-3.5">
          <div className="rounded-lg bg-white p-2">
            <img src="/Asproka-logo.png" alt="" className="w-8" />
          </div>

          <div>
            <p
              className="font-bold uppercase"
              style={{
                fontSize: 15,
                lineHeight: 1.35,
                letterSpacing: "0.015em",
                color: WHITE,
              }}
            >
              ASOSIASI PROFESI PENGEMBANG <br /> KECERDASAN ARTIFISIAL INDONESIA
            </p>
          </div>
        </div>

        <p
          className="leading-none font-semibold"
          style={{
            fontSize: 13,
            letterSpacing: "0.22em",
            color: "#FFFFFF",
          }}
        >
          VERIFIKASI KEANGGOTAAN
        </p>
      </div>

      {/* Garis merah */}
      <div className="h-1 w-full" style={{ background: ACCENT }} />

      {/* ======================================================
          ISI
      ====================================================== */}

      <div className="flex items-center gap-10 px-11" style={{ height: 304 }}>
        {/* QR */}
        <div
          className="shrink-0 rounded-2xl border bg-slate-50 p-4 shadow-sm"
          style={{ borderColor: "#E2E8F0" }}
        >
          <QRCodeSVG
            value={verificationUrl}
            size={208}
            bgColor="#F8FAFC"
            fgColor={NAVY}
            level="H"
          />
        </div>

        {/* Informasi verifikasi */}
        <div className="min-w-0 flex-1">
          <h3
            className="mt-3 leading-tight font-bold"
            style={{ fontSize: 26, color: NAVY }}
          >
            Verifikasi Resmi Anggota
          </h3>

          <ol className="mt-4 space-y-2.5">
            {VERIFICATION_STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: NAVY }}
                >
                  {index + 1}
                </span>

                <span className="text-[14px] leading-6 text-slate-600">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          {/* Ringkasan anggota */}
          <div
            className="mt-5 rounded-xl border bg-slate-50 px-4 py-3"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p
                  className="leading-none font-medium text-slate-400"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.2em",
                  }}
                >
                  PEMEGANG KARTU
                </p>

                <p className="mt-1.5 truncate text-[14px] font-semibold">
                  {displayName}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className="leading-none font-medium text-slate-400"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.2em",
                  }}
                >
                  NOMOR ANGGOTA
                </p>

                <p className="mt-1.5 font-mono text-[14px] font-bold">
                  {memberNumber}
                </p>
              </div>
            </div>
          </div>

          {/* URL */}
          <p className="mt-3 truncate text-[11px] text-slate-400">
            {verificationUrl}
          </p>
        </div>
      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div
        className="absolute bottom-0 left-0 flex h-18 w-full items-center border-t bg-slate-50 px-11"
        style={{ borderColor: "#E2E8F0" }}
      >
        <p className="text-[11.5px] leading-[1.6] text-slate-500">
          Kartu ini merupakan identitas keanggotaan resmi ASPROKAINDO, bersifat
          pribadi, dan tidak dapat dipindahtangankan. Keaslian kartu dapat
          dipastikan melalui QR Code di atas.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// MEMBER CARD (komponen utama)
// ============================================================

export function MemberCard({
  fullName,
  position,
  photoUrl,
  memberNumber,
  membershipExpiryDate,
  verificationUrl,
}: MemberCardProps) {
  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [isFlipped, setIsFlipped] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [exportError, setExportError] = useState("")

  // Preview responsif
  const previewRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState<number | null>(null)

  // Area export (tidak terlihat)
  const frontExportRef = useRef<HTMLDivElement>(null)
  const backExportRef = useRef<HTMLDivElement>(null)

  // ----------------------------------------------------------
  // SKALA PREVIEW MENGIKUTI LEBAR LAYAR
  // ----------------------------------------------------------

  useEffect(() => {
    const element = previewRef.current

    if (!element) return

    const update = () => {
      setScale(element.clientWidth / CARD_WIDTH)
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  // ----------------------------------------------------------
  // CAPTURE DEPAN + BELAKANG
  // ----------------------------------------------------------

  async function captureSides() {
    if (!frontExportRef.current || !backExportRef.current) {
      throw new Error("Kartu belum siap untuk diunduh.")
    }

    // Tunggu font selesai dimuat
    await document.fonts.ready

    // Tunggu semua gambar (foto) selesai dimuat
    const images = [
      ...frontExportRef.current.querySelectorAll("img"),
      ...backExportRef.current.querySelectorAll("img"),
    ]

    await Promise.all(
      images.map((image) => {
        if (image.complete) return Promise.resolve()

        return new Promise<void>((resolve) => {
          image.onload = () => resolve()
          image.onerror = () => resolve()
        })
      })
    )

    const options = {
      cacheBust: true,
      pixelRatio: PIXEL_RATIO,
      backgroundColor: "#FFFFFF",
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      style: {
        margin: "0",
        transform: "none",
      },
    }

    const [front, back] = await Promise.all([
      toPng(frontExportRef.current, options),
      toPng(backExportRef.current, options),
    ])

    return { front, back }
  }

  // ----------------------------------------------------------
  // DOWNLOAD PNG
  // ----------------------------------------------------------

  async function downloadPng() {
    try {
      setIsDownloading(true)
      setExportError("")

      const { front, back } = await captureSides()

      const [frontImage, backImage] = await Promise.all([
        loadImage(front),
        loadImage(back),
      ])

      const width = CARD_WIDTH * PIXEL_RATIO
      const height = CARD_HEIGHT * PIXEL_RATIO
      const gap = 40 * PIXEL_RATIO

      const canvas = document.createElement("canvas")

      canvas.width = width
      canvas.height = height * 2 + gap

      const context = canvas.getContext("2d")

      if (!context) {
        throw new Error("Canvas tidak tersedia.")
      }

      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, canvas.width, canvas.height)

      // Depan
      context.drawImage(frontImage, 0, 0, width, height)

      // Belakang
      context.drawImage(backImage, 0, height + gap, width, height)

      const link = document.createElement("a")

      link.download = `Kartu-Anggota-${memberNumber}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Gagal membuat PNG kartu:", error)

      setExportError("Gagal membuat file PNG. Silakan coba lagi.")
    } finally {
      setIsDownloading(false)
    }
  }

  // ----------------------------------------------------------
  // DOWNLOAD PDF
  // ----------------------------------------------------------

  async function downloadPdf() {
    try {
      setIsDownloading(true)
      setExportError("")

      const { front, back } = await captureSides()

      // Ukuran kartu ID standar: 85,60 × 53,98 mm
      const CARD_MM_WIDTH = 85.6
      const CARD_MM_HEIGHT = 53.98

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [CARD_MM_WIDTH, CARD_MM_HEIGHT],
        compress: true,
      })

      // Halaman 1 — depan
      pdf.addImage(
        front,
        "PNG",
        0,
        0,
        CARD_MM_WIDTH,
        CARD_MM_HEIGHT,
        undefined,
        "FAST"
      )

      // Halaman 2 — belakang
      pdf.addPage([CARD_MM_WIDTH, CARD_MM_HEIGHT], "landscape")

      pdf.addImage(
        back,
        "PNG",
        0,
        0,
        CARD_MM_WIDTH,
        CARD_MM_HEIGHT,
        undefined,
        "FAST"
      )

      pdf.save(`Kartu-Anggota-${memberNumber}.pdf`)
    } catch (error) {
      console.error("Gagal membuat PDF kartu:", error)

      setExportError("Gagal membuat file PDF. Silakan coba lagi.")
    } finally {
      setIsDownloading(false)
    }
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  const cardShadow = "0 24px 48px -12px rgba(7, 26, 71, 0.45)"

  return (
    <div className="space-y-6">
      {/* ======================================================
          PREVIEW KARTU (klik untuk membalik)
      ====================================================== */}

      <div
        ref={previewRef}
        className="relative mx-auto aspect-856/540 w-full max-w-190 cursor-pointer"
        style={{ opacity: scale === null ? 0 : 1 }}
        onClick={() => setIsFlipped((value) => !value)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setIsFlipped((value) => !value)
          }
        }}
        aria-label="Balik kartu anggota"
      >
        <div
          className="absolute top-0 left-0"
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            transform: `scale(${scale ?? 1})`,
            transformOrigin: "top left",
            perspective: "2000px",
          }}
        >
          <div
            className="relative h-full w-full"
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 700ms cubic-bezier(.2,.7,.2,1)",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Depan */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                borderRadius: 28,
                boxShadow: cardShadow,
              }}
            >
              <FrontCard
                fullName={fullName}
                position={position}
                photoUrl={photoUrl}
                memberNumber={memberNumber}
                membershipExpiryDate={membershipExpiryDate}
                verificationUrl={verificationUrl}
              />
            </div>

            {/* Belakang */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                borderRadius: 28,
                boxShadow: cardShadow,
              }}
            >
              <BackCard
                fullName={fullName}
                memberNumber={memberNumber}
                verificationUrl={verificationUrl}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Petunjuk */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <RotateCcw className="h-3.5 w-3.5" />

        <span>Klik kartu untuk melihat sisi belakang</span>
      </div>

      {/* ======================================================
          PANEL DOWNLOAD
      ====================================================== */}

      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-background p-4 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-sm font-medium">Simpan Kartu Anggota</p>

          <p className="mt-1 text-xs text-muted-foreground">
            PNG berisi kedua sisi kartu. PDF terdiri dari 2 halaman berukuran
            kartu ID standar (85,6 × 54 mm).
          </p>

          {exportError && (
            <p className="mt-2 text-xs text-destructive">{exportError}</p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={downloadPng}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PNG
          </Button>

          <Button type="button" onClick={downloadPdf} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {/* ======================================================
          AREA EXPORT (tidak terlihat)

          Dipakai khusus untuk menghasilkan file.
          Sengaja tanpa transform scale agar hasil tetap 856 × 540.
          Margin ditaruh di pembungkus luar, BUKAN di elemen yang
          difoto, supaya tidak ikut terbawa ke gambar.
      ====================================================== */}

      <div
        className="pointer-events-none fixed top-0"
        style={{ left: -10000 }}
        aria-hidden="true"
      >
        {/* Export depan */}
        <div
          ref={frontExportRef}
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          }}
        >
          <FrontCard
            fullName={fullName}
            position={position}
            photoUrl={photoUrl}
            memberNumber={memberNumber}
            membershipExpiryDate={membershipExpiryDate}
            verificationUrl={verificationUrl}
            rounded={false}
          />
        </div>

        {/* Export belakang */}
        <div style={{ marginTop: 40 }}>
          <div
            ref={backExportRef}
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
            }}
          >
            <BackCard
              fullName={fullName}
              memberNumber={memberNumber}
              verificationUrl={verificationUrl}
              rounded={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
