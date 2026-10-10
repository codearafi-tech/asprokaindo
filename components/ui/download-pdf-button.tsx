"use client"

import { useState } from "react"
import { toPng } from "html-to-image"
import jsPDF from "jspdf"
import { Download, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

interface DownloadPdfButtonProps {
  targetId: string
  fileName: string
  orientation?: "portrait" | "landscape"
  format?: "a4" | "card"
}

export function DownloadPdfButton({
  targetId,
  fileName,
  orientation = "portrait",
  format = "a4",
}: DownloadPdfButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    const element = document.getElementById(targetId)

    if (!element) {
      console.error(`Element #${targetId} tidak ditemukan.`)
      return
    }

    try {
      setIsDownloading(true)

      // Pastikan font sudah siap
      await document.fonts.ready

      // Pastikan semua gambar sudah selesai dimuat
      const images = Array.from(element.querySelectorAll("img"))

      await Promise.all(
        images.map((image) => {
          if (image.complete) {
            return Promise.resolve()
          }

          return new Promise<void>((resolve) => {
            image.onload = () => resolve()
            image.onerror = () => resolve()
          })
        }),
      )

      // Ubah element menjadi PNG
      // html-to-image lebih aman terhadap CSS modern
      // seperti lab() / oklch() dibanding html2canvas.
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        imagePlaceholder: undefined,
      })

      let pdfWidth: number
      let pdfHeight: number

      if (format === "card") {
        // Ukuran kartu ID-1 / CR80
        pdfWidth = 85.6
        pdfHeight = 53.98
      } else {
        pdfWidth = orientation === "landscape" ? 297 : 210
        pdfHeight = orientation === "landscape" ? 210 : 297
      }

      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: format === "card" ? [85.6, 53.98] : "a4",
        compress: true,
      })

      const image = new Image()

      image.onload = () => {
        const imageRatio = image.width / image.height

        let imageWidth = pdfWidth
        let imageHeight = pdfWidth / imageRatio

        // Jangan sampai gambar keluar dari halaman PDF
        if (imageHeight > pdfHeight) {
          imageHeight = pdfHeight
          imageWidth = pdfHeight * imageRatio
        }

        const x = (pdfWidth - imageWidth) / 2
        const y = (pdfHeight - imageHeight) / 2

        pdf.addImage(
          dataUrl,
          "PNG",
          x,
          y,
          imageWidth,
          imageHeight,
          undefined,
          "FAST",
        )

        pdf.save(`${fileName}.pdf`)

        setIsDownloading(false)
      }

      image.onerror = () => {
        throw new Error("Gagal memproses gambar untuk PDF.")
      }

      image.src = dataUrl
    } catch (error) {
      console.error("Gagal membuat PDF:", error)
      setIsDownloading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="default"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Menyiapkan PDF...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  )
}