"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Camera, CheckCircle2, Loader2, Save } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  RegionCombobox,
  useRegions,
  findRegionId,
  REGION_API_BASE,
} from "@/components/ui/region-combobox"

type Profile = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: string
  verification_status: string
  member_number: string | null
  certificate_number: string | null
  registered_at: string | null
  membership_start_date: string | null
  membership_expiry_date: string | null
}

type MemberDetails = {
  id: string
  user_id: string
  full_name: string | null
  title_prefix: string | null
  title_suffix: string | null
  birth_place: string | null
  birth_date: string | null
  gender: string | null
  address: string | null
  province: string | null
  city: string | null
  district: string | null
  postal_code: string | null
  occupation: string | null
  institution_name: string | null
  position: string | null
  education: string | null
  competencies: string | null
  work_experience_years: number | null
  linkedin_url: string | null
  website_url: string | null
  photo_path: string | null
}

type Props = {
  profile: Profile
  memberDetails: MemberDetails | null
}

type FormState = {
  full_name: string
  title_prefix: string
  title_suffix: string
  birth_place: string
  birth_date: string
  gender: string
  address: string
  province: string
  city: string
  district: string
  postal_code: string

  occupation: string
  institution_name: string
  position: string
  education: string
  competencies: string
  work_experience_years: string
  linkedin_url: string
  website_url: string
}

