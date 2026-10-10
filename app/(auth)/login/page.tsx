"use client"

import { useState } from "react"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      console.error("Gagal masuk dengan Google:", error.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* =====================================================
            LEFT — BRANDING
        ===================================================== */}
        <section className="relative hidden overflow-hidden bg-[#071538] lg:flex">
          {/* Decorative blur */}
          <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -right-20 -bottom-40 size-125 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
            {/* Logo */}
            <Link href="/" className="inline-flex w-fit items-center gap-4">
            <img src="/Asproka-logo.png" alt="logo asosiasi" className="w-8 brightness-0 invert" />
              <span className="text-xl font-semibold tracking-tight text-white">
                ASPROKAI
              </span>
            </Link>

            {/* Main Content */}
            <div className="max-w-lg">
              <h1 className="mt-5 text-4xl leading-tight tracking-tight text-white xl:text-5xl">
                Terhubung dengan
                <br />
                komunitas profesional
                <br />
                kecerdasan artifisial.
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
                Akses portal anggota untuk mengelola keanggotaan, mengikuti
                kegiatan, dan mendapatkan berbagai layanan ASPROKAI.
              </p>
            </div>

            {/* Footer */}
            <p className="text-xs text-white/35">
              © {new Date().getFullYear()} ASPROKAI
            </p>
          </div>
        </section>

        {/* =====================================================
            RIGHT — LOGIN
        ===================================================== */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-10 lg:hidden">
              <Link
                href="/"
                className="text-xl font-semibold tracking-tight text-foreground"
              >
                ASPROKAI
              </Link>
            </div>

            {/* Back */}
            <Link
              href="/"
              className="group mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              Kembali ke beranda
            </Link>

            {/* Heading */}
            <div>
              <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground">
                Masuk ke akun Anda
              </h2>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Gunakan akun Google untuk mengakses portal anggota ASPROKAI.
              </p>
            </div>

            {/* Login Box */}
            <div className="mt-9 rounded-2xl border border-border/70 bg-background p-6 shadow-sm sm:p-7">
              <Button
                variant="outline"
                type="button"
                className="h-12 w-full justify-center gap-3 rounded-xl border-border bg-background text-sm font-medium transition-all hover:bg-muted/60"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <FcGoogle className="size-5" />

                {loading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
              </Button>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />

                <span className="text-[11px] text-muted-foreground">
                  AMAN & TERPERCAYA
                </span>

                <div className="h-px flex-1 bg-border" />
              </div>

              <p className="text-center text-xs leading-5 text-muted-foreground">
                Dengan melanjutkan, Anda akan diarahkan ke Google untuk
                melakukan autentikasi secara aman.
              </p>
            </div>

            {/* Registration Info */}
            <div className="mt-6 rounded-xl bg-muted/50 px-5 py-4">
              <p className="text-xs leading-5 text-muted-foreground">
                Belum terdaftar sebagai anggota? Tidak perlu membuat akun
                terlebih dahulu. Login menggunakan Google untuk memulai proses
                pendaftaran.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
