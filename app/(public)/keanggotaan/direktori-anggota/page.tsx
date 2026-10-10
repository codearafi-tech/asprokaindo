import "server-only"

import { createClient } from "@supabase/supabase-js"
import { Users } from "lucide-react"
import DirectoryMembers, { type DirectoryMember } from "./directory-members"

export const dynamic = "force-dynamic"

export default async function DirektoriAnggotaPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Konfigurasi Supabase server belum lengkap.")
  }

  // Hanya digunakan di server, tidak boleh di komponen client.
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, member_number, membership_expiry_date")
    .eq("role", "member")
    .eq("verification_status", "verified")
    .not("member_number", "is", null)
    .order("full_name", { ascending: true })
    .limit(200)

  if (profilesError) {
    console.error("Directory profiles error:", profilesError)
    throw new Error("Gagal mengambil data anggota.")
  }

  const userIds = (profiles ?? []).map((profile) => profile.id)

  const { data: details, error: detailsError } =
    userIds.length > 0
      ? await supabase
          .from("member_details")
          .select(
            "user_id, full_name, title_prefix, title_suffix, occupation, institution_name, position, photo_path"
          )
          .in("user_id", userIds)
      : { data: [], error: null }

  if (detailsError) {
    console.error("Directory details error:", detailsError)
    throw new Error("Gagal mengambil detail anggota.")
  }

  const detailsMap = new Map(
    (details ?? []).map((detail) => [detail.user_id, detail])
  )

  const members: DirectoryMember[] = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      const detail = detailsMap.get(profile.id)

      let photoUrl: string | null = null

      if (detail?.photo_path) {
        const { data, error } = await supabase.storage
          .from("member-photos")
          .createSignedUrl(detail.photo_path, 60 * 60)

        if (error) {
          console.error("Photo URL error:", error.message)
        }

        photoUrl = data?.signedUrl ?? null
      }

      const name = detail?.full_name || profile.full_name || "Anggota ASPROKAI"

      const fullName = [detail?.title_prefix, name, detail?.title_suffix]
        .filter(Boolean)
        .join(" ")

      return {
        id: profile.id,
        name: fullName,
        memberNumber: profile.member_number!,
        profession:
          detail?.position || detail?.occupation || "Anggota ASPROKAI",
        institution: detail?.institution_name || null,
        photoUrl,
        membershipExpiryDate: profile.membership_expiry_date,
        isActive:
          Boolean(profile.membership_expiry_date) &&
          new Date(profile.membership_expiry_date!) >= new Date(),
      }
    })
  )

  const activeCount = members.filter((member) => member.isActive).length

  return (
    <main className="min-h-screen bg-white">
      {/* Hero ringkas: navy agar navbar putih tetap terlihat */}
      <section className="relative isolate overflow-hidden bg-linear-to-br from-[#071633] via-[#102b65] to-[#1b3d80]">
        <div className="pointer-events-none absolute -top-32 -right-24 -z-10 size-96 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 size-96 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="mx-auto max-w-7xl pt-28  pb-14 px-6 md:pb-16 lg:px-20">
          <h1 className="mt-4 max-w-3xl tracking-tight text-white text-4xl md:text-5xl">
            Direktori Anggota
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-white/80 text-sm md:text-base">
            Kenali para profesional yang tergabung dalam jaringan kecerdasan
            artifisial ASPROKAI.
          </p>
        </div>
      </section>

      {/* Konten utama putih dan lebih lega */}

      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16 lg:px-20">
        <h2 className="mb-7 text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl">
          Temukan Anggota
        </h2>

        <DirectoryMembers members={members} />
      </section>
    </main>
  )
}
