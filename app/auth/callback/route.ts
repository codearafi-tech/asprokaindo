import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get("code")

  // =========================================================
  // 1. CEK CODE OAUTH
  // =========================================================

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_failed`
    )
  }

  const supabase = await createClient()

  // =========================================================
  // 2. EXCHANGE CODE → SESSION
  // =========================================================

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("Exchange Code Error:", exchangeError)

    return NextResponse.redirect(
      `${origin}/login?error=auth_failed`
    )
  }

  // =========================================================
  // 3. AMBIL USER GOOGLE
  // =========================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Get User Error:", userError)

    return NextResponse.redirect(
      `${origin}/login?error=auth_failed`
    )
  }

  console.log("================================")
  console.log("LOGIN DEBUG")
  console.log("Email:", user.email)
  console.log("User ID:", user.id)
  console.log("================================")

  // =========================================================
  // 4. CEK APAKAH EMAIL ADALAH ADMIN
  // =========================================================

  const adminEmails =
    process.env.ADMIN_EMAILS
      ?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? []

  const userEmail = user.email?.toLowerCase() ?? ""

  const isAdmin = adminEmails.includes(userEmail)

  console.log("Is Admin:", isAdmin)

  // =========================================================
  // 5. CARI PROFILE
  // =========================================================

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select(
        `
          id,
          email,
          full_name,
          role,
          verification_status,
          member_number,
          certificate_number,
          registered_at,
          membership_start_date,
          membership_expiry_date
        `
      )
      .eq("id", user.id)
      .maybeSingle()

  console.log("Profile:", profile)
  console.log("Profile Error:", profileError)

  if (profileError) {
    console.error(
      "Gagal mengambil profile:",
      profileError
    )

    return NextResponse.redirect(
      `${origin}/login?error=profile_fetch_failed`
    )
  }

  // =========================================================
  // 6. USER BARU
  // =========================================================

  if (!profile) {
    console.log(
      "Profile belum ditemukan. Membuat profile baru..."
    )

    // =======================================================
    // 6A. ADMIN BARU
    // =======================================================

    if (isAdmin) {
      console.log("EMAIL TERDAFTAR SEBAGAI ADMIN")

      const { data: newAdmin, error: adminInsertError } =
        await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "",
            avatar_url:
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              "",
            role: "admin",
            verification_status: "verified",

            // Admin tidak memiliki nomor anggota
            member_number: null,

            // Admin tidak memiliki nomor sertifikat anggota
            certificate_number: null,

            registered_at: null,
            membership_start_date: null,
            membership_expiry_date: null,
          })
          .select(
            `
              id,
              email,
              full_name,
              role,
              verification_status,
              member_number,
              certificate_number,
              registered_at
            `
          )
          .single()

      console.log("New Admin:", newAdmin)
      console.log(
        "Admin Insert Error:",
        adminInsertError
      )

      if (adminInsertError) {
        console.error(
          "GAGAL MEMBUAT PROFILE ADMIN:",
          adminInsertError
        )

        return NextResponse.redirect(
          `${origin}/login?error=admin_creation_failed`
        )
      }

      console.log("ADMIN BARU → /admin")

      return NextResponse.redirect(
        `${origin}/admin`
      )
    }

    // =======================================================
    // 6B. MEMBER BARU
    // =======================================================

    console.log("USER BARU → MEMBER")

    // =======================================================
    // Waktu registrasi
    // =======================================================

    const registeredAt = new Date().toISOString()

    // =======================================================
    // Buat profile member
    //
    // NOMOR ANGGOTA BELUM DIBUAT DI SINI.
    //
    // Nomor anggota baru dibuat ketika admin menyetujui
    // dokumen verifikasi.
    // =======================================================

    const { data: newProfile, error: insertError } =
      await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "",
          avatar_url:
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            "",
          role: "member",
          verification_status: "pending",

          // Nomor anggota dibuat SETELAH VERIFIKASI
          member_number: null,

          // Nomor sertifikat juga dibuat SETELAH VERIFIKASI
          certificate_number: null,

          // Waktu akun pertama kali terdaftar
          registered_at: registeredAt,

          // Membership belum aktif
          membership_start_date: null,
          membership_expiry_date: null,
        })
        .select(
          `
            id,
            email,
            full_name,
            role,
            verification_status,
            member_number,
            certificate_number,
            registered_at
          `
        )
        .single()

    console.log("New Profile:", newProfile)
    console.log("Insert Error:", insertError)

    if (insertError) {
      console.error(
        "GAGAL MEMBUAT PROFILE:",
        insertError
      )

      return NextResponse.redirect(
        `${origin}/login?error=profile_creation_failed`
      )
    }

    // =======================================================
    // Redirect member baru
    // =======================================================

    const verificationUrl = new URL(
      "/verification",
      origin
    )

    verificationUrl.searchParams.set(
      "registered",
      "1"
    )

    console.log(
      "MEMBER BARU → /verification?registered=1"
    )

    console.log(
      "Member Number:",
      newProfile.member_number
    )

    console.log(
      "Certificate Number:",
      newProfile.certificate_number
    )

    console.log(
      "Registered At:",
      newProfile.registered_at
    )

    return NextResponse.redirect(
      verificationUrl
    )
  }

  // =========================================================
  // 7. USER SUDAH MEMILIKI PROFILE
  // =========================================================

  console.log("Profile sudah ada.")

  console.log(
    "Member Number:",
    profile.member_number
  )

  console.log(
    "Certificate Number:",
    profile.certificate_number
  )

  console.log(
    "Registered At:",
    profile.registered_at
  )

  console.log(
    "Role dari Database:",
    profile.role
  )

  console.log(
    "Verification Status:",
    profile.verification_status
  )

  // =========================================================
  // 8. ADMIN
  // =========================================================

  // Role dari database menjadi sumber utama.
  if (profile.role === "admin") {
    console.log("ADMIN → /admin")

    return NextResponse.redirect(
      `${origin}/admin`
    )
  }

  // =========================================================
  // 9. MEMBER VERIFIED
  // =========================================================

  if (
    profile.role === "member" &&
    profile.verification_status === "verified"
  ) {
    console.log("MEMBER VERIFIED → /dashboard")

    return NextResponse.redirect(
      `${origin}/dashboard`
    )
  }

  // =========================================================
  // 10. MEMBER BELUM VERIFIED
  // =========================================================

  console.log(
    "MEMBER BELUM VERIFIED → /verification"
  )

  return NextResponse.redirect(
    `${origin}/verification`
  )
}