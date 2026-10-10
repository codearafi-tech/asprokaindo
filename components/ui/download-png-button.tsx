"use client"

import { useState } from "react"
import { toPng } from "html-to-image"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DownloadPngButtonProps {
  targetId: string
  fileName: string
}

export function DownloadPngButton({
  targetId,
  fileName,
}: DownloadPngButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    const element = document.getElementById(targetId)

    if (!element) {
      return
    }

    try {
      setIsDownloading(true)

      // Pastikan font dan gambar sudah selesai dimuat
      await document.fonts.ready

      const images = Array.from(element.querySelectorAll("img"))

      await Promise.all(
        images.map((image) => {
          if (image.complete) return Promise.resolve()

          return new Promise<void>((resolve) => {
            image.onload = () => resolve()
            image.onerror = () => resolve()
          })
        })
      )

      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      const link = document.createElement("a")
      link.download = `${fileName}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Gagal membuat PNG:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Menyiapkan PNG...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download PNG
        </>
      )}
    </Button>
  )
}