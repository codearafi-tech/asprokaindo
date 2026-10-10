import Link from "next/link"

import {
  ArrowUpRight,

} from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#071538] text-white">
      <div className="mx-auto w-full max-w-301.5 px-6 sm:px-8 lg:px-0">
        {/* Main Footer */}
        <div className="grid gap-12 py-16 md:grid-cols-12 md:gap-8 lg:py-20">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label="ASPROKAI - Beranda"
            >
              <span className="text-xl font-semibold tracking-tight">
                ASPROKAI
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
              Wadah profesional untuk membangun ekosistem,
              kolaborasi, dan pengembangan kompetensi di bidang
              kecerdasan artifisial.
            </p>

            {/* Social */}
            <div className="mt-7 flex items-center gap-2">
              <Link
                href="#"
                aria-label="LinkedIn"
                className="
                  flex
                  size-9
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-white/10
                  text-white/60
                  transition-colors
                  hover:border-white/20
                  hover:bg-white/5
                  hover:text-white
                "
              >
               
              </Link>

              <Link
                href="#"
                aria-label="Instagram"
                className="
                  flex
                  size-9
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-white/10
                  text-white/60
                  transition-colors
                  hover:border-white/20
                  hover:bg-white/5
                  hover:text-white
                "
              >
    
              </Link>
            </div>
          </div>

          {/* Tentang Kami */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-white">
              Tentang Kami
            </h3>

            <nav className="mt-5 flex flex-col gap-3">
              <Link
                href="/tentang/asosiasi"
                className="
                  text-sm
                  text-white/55
                  transition-colors
                  hover:text-white
                "
              >
                Tentang Asosiasi
              </Link>

              <Link
                href="/tentang/manfaat-anggota"
                className="
                  text-sm
                  text-white/55
                  transition-colors
                  hover:text-white
                "
              >
                Manfaat Anggota
              </Link>
            </nav>
          </div>

          {/* Keanggotaan */}
          <div className="md:col-span-3">
            <h3 className="text-sm font-medium text-white">
              Keanggotaan
            </h3>

            <nav className="mt-5 flex flex-col gap-3">
              <Link
                href="/keanggotaan/direktori-anggota"
                className="
                  text-sm
                  text-white/55
                  transition-colors
                  hover:text-white
                "
              >
                Direktori Anggota
              </Link>

              <Link
                href="/keanggotaan/verifikasi-sertifikat"
                className="
                  text-sm
                  text-white/55
                  transition-colors
                  hover:text-white
                "
              >
                Verifikasi Sertifikat
              </Link>

              <Link
                href="/keanggotaan/verifikasi-anggota"
                className="
                  text-sm
                  text-white/55
                  transition-colors
                  hover:text-white
                "
              >
                Verifikasi Anggota
              </Link>
            </nav>
          </div>

          {/* Bantuan */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-white">
              Bantuan
            </h3>

            <nav className="mt-5 flex flex-col gap-3">
              <Link
                href="/faq"
                className="
                  text-sm
                  text-white/55
                  transition-colors
                  hover:text-white
                "
              >
                FAQ
              </Link>

              <Link
                href="/contact"
                className="
                  group
                  inline-flex
                  items-center
                  gap-1
                  text-sm
                  text-white/55
                  transition-colors
                  hover:text-white
                "
              >
                Hubungi Kami

                <ArrowUpRight
                  className="
                    size-3.5
                    transition-transform
                    group-hover:-translate-y-0.5
                    group-hover:translate-x-0.5
                  "
                />
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="
            flex
            flex-col
            gap-4
            border-t
            border-white/10
            py-6
            text-xs
            text-white/40
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <p>
            © {new Date().getFullYear()} ASPROKAI. Seluruh hak
            cipta dilindungi.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="/kebijakan-privasi"
              className="transition-colors hover:text-white"
            >
              Kebijakan Privasi
            </Link>

            <Link
              href="/syarat-ketentuan"
              className="transition-colors hover:text-white"
            >
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}