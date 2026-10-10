import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

import { MemberCard } from "@/components/ui/member-card"

export default async function KartuAnggotaPage() {
  const supabase = await createClient()

  // =========================================================
  // AUTH
  // =========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // =========================================================
  // PROFILE
  // =========================================================

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select(
        `
          id,
          full_name,
          email,
          role,
          verification_status,
          member_number,
          certificate_number,
          membership_start_date,
          membership_expiry_date
        `,
      )
      .eq("id", user.id)
      .single()

  if (profileError || !profile) {
    redirect("/dashboard")
  }

  // =========================================================
  // MEMBER ONLY
  // =========================================================

  if (
    profile.role !== "member" ||
    profile.verification_status !== "verified"
  ) {
    redirect("/verification")
  }

  // =========================================================
  // MEMBER DETAILS
  // =========================================================

  const { data: memberDetails } =
    await supabase
      .from("member_details")
      .select(
        `
          full_name,
          title_prefix,
          title_suffix,
          occupation,
          institution_name,
          position,
          photo_path
        `,
      )
      .eq("user_id", user.id)
      .maybeSingle()

  // =========================================================
  // PHOTO
  // =========================================================

  let photoUrl: string | null = null

  if (memberDetails?.photo_path) {
    const { data } =
      await supabase.storage
        .from("member-photos")
        .createSignedUrl(
          memberDetails.photo_path,
          60 * 60,
        )

    photoUrl =
      data?.signedUrl ?? null
  }

  // =========================================================
  // MEMBER NAME
  // =========================================================

  const memberName =
    memberDetails?.full_name ||
    profile.full_name ||
    "Nama Anggota"

  const fullName = [
    memberDetails?.title_prefix,
    memberName,
    memberDetails?.title_suffix,
  ]
    .filter(Boolean)
    .join(" ")

  // =========================================================
  // POSITION
  // =========================================================

  const position =
    memberDetails?.position ||
    memberDetails?.occupation ||
    "Anggota ASPROKAINDO"

  // =========================================================
  // MEMBER NUMBER
  // =========================================================

  if (!profile.member_number) {
    redirect("/dashboard")
  }

  // =========================================================
  // PUBLIC VERIFICATION URL
  // =========================================================
  //
  // Kalau domain verifikasi kamu masih menggunakan Base44,
  // kita pertahankan URL yang sekarang.
  //
  // Nanti kalau halaman /verifikasi sudah dipindahkan
  // ke Next.js ini, URL cukup diganti di sini.
  // =========================================================

  const verificationUrl =
    `https://asprokaindonesia.base44.app/verifikasi` +
    `?no=${encodeURIComponent(
      profile.member_number,
    )}`

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="space-y-8">

      {/* =======================================================
          PAGE HEADER
      ======================================================= */}

      <div>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Kartu Anggota
        </h1>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          Kartu identitas resmi anggota ASPROKAINDO.
          Klik kartu untuk melihat sisi belakang dan
          QR Code verifikasi.
        </p>

      </div>

      {/* =======================================================
          CARD SECTION
      ======================================================= */}

      <div className="rounded-2xl border bg-muted/20 p-4 sm:p-8">

        <MemberCard
          fullName={fullName}
          position={position}
          photoUrl={photoUrl}
          memberNumber={profile.member_number}
          membershipExpiryDate={
            profile.membership_expiry_date
          }
          verificationUrl={verificationUrl}
        />

      </div>

    </div>
  )
}