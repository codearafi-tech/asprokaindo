import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import SettingsForm from "./settings-form"

export default async function PengaturanPage() {
  const supabase = await createClient()

  // =========================================================
  // 1. CEK USER
  // =========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // =========================================================
  // 2. AMBIL PROFILE
  // =========================================================

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      role,
      verification_status,
      member_number,
      certificate_number,
      registered_at,
      membership_start_date,
      membership_expiry_date
    `)
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    redirect("/dashboard")
  }

  // =========================================================
  // 3. MEMBER SAJA
  // =========================================================

  if (profile.role !== "member") {
    redirect("/admin")
  }

  // =========================================================
  // 4. AMBIL MEMBER DETAILS
  // =========================================================

  const {
    data: memberDetails,
    error: memberDetailsError,
  } = await supabase
    .from("member_details")
    .select(`
      id,
      user_id,
      full_name,
      title_prefix,
      title_suffix,
      birth_place,
      birth_date,
      gender,
      address,
      province,
      city,
      district,
      postal_code,
      occupation,
      institution_name,
      position,
      education,
      competencies,
      work_experience_years,
      linkedin_url,
      website_url,
      photo_path
    `)
    .eq("user_id", user.id)
    .maybeSingle()

  if (memberDetailsError) {
    console.error(
      "Gagal mengambil data anggota:",
      memberDetailsError
    )
  }

  // =========================================================
  // 5. KIRIM DATA KE FORM
  // =========================================================

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Pengaturan
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Kelola profil, data pribadi, dan data profesional Anda.
        </p>
      </div>

      <SettingsForm
        profile={profile}
        memberDetails={memberDetails}
      />
    </div>
  )
}