"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { createClient } from "@/lib/supabase/client"

// ============================================================
// NAVIGATION
// ============================================================

const navigation = {
  keanggotaan: [
    {
      title: "Direktori Anggota",
      href: "/keanggotaan/direktori-anggota",
      description: "Lihat direktori anggota ASPROKAI.",
    },
    {
      title: "Verifikasi Anggota",
      href: "/keanggotaan/verifikasi-anggota",
      description: "Verifikasi status keanggotaan.",
    },
    {
      title: "Verifikasi Sertifikat",
      href: "/keanggotaan/verifikasi-sertifikat",
      description: "Periksa keaslian sertifikat Anda.",
    },
    {
      title: "Sebaran Anggota",
      href: "/keanggotaan/sebaran-anggota",
      description: "Lihat statistik keanggotaan.",
    },
  ],
}

// ============================================================
// NAVBAR
// ============================================================

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  // ============================================================
  // SCROLL STATE
  // ============================================================

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    handleScroll()

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // ============================================================
  // AUTH STATE
  // ============================================================

  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setIsLoggedIn(Boolean(session))
      setAuthLoading(false)
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return

        setIsLoggedIn(Boolean(session))
        setAuthLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // ============================================================
  // MOBILE NAVIGATION
  // ============================================================

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  // ============================================================
  // AUTH BUTTON
  // ============================================================

  const authButton = (
    <Button
      asChild
      variant={scrolled ? "default" : "secondary"}
      className={`h-10 rounded-lg px-5 transition-all duration-300 ${
        scrolled
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-white text-foreground hover:bg-white/90"
      }`}
    >
      <Link href={isLoggedIn ? "/dashboard" : "/login"}>
        {authLoading ? "..." : isLoggedIn ? "Dashboard" : "Masuk"}
      </Link>
    </Button>
  )

  // ============================================================
  // DESKTOP NAVIGATION LINK STYLE
  // ============================================================

  const navigationLinkClass = `
    inline-flex
    h-10
    items-center
    justify-center
    rounded-lg
    px-4
    text-sm
    font-medium
    transition-colors
    duration-300
    ${
      scrolled
        ? "text-foreground/75 hover:bg-black/5 hover:text-foreground"
        : "text-white/85 hover:bg-white/10 hover:text-white"
    }
  `

  // ============================================================
  // NAVBAR
  // ============================================================

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 w-full px-6 transition-all duration-300 md:px-28 ${
        scrolled
          ? "border-b border-black/10 bg-white/95 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="w-full">
        <div className="w-full">
          <div className="flex h-16 items-center">
            {/* ==================================================
                LOGO
            ================================================== */}

            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5"
              aria-label="ASPROKAI - Beranda"
              onClick={closeMobileMenu}
            >
              <Image
                src="/Asproka-logo.png"
                alt="Logo ASPROKAI"
                width={32}
                height={32}
                className={`size-8 object-contain transition-all duration-300 ${
                  scrolled ? "" : "brightness-0 invert"
                }`}
                priority
              />

              <span
                className={`text-lg font-semibold tracking-tight transition-colors duration-300 ${
                  scrolled ? "text-foreground" : "text-white"
                }`}
              >
                ASPROKAI
              </span>
            </Link>

            {/* ==================================================
                DESKTOP NAVIGATION
            ================================================== */}

            <NavigationMenu className="ml-5 hidden lg:flex">
              <NavigationMenuList>
                {/* BERANDA */}

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/" className={navigationLinkClass}>
                      Beranda
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {/* TENTANG KAMI */}

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/tentang-kami" className={navigationLinkClass}>
                      Tentang Kami
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {/* KEANGGOTAAN */}

                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={`h-10 rounded-lg bg-transparent px-4 text-sm font-medium transition-colors duration-300 ${
                      scrolled
                        ? "text-foreground/75 hover:bg-black/5 hover:text-foreground focus:bg-black/5 focus:text-foreground data-[state=open]:bg-black/5! data-[state=open]:text-foreground! data-open:bg-black/5! data-open:text-foreground!"
                        : "text-white/85 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[state=open]:bg-white/10! data-[state=open]:text-white! data-open:bg-white/10! data-open:text-white!"
                    }`}
                  >
                    Keanggotaan
                  </NavigationMenuTrigger>

                  <NavigationMenuContent className="w-auto! min-w-0!">
                    <div className="w-max max-w-90 min-w-70 p-1.5">
                      {navigation.keanggotaan.map((item) => (
                        <NavigationMenuLink key={item.href} asChild>
                          <Link
                            href={item.href}
                            className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 transition-colors outline-none hover:bg-muted focus:bg-muted"
                          >
                            <span className="text-sm leading-5 font-medium text-foreground">
                              {item.title}
                            </span>

                            <span className="text-xs leading-4 text-muted-foreground">
                              {item.description}
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* GALERI */}

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/galeri" className={navigationLinkClass}>
                      Galeri
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                

                {/* MARKETPLACE */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/tentang-kami" className={navigationLinkClass}>
                      Marketplace
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* ==================================================
                DESKTOP AUTH
            ================================================== */}

            <div className="ml-auto hidden lg:block">{authButton}</div>

            {/* ==================================================
                MOBILE MENU
            ================================================== */}

            <div className="ml-auto lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`size-10 transition-colors duration-300 ${
                      scrolled
                        ? "text-foreground hover:bg-black/5"
                        : "text-white hover:bg-white/10 hover:text-white"
                    }`}
                    aria-label="Buka menu"
                  >
                    <Menu className="size-5" />
                    <span className="sr-only">Buka menu</span>
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-[85%] max-w-sm">
                  {/* MOBILE HEADER */}

                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2.5 text-left">
                      <Image
                        src="/Asproka-logo.png"
                        alt="Logo ASPROKAI"
                        width={28}
                        height={28}
                        className="size-7 object-contain"
                      />

                      <span>ASPROKAI</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-8 flex flex-col gap-1">
                    {/* BERANDA */}

                    <Button
                      asChild
                      variant="ghost"
                      className="h-11 justify-start px-4 text-sm"
                      onClick={closeMobileMenu}
                    >
                      <Link href="/">Beranda</Link>
                    </Button>

                    {/* TENTANG KAMI */}

                    <Button
                      asChild
                      variant="ghost"
                      className="h-11 justify-start px-4 text-sm"
                      onClick={closeMobileMenu}
                    >
                      <Link href="/tentang-kami">Tentang Kami</Link>
                    </Button>

                    {/* KEANGGOTAAN */}

                    <div className="mt-3 border-t pt-3">
                      <p className="px-4 py-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        Keanggotaan
                      </p>

                      <div className="flex flex-col">
                        {navigation.keanggotaan.map((item) => (
                          <Button
                            key={item.href}
                            asChild
                            variant="ghost"
                            className="h-11 justify-start px-4 text-sm font-normal"
                            onClick={closeMobileMenu}
                          >
                            <Link href={item.href}>{item.title}</Link>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* GALERI */}

                    <Button
                      asChild
                      variant="ghost"
                      className="h-11 justify-start px-4 text-sm"
                      onClick={closeMobileMenu}
                    >
                      <Link href="/galeri">Galeri</Link>
                    </Button>

                    {/* MOBILE AUTH */}

                    <div className="mt-6 border-t px-4 pt-6 md:px-0">
                      <Button
                        asChild
                        className="h-11 w-full"
                        onClick={closeMobileMenu}
                      >
                        <Link href={isLoggedIn ? "/dashboard" : "/login"}>
                          {authLoading
                            ? "..."
                            : isLoggedIn
                              ? "Dashboard"
                              : "Masuk"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
