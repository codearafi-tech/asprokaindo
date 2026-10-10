"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { createExpense } from "./action"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// ============================================================
// HELPER
// ============================================================

/**
 * Tanggal hari ini menurut zona waktu perangkat.
 *
 * Jangan pakai new Date().toISOString().split("T")[0]:
 * itu memakai UTC, jadi di Indonesia (UTC+7) sebelum pukul 07.00
 * hasilnya masih tanggal kemarin.
 */
function getTodayLocal() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const numberFormatter = new Intl.NumberFormat("id-ID")

// Hanya angka, tanpa nol di depan, maksimal 12 digit
function sanitizeAmount(value: string) {
  return value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 12)
}

// ============================================================
// KOMPONEN
// ============================================================

export function ExpenseDialog() {
  const router = useRouter()

  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Nominal disimpan sebagai angka murni ("500000"),
  // tampilannya diformat ("500.000").
  const [amount, setAmount] = React.useState("")

  // ----------------------------------------------------------
  // BUKA / TUTUP DIALOG
  //
  // Field lain (kategori, deskripsi, tanggal, catatan) tidak perlu
  // state: isi DialogContent otomatis di-unmount saat dialog
  // ditutup, jadi form selalu kosong lagi ketika dibuka kembali.
  // ----------------------------------------------------------

  function handleOpenChange(value: boolean) {
    // Jangan biarkan dialog ditutup saat data sedang dikirim
    if (loading) return

    setOpen(value)

    if (!value) {
      setAmount("")
      setError(null)
    }
  }

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading) return

    const formData = new FormData(event.currentTarget)

    // Rapikan spasi di awal/akhir
    for (const field of ["category", "description", "notes"]) {
      const value = formData.get(field)

      if (typeof value === "string") {
        formData.set(field, value.trim())
      }
    }

    // Validasi sisi klien
    if (!formData.get("category") || !formData.get("description")) {
      setError("Kategori dan deskripsi tidak boleh kosong.")
      return
    }

    if (!amount || Number(amount) < 1) {
      setError("Nominal harus lebih dari 0.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await createExpense(formData)

      if (!result.success) {
        setError(result.message)
        return
      }

      setOpen(false)
      setAmount("")

      router.refresh()
    } catch (error) {
      // Tanpa try/catch, kegagalan jaringan atau error server
      // membuat tombol "Menyimpan..." macet selamanya.
      console.error("Gagal menyimpan pengeluaran:", error)

      setError("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengeluaran
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100%-2rem)] max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Pengeluaran</DialogTitle>
          <DialogDescription>
            Catat pengeluaran organisasi ke dalam laporan keuangan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>

            <Input
              id="category"
              name="category"
              placeholder="Contoh: Operasional"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>

            <Input
              id="description"
              name="description"
              placeholder="Contoh: Pembelian ATK kantor"
              disabled={loading}
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Nominal</Label>

              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  Rp
                </span>

                {/* Input tampilan (berformat) */}
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="500.000"
                  className="pl-10"
                  value={amount ? numberFormatter.format(Number(amount)) : ""}
                  onChange={(event) =>
                    setAmount(sanitizeAmount(event.target.value))
                  }
                  disabled={loading}
                  required
                />

                {/* Nilai yang dikirim ke server: angka murni, sama seperti sebelumnya */}
                <input type="hidden" name="amount" value={amount} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_date">Tanggal</Label>

              <Input
                id="transaction_date"
                name="transaction_date"
                type="date"
                defaultValue={getTodayLocal()}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Catatan{" "}
              <span className="font-normal text-muted-foreground">
                (opsional)
              </span>
            </Label>

            <Textarea
              id="notes"
              name="notes"
              placeholder="Tambahkan catatan jika diperlukan..."
              disabled={loading}
              rows={3}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Pengeluaran"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