function formatDate(date: string | null) {
  if (!date) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export default function SettingsForm({ profile, memberDetails }: Props) {
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    full_name: memberDetails?.full_name ?? "",
    title_prefix: memberDetails?.title_prefix ?? "",
    title_suffix: memberDetails?.title_suffix ?? "",
    birth_place: memberDetails?.birth_place ?? "",
    birth_date: memberDetails?.birth_date ?? "",
    gender: memberDetails?.gender ?? "",
    address: memberDetails?.address ?? "",
    province: memberDetails?.province ?? "",
    city: memberDetails?.city ?? "",
    district: memberDetails?.district ?? "",
    postal_code: memberDetails?.postal_code ?? "",

    occupation: memberDetails?.occupation ?? "",
    institution_name: memberDetails?.institution_name ?? "",
    position: memberDetails?.position ?? "",
    education: memberDetails?.education ?? "",
    competencies: memberDetails?.competencies ?? "",
    work_experience_years:
      memberDetails?.work_experience_years?.toString() ?? "",
    linkedin_url: memberDetails?.linkedin_url ?? "",
    website_url: memberDetails?.website_url ?? "",
  })

  // =========================================================
  // DATA WILAYAH (bertingkat)
  // =========================================================

  const provinces = useRegions(`${REGION_API_BASE}/provinces.json`)
  const provinceId = findRegionId(provinces.options, form.province)

  const regencies = useRegions(
    provinceId ? `${REGION_API_BASE}/regencies/${provinceId}.json` : null
  )
  const regencyId = findRegionId(regencies.options, form.city)

  const districts = useRegions(
    regencyId ? `${REGION_API_BASE}/districts/${regencyId}.json` : null
  )

  function handleProvinceChange(name: string) {
    setForm((current) => ({
      ...current,
      province: name,
      city: "",
      district: "",
    }))
  }

  function handleCityChange(name: string) {
    setForm((current) => ({ ...current, city: name, district: "" }))
  }

  function handleDistrictChange(name: string) {
    setForm((current) => ({ ...current, district: name }))
  }
  // =========================================================
  // LOAD FOTO
  // =========================================================

  useEffect(() => {
    async function loadPhoto() {
      if (!memberDetails?.photo_path) {
        setPhotoUrl(null)
        return
      }

      const { data, error } = await supabase.storage
        .from("member-photos")
        .createSignedUrl(memberDetails.photo_path, 60 * 60)

      if (error) {
        console.error("Gagal membuat signed URL foto:", error)
        return
      }

      setPhotoUrl(data?.signedUrl ?? null)
    }

    loadPhoto()
  }, [memberDetails?.photo_path])

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  // =========================================================
  // UPLOAD FOTO
  // =========================================================

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) return

    setError("")
    setMessage("")

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5 MB.")
      return
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

    if (!allowedTypes.includes(file.type)) {
      setError("Format foto harus JPG, PNG, atau WEBP.")
      return
    }

    setPhotoLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Sesi login tidak ditemukan.")
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"

      const filePath = `${user.id}/profile.${extension}`

      const { error: uploadError } = await supabase.storage
        .from("member-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        throw new Error(`Gagal mengupload foto: ${uploadError.message}`)
      }

      const { error: updateError } = await supabase
        .from("member_details")
        .update({
          photo_path: filePath,
        })
        .eq("user_id", user.id)

      if (updateError) {
        throw new Error(`Gagal menyimpan foto: ${updateError.message}`)
      }

      const { data: signedData } = await supabase.storage
        .from("member-photos")
        .createSignedUrl(filePath, 60 * 60)

      setPhotoUrl(signedData?.signedUrl ?? null)

      setMessage("Foto profil berhasil diperbarui.")
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error ? error.message : "Gagal memperbarui foto."
      )
    } finally {
      setPhotoLoading(false)
      event.target.value = ""
    }
  }

  // =========================================================
  // SIMPAN DATA
  // =========================================================

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage("")
    setError("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Sesi login tidak ditemukan.")
      }

      if (!form.province) throw new Error("Silakan pilih provinsi.")
      if (!form.city) throw new Error("Silakan pilih kota/kabupaten.")
      if (!form.district) throw new Error("Silakan pilih kecamatan.")

      const { error } = await supabase.from("member_details").upsert(
        {
          user_id: user.id,

          full_name: form.full_name.trim(),

          title_prefix: form.title_prefix.trim() || null,

          title_suffix: form.title_suffix.trim() || null,

          birth_place: form.birth_place.trim(),

          birth_date: form.birth_date || null,

          gender: form.gender || null,

          address: form.address.trim(),

          province: form.province.trim(),

          city: form.city.trim(),

          district: form.district.trim(),

          postal_code: form.postal_code.trim(),

          occupation: form.occupation.trim(),

          institution_name: form.institution_name.trim(),

          position: form.position.trim() || null,

          education: form.education.trim(),

          competencies: form.competencies.trim(),

          work_experience_years: form.work_experience_years
            ? Number(form.work_experience_years)
            : null,

          linkedin_url: form.linkedin_url.trim() || null,

          website_url: form.website_url.trim() || null,
        },
        {
          onConflict: "user_id",
        }
      )

      if (error) {
        throw new Error(`Gagal menyimpan data: ${error.message}`)
      }

      setMessage("Perubahan data berhasil disimpan.")
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error ? error.message : "Gagal menyimpan perubahan."
      )
    } finally {
      setLoading(false)
    }
  }

  const initials =
    form.full_name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => name[0])
      .join("")
      .toUpperCase() || "A"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* =====================================================
          PROFIL
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>

          <CardDescription>
            Kelola foto dan informasi dasar akun Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="h-28 w-28 border">
                <AvatarImage src={photoUrl ?? undefined} alt={form.full_name} />

                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>

              {photoLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-medium">Foto Profil</p>

                <p className="text-sm text-muted-foreground">
                  Gunakan foto formal JPG, PNG, atau WEBP. Maksimal 5 MB.
                </p>
              </div>

              <div>
                <Label
                  htmlFor="photo"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Camera className="h-4 w-4" />
                  {photoLoading ? "Mengupload..." : "Ganti Foto"}
                </Label>

                <Input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                  disabled={photoLoading}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
          KEANGGOTAAN
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>Keanggotaan</CardTitle>

          <CardDescription>
            Informasi keanggotaan yang dikelola oleh sistem.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Nomor Anggota</p>

            <p className="mt-1 font-mono text-sm font-semibold">
              {profile.member_number ?? "Belum tersedia"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Status</p>

            <div className="mt-1">
              {profile.verification_status === "verified" ? (
                <Badge>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Aktif
                </Badge>
              ) : (
                <Badge variant="secondary">{profile.verification_status}</Badge>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Berlaku Mulai</p>

            <p className="mt-1 text-sm font-medium">
              {formatDate(profile.membership_start_date)}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Berlaku Sampai</p>

            <p className="mt-1 text-sm font-medium">
              {formatDate(profile.membership_expiry_date)}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground">Nomor Sertifikat</p>

            <p className="mt-1 font-mono text-sm font-medium">
              {profile.certificate_number ?? "Belum tersedia"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
          DATA PRIBADI
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>Data Pribadi</CardTitle>

          <CardDescription>Informasi identitas anggota.</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title_prefix">Gelar Depan</Label>

            <Input
              id="title_prefix"
              name="title_prefix"
              value={form.title_prefix}
              onChange={handleChange}
              placeholder="Contoh: Dr."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title_suffix">Gelar Belakang</Label>

            <Input
              id="title_suffix"
              name="title_suffix"
              value={form.title_suffix}
              onChange={handleChange}
              placeholder="Contoh: M.Kom."
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="full_name">Nama Lengkap</Label>

            <Input
              id="full_name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_place">Tempat Lahir</Label>

            <Input
              id="birth_place"
              name="birth_place"
              value={form.birth_place}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Tanggal Lahir</Label>

            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              value={form.birth_date}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Jenis Kelamin</Label>

            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  gender: event.target.value,
                }))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Pilih jenis kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Alamat</Label>

            <Textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <RegionCombobox
            id="province"
            label="Provinsi"
            value={form.province}
            options={provinces.options}
            loading={provinces.loading}
            error={provinces.error}
            onChange={handleProvinceChange}
            placeholder="Pilih provinsi"
            searchPlaceholder="Cari provinsi..."
          />

          <RegionCombobox
            id="city"
            label="Kota / Kabupaten"
            value={form.city}
            options={regencies.options}
            loading={regencies.loading}
            error={regencies.error}
            disabled={!provinceId}
            onChange={handleCityChange}
            placeholder={
              provinceId ? "Pilih kota/kabupaten" : "Pilih provinsi dulu"
            }
            searchPlaceholder="Cari kota/kabupaten..."
          />

          <RegionCombobox
            id="district"
            label="Kecamatan"
            value={form.district}
            options={districts.options}
            loading={districts.loading}
            error={districts.error}
            disabled={!regencyId}
            onChange={handleDistrictChange}
            placeholder={
              regencyId ? "Pilih kecamatan" : "Pilih kota/kabupaten dulu"
            }
            searchPlaceholder="Cari kecamatan..."
          />

          <div className="space-y-2">
            <Label htmlFor="postal_code">Kode Pos</Label>

            <Input
              id="postal_code"
              name="postal_code"
              inputMode="numeric"
              value={form.postal_code}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
          DATA PROFESIONAL
      ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>Data Profesional</CardTitle>

          <CardDescription>
            Informasi pekerjaan dan kompetensi Anda.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="occupation">Pekerjaan</Label>

            <Input
              id="occupation"
              name="occupation"
              value={form.occupation}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Jabatan</Label>

            <Input
              id="position"
              name="position"
              value={form.position}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="institution_name">Institusi / Perusahaan</Label>

            <Input
              id="institution_name"
              name="institution_name"
              value={form.institution_name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">Pendidikan Terakhir</Label>

            <Input
              id="education"
              name="education"
              value={form.education}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_experience_years">Pengalaman Kerja</Label>

            <Input
              id="work_experience_years"
              name="work_experience_years"
              type="number"
              min="0"
              value={form.work_experience_years}
              onChange={handleChange}
              placeholder="Contoh: 5"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="competencies">Kompetensi</Label>

            <Textarea
              id="competencies"
              name="competencies"
              value={form.competencies}
              onChange={handleChange}
              rows={4}
              placeholder="Tuliskan kompetensi atau keahlian Anda."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn</Label>

            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={form.linkedin_url}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website</Label>

            <Input
              id="website_url"
              name="website_url"
              type="url"
              value={form.website_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
          MESSAGE
      ====================================================== */}

      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* =====================================================
          SAVE
      ====================================================== */}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
