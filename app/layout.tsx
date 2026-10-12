import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const siteUrl = "https://asprokaindonesia.id"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "ASPROKA Indonesia | Asosiasi Profesi Pengembang Kecerdasan Artifisial",
    template: "%s | ASPROKA Indonesia",
  },

  description:
    "Website resmi ASPROKA Indonesia, Asosiasi Profesi Pengembang Kecerdasan Artifisial. Informasi keanggotaan, pengembangan kompetensi, dan kolaborasi profesional AI.",

  applicationName: "ASPROKA Indonesia",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://asprokaindonesia.id",
    siteName: "ASPROKA Indonesia",
    title: "ASPROKA Indonesia | Asosiasi Profesi Pengembang Kecerdasan Artifisial",
    description:
      "Website resmi ASPROKA Indonesia, Asosiasi Profesi Pengembang Kecerdasan Artifisial.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Website resmi ASPROKA Indonesia",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "ASPROKA Indonesia | Asosiasi Profesi Kecerdasan Artifisial",
    description: "Asosiasi Profesi Pengembang Kecerdasan Artifisial Indonesia.",
    images: ["/opengraph-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
