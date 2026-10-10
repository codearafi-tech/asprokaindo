"use client"

// Simpan sebagai: components/region-combobox.tsx
// Butuh komponen shadcn: popover & command
//   npx shadcn@latest add popover command

import * as React from "react"
import { useEffect, useState } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ==========================================
// DATA WILAYAH
// ==========================================
// Sumber: API statis emsifa. Untuk produksi, disarankan hosting salinan
// sendiri (fork repo-nya ke GitHub Pages) lalu isi NEXT_PUBLIC_REGION_API_URL.
export const REGION_API_BASE =
  process.env.NEXT_PUBLIC_REGION_API_URL ??
  "/api/regions"

export type RegionOption = {
  id: string
  name: string
}

// API mengembalikan nama kapital semua ("KOTA CIREBON").
// Diubah jadi "Kota Cirebon" supaya enak dibaca dan konsisten saat disimpan.
const KEEP_UPPERCASE = new Set(["DKI"])

export function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) =>
      KEEP_UPPERCASE.has(word.toUpperCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
}

export function findRegionId(options: RegionOption[], name: string) {
  if (!name) return null
  return options.find((option) => option.name === name)?.id ?? null
}

// Cache sederhana agar data yang sama tidak diunduh berulang
const regionCache = new Map<string, RegionOption[]>()

/**
 * Ambil daftar wilayah dari URL. Kirim null untuk menonaktifkan
 * (misalnya saat provinsi belum dipilih).
 */
export function useRegions(url: string | null) {
  const [options, setOptions] = useState<RegionOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!url) {
      setOptions([])
      setLoading(false)
      setError(false)
      return
    }

    const cached = regionCache.get(url)

    if (cached) {
      setOptions(cached)
      setLoading(false)
      setError(false)
      return
    }

    const controller = new AbortController()

    setOptions([])
    setLoading(true)
    setError(false)

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Gagal memuat data wilayah (${response.status})`)
        }
        return response.json() as Promise<{ id: string; name: string }[]>
      })
      .then((data) => {
        const mapped = data.map((item) => ({
          id: item.id,
          name: toTitleCase(item.name),
        }))

        regionCache.set(url, mapped)
        setOptions(mapped)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return

        console.error("Gagal memuat data wilayah:", err)
        setError(true)
        setLoading(false)
      })

    return () => controller.abort()
  }, [url])

  return { options, loading, error }
}

// ==========================================
// COMBOBOX
// ==========================================

type RegionComboboxProps = {
  id: string
  label: string
  value: string
  options: RegionOption[]
  onChange: (name: string) => void
  placeholder: string
  searchPlaceholder?: string
  loading?: boolean
  error?: boolean
  disabled?: boolean
  required?: boolean
  className?: string
}

export function RegionCombobox({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder = "Ketik untuk mencari...",
  loading = false,
  error = false,
  disabled = false,
  required = false,
  className,
}: RegionComboboxProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button" // penting: agar tidak men-submit form
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span
              className={cn("truncate", !value && "text-muted-foreground")}
            >
              {value || placeholder}
            </span>

            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-0"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />

            <CommandList>
              <CommandEmpty>
                {loading
                  ? "Memuat data..."
                  : error
                    ? "Gagal memuat data wilayah. Muat ulang halaman."
                    : "Wilayah tidak ditemukan."}
              </CommandEmpty>

              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => {
                      onChange(option.name)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}