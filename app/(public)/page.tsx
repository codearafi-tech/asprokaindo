import Link from "next/link"
import {
  Award,
  BadgeCheck,
  Check,
  BriefcaseBusiness,
  GraduationCap,
  Network,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import MeshGradient from "@/components/ui/mesh-gradient"
import { createClient } from "@/lib/supabase/server"

export default async function Page() {
  const supabase = await createClient()

  const { data: stats, error } = await supabase.rpc("get_public_member_stats")

  if (error) {
    console.error("Failed to load member stats:", error)
  }

  const activeMembers = stats?.[0]?.active_members ?? 0
  const provinces = stats?.[0]?.provinces ?? 0

  return (
    <main className="relative min-h-svh overflow-hidden">
      {/* =====================================================
          MESH GRADIENT
      ====================================================== */}

      <MeshGradient
        className="absolute inset-0"
        colors={["#0a1a4a", "#1f4fd8", "#4c9bff", "#0a1a4a"]}
        speed={0.35}
        distortion={0.8}
        swirl={0.35}
        scale={1.45}
        rotation={120}
      />

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative z-10 min-h-svh">
        <div className="relative flex min-h-svh flex-col max-w-7xl mx-auto px-6 sm:px-8 lg:px-20">
          {/* =================================================
              HERO CONTENT
          ================================================== */}

          <div className="flex flex-1 items-center pb-44 sm:pb-48 md:pb-0">
            <div className="flex max-w-4xl flex-col gap-5 md:gap-6">
              <h1 className="max-w-4xl text-4xl leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
                Asosiasi Profesi Pengembang Kecerdasan Artifisial
              </h1>

              <p className="max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
                Bergabunglah dengan jaringan profesional, dapatkan akses ke
                standar industri, kolaborasi eksklusif, dan tingkatkan karier
                Anda di dunia AI.
              </p>

              <Button
                asChild
                size="lg"
                variant="secondary"
                className="w-fit bg-white"
              >
                <Link href="/login">Bergabung Sekarang</Link>
              </Button>
            </div>
          </div>

          {/* =================================================
              STATISTICS
          ================================================== */}

          <div className="absolute right-6 bottom-6 sm:right-8 sm:bottom-8 lg:right-20 lg:bottom-10">
            <div className="grid grid-cols-2 divide-x divide-white/20 border border-white/20 bg-white/5 backdrop-blur-sm">
              {/* Active Members */}
              <div className="min-w-0 px-5 py-4 sm:px-6 sm:py-5 md:min-w-44 md:px-8 md:py-6">
                <div className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
                  +{activeMembers}
                </div>

                <div className="mt-1 text-xs text-white/60 sm:text-sm">
                  Anggota Aktif
                </div>
              </div>

              {/* Provinces */}
              <div className="min-w-0 px-5 py-4 sm:px-6 sm:py-5 md:min-w-44 md:px-8 md:py-6">
                <div className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
                  {provinces}
                </div>

                <div className="mt-1 text-xs text-white/60 sm:text-sm">
                  Provinsi
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tentang Asosiasi */}
      <section className="relative z-10 bg-white py-16">
        <div className="mx-auto max-w-7xl space-y-6 px-6 sm:px-8 lg:px-20">
          <div className="font-mono text-blue-600">Tentang Asosiasi</div>
          <h2 className="max-w-4xl text-5xl leading-tight tracking-tight">
            Wadah profesional yang mendedikasikan diri untuk kemajuan ekosistem
            AI nasional.
          </h2>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-700">
            ASPROKAINDONESIA didirikan oleh sekelompok akademisi, peneliti, dan
            praktisi kecerdasan artifisial yang memiliki visi bersama untuk
            memajukan ekosistem AI di Indonesia.
          </p>
          <Button asChild size="lg" variant="secondary" className="w-fit">
            <Link href="/register">Selengkapnya</Link>
          </Button>
        </div>
      </section>

      {/* =====================================================
    BENEFIT
====================================================== */}

      <section className="relative overflow-hidden py-20">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-20 -right-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute bottom-0 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl sm:px-8 lg:px-20">
          {/* =================================================
        HEADER
    ================================================== */}

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <div className="mb-5 font-mono text-white">
                Keuntungan Menjadi Anggota
              </div>

              <h2 className="max-w-4xl text-5xl leading-tight tracking-tight text-white">
                Lebih dari sekadar
                <span className=""> keanggotaan.</span>
              </h2>
            </div>

            <div className="lg:col-span-5 lg:pb-1">
              <p className="max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
                Dapatkan fasilitas, pengakuan, dan jaringan untuk mendukung
                karier AI Anda.
              </p>
            </div>
          </div>

          {/* =================================================
    BENEFIT GRID
================================================== */}

          <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
            {/* =================================================
      CARD 1 — PENGAKUAN
  ================================================== */}

            <div className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white p-7 shadow-2xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/15 md:p-8 lg:col-span-7">
              <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl transition-transform duration-500 group-hover:scale-125" />

              <div className="relative flex h-full flex-col justify-between gap-12">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <BadgeCheck className="h-5 w-5" />
                  </div>

                  <span className="font-mono text-xs text-slate-400">01</span>
                </div>

                <div>
                  <h3 className="text-xl font-medium tracking-tight text-slate-950 sm:text-2xl">
                    Pengakuan Profesional
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                    Diakui sebagai bagian dari komunitas profesional pengembang
                    kecerdasan artifisial di Indonesia.
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
      CARD 2 — KARTU & SERTIFIKAT
  ================================================== */}

            <div className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white p-7 shadow-2xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/15 md:p-8 lg:col-span-5">
              <div className="relative flex h-full min-h-55 flex-col justify-between gap-10">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Award className="h-5 w-5" />
                  </div>

                  <span className="font-mono text-xs text-slate-400">02</span>
                </div>

                <div>
                  <h3 className="text-xl font-medium tracking-tight text-slate-950">
                    Kartu & Sertifikat Digital
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Kartu anggota digital dan sertifikat keanggotaan dengan
                    sistem verifikasi yang mudah diakses.
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
      CARD 3 — JARINGAN
  ================================================== */}

            <div className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white p-7 shadow-2xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/15 md:p-8 lg:col-span-4">
              <div className="relative flex h-full min-h-60 flex-col justify-between gap-10">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Network className="h-5 w-5" />
                  </div>

                  <span className="font-mono text-xs text-slate-400">03</span>
                </div>

                <div>
                  <h3 className="text-xl font-medium tracking-tight text-slate-950">
                    Jaringan Profesional
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Terhubung dengan praktisi, akademisi, peneliti, dan
                    profesional AI di seluruh Indonesia.
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
      CARD 4 — KOLABORASI
  ================================================== */}

            <div className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white p-7 shadow-2xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/15 md:p-8 lg:col-span-4">
              <div className="relative flex h-full min-h-60 flex-col justify-between gap-10">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </div>

                  <span className="font-mono text-xs text-slate-400">04</span>
                </div>

                <div>
                  <h3 className="text-xl font-medium tracking-tight text-slate-950">
                    Kolaborasi & Proyek
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Temukan kesempatan berkolaborasi dalam proyek, riset, dan
                    berbagai inisiatif AI.
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
      CARD 5 — PENGEMBANGAN
  ================================================== */}

            <div className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white p-7 shadow-2xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/15 md:p-8 lg:col-span-4">
              <div className="relative flex h-full min-h-60 flex-col justify-between gap-10">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <GraduationCap className="h-5 w-5" />
                  </div>

                  <span className="font-mono text-xs text-slate-400">05</span>
                </div>

                <div>
                  <h3 className="text-xl font-medium tracking-tight text-slate-950">
                    Pengembangan Profesi
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Akses informasi, pelatihan, workshop, dan kegiatan untuk
                    meningkatkan kompetensi profesional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
    MEMBERSHIP
====================================================== */}

      <section className="relative z-10 overflow-hidden py-20">
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* =================================================
          LEFT — INTRODUCTION
      ================================================== */}

            <div className="lg:col-span-6">
              <div className="mb-5 font-mono text-white">Keanggotaan</div>

              <h2 className="max-w-xl text-5xl leading-[1.05] tracking-tight text-white">
                Bergabung dengan
                <span className="text-white/50"> ekosistem AI Indonesia.</span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
                Menjadi bagian dari komunitas profesional yang mendorong
                pengembangan, kolaborasi, dan kemajuan kecerdasan artifisial di
                Indonesia.
              </p>
            </div>

            {/* =================================================
          RIGHT — MEMBERSHIP CARD
      ================================================== */}

            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-3xl border border-white/30 bg-white p-7 shadow-2xl shadow-black/20 md:p-9">
                {/* Decorative element */}
                <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative">
                  {/* Label */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs tracking-widest text-slate-400">
                      KEANGGOTAAN TAHUNAN
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                      12 BULAN
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-8">
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                        Rp 150.000
                      </span>

                      <span className="mb-2 text-sm text-slate-400">
                        / tahun
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Sekali bayar · berlaku selama 12 bulan
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="my-8 h-px bg-slate-200" />

                  {/* Benefits */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Check className="h-3.5 w-3.5" />
                      </div>

                      <span className="text-sm text-slate-600">
                        Keanggotaan aktif selama 12 bulan
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Check className="h-3.5 w-3.5" />
                      </div>

                      <span className="text-sm text-slate-600">
                        Kartu anggota digital
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Check className="h-3.5 w-3.5" />
                      </div>

                      <span className="text-sm text-slate-600">
                        Sertifikat keanggotaan
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Check className="h-3.5 w-3.5" />
                      </div>

                      <span className="text-sm text-slate-600">
                        Akses kegiatan dan program asosiasi
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    asChild
                    size="lg"
                    className="mt-8 h-12 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Link href="/login">Bergabung Sekarang</Link>
                  </Button>

                  {/* Small note */}
                  <p className="mt-4 text-center text-xs text-slate-400">
                    Keanggotaan akan aktif setelah proses verifikasi selesai.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
    FAQ
====================================================== */}

      <section className="relative z-10 overflow-hidden py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-20">
          {/* =================================================
        HEADER
    ================================================== */}

          <div className="flex items-end justify-between">
            <div>
              <div className="font-mono text-white">FAQ</div>

              <h2 className="mt-5 text-5xl leading-tight tracking-tight text-white">
                Pertanyaan yang paling sering diajukan
              </h2>
            </div>

            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
              Temukan jawaban atas pertanyaan umum mengenai keanggotaan,
              pendaftaran, verifikasi, dan kegiatan asosiasi.
            </p>
          </div>

          {/* =================================================
        CONTENT
    ================================================== */}

          <div className="mt-12 grid grid-cols-1 gap-8 border-t border-white/15 pt-8 lg:grid-cols-12 lg:gap-12">
            {/* =================================================
          LEFT — CONTACT
      ================================================== */}

            <div className="lg:col-span-4">
              <div className="max-w-sm border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-base font-medium text-white">
                  Masih punya pertanyaan?
                </p>

                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  Tidak menemukan jawaban yang Anda cari? Hubungi kami untuk
                  mendapatkan informasi lebih lanjut.
                </p>

                <Link
                  href="/contact"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-white/70"
                >
                  Hubungi kami
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* =================================================
          RIGHT — FAQ ITEMS
      ================================================== */}

            <div className="lg:col-span-8">
              <div className="space-y-3">
                {/* FAQ 01 */}
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-xl border border-white/15 bg-white/5 px-5 py-5 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.07] sm:px-6">
                    <span className="text-sm font-medium text-white sm:text-base">
                      Apa itu ASPROKAINDONESIA?
                    </span>

                    <ChevronDown className="h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 group-open:rotate-180" />
                  </summary>

                  <div className="px-5 pt-4 pb-2 sm:px-6">
                    <p className="max-w-2xl text-sm leading-relaxed text-white/55">
                      ASPROKAINDONESIA merupakan wadah profesional bagi
                      akademisi, peneliti, praktisi, dan individu yang memiliki
                      ketertarikan terhadap pengembangan kecerdasan artifisial
                      di Indonesia.
                    </p>
                  </div>
                </details>

                {/* FAQ 02 */}
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-xl border border-white/15 bg-white/5 px-5 py-5 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.07] sm:px-6">
                    <span className="text-sm font-medium text-white sm:text-base">
                      Siapa yang dapat menjadi anggota?
                    </span>

                    <ChevronDown className="h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 group-open:rotate-180" />
                  </summary>

                  <div className="px-5 pt-4 pb-2 sm:px-6">
                    <p className="max-w-2xl text-sm leading-relaxed text-white/55">
                      Keanggotaan terbuka bagi individu yang memiliki latar
                      belakang, pengalaman, kompetensi, atau ketertarikan di
                      bidang kecerdasan artifisial dan pengembangannya di
                      Indonesia.
                    </p>
                  </div>
                </details>

                {/* FAQ 03 */}
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-xl border border-white/15 bg-white/5 px-5 py-5 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.07] sm:px-6">
                    <span className="text-sm font-medium text-white sm:text-base">
                      Berapa biaya keanggotaan?
                    </span>

                    <ChevronDown className="h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 group-open:rotate-180" />
                  </summary>

                  <div className="px-5 pt-4 pb-2 sm:px-6">
                    <p className="max-w-2xl text-sm leading-relaxed text-white/55">
                      Biaya keanggotaan adalah{" "}
                      <span className="font-medium text-white">Rp 150.000</span>{" "}
                      dan berlaku selama 12 bulan sejak keanggotaan disetujui
                      melalui proses verifikasi.
                    </p>
                  </div>
                </details>

                {/* FAQ 04 */}
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-xl border border-white/15 bg-white/5 px-5 py-5 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.07] sm:px-6">
                    <span className="text-sm font-medium text-white sm:text-base">
                      Bagaimana proses pendaftaran anggota?
                    </span>

                    <ChevronDown className="h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 group-open:rotate-180" />
                  </summary>

                  <div className="px-5 pt-4 pb-2 sm:px-6">
                    <p className="max-w-2xl text-sm leading-relaxed text-white/55">
                      Pendaftaran dilakukan secara online dengan membuat akun,
                      melengkapi data keanggotaan, melakukan pembayaran, dan
                      mengunggah bukti pembayaran. Data kemudian diperiksa oleh
                      administrator sebelum keanggotaan diaktifkan.
                    </p>
                  </div>
                </details>

                {/* FAQ 05 */}
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-xl border border-white/15 bg-white/5 px-5 py-5 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.07] sm:px-6">
                    <span className="text-sm font-medium text-white sm:text-base">
                      Apa yang didapatkan setelah menjadi anggota?
                    </span>

                    <ChevronDown className="h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 group-open:rotate-180" />
                  </summary>

                  <div className="px-5 pt-4 pb-2 sm:px-6">
                    <p className="max-w-2xl text-sm leading-relaxed text-white/55">
                      Anggota mendapatkan akses ke berbagai program dan kegiatan
                      asosiasi, kartu anggota digital, sertifikat keanggotaan,
                      serta kesempatan untuk terhubung dan berkolaborasi dengan
                      jaringan profesional di bidang kecerdasan artifisial.
                    </p>
                  </div>
                </details>

                {/* FAQ 06 */}
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-xl border border-white/15 bg-white/5 px-5 py-5 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/[0.07] sm:px-6">
                    <span className="text-sm font-medium text-white sm:text-base">
                      Berapa lama proses verifikasi keanggotaan?
                    </span>

                    <ChevronDown className="h-4 w-4 shrink-0 text-white/50 transition-transform duration-200 group-open:rotate-180" />
                  </summary>

                  <div className="px-5 pt-4 pb-2 sm:px-6">
                    <p className="max-w-2xl text-sm leading-relaxed text-white/55">
                      Proses verifikasi dilakukan setelah seluruh data dan bukti
                      pembayaran diterima. Waktu verifikasi bergantung pada
                      proses pemeriksaan oleh administrator.
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
