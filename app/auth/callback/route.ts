import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  // =========================================================
  // 1. VALIDASI OAUTH CODE
  // =========================================================

  if (!code) {
    console.error("OAuth callback gagal: authorization code tidak ditemukan.")

    return NextResponse.redirect(
      new URL("/login?error=auth_failed", origin)
    )
  }

  const supabase = await createClient()

  // =========================================================
  // 2. TUKAR OAUTH CODE DENGAN SESSION
  // =========================================================

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("Exchange Code Error:", exchangeError)

    return NextResponse.redirect(
      new URL("/login?error=auth_failed", origin)
    )
  }

  // =========================================================
  // 3. AMBIL DATA USER YANG LOGIN
  // =========================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Get User Error:", userError)

    return NextResponse.redirect(
      new URL("/login?error=auth_failed", origin)
    )
  }

  console.log("========== OAUTH CALLBACK ==========")
  console.log("User ID:", user.id)
  console.log("Email:", user.email)

  // =========================================================
  // 4. CEK EMAIL ADMIN
  // =========================================================

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? []

  const userEmail = user.email?.trim().toLowerCase() ?? ""
  const isAdmin = Boolean(userEmail && adminEmails.includes(userEmail))

  console.log("Is Admin Email:", isAdmin)

  // =========================================================
  // 5. AMBIL PROFILE DARI DATABASE
  // =========================================================

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
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
    `)
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("Gagal mengambil profile:", profileError)

    return NextResponse.redirect(
      new URL("/login?error=profile_fetch_failed", origin)
    )
  }

  console.log("Profile ditemukan:", Boolean(profile))
  console.log("Profile Role:", profile?.role ?? "belum ada")
  console.log(
    "Verification Status:",
    profile?.verification_status ?? "belum ada"
  )

  // =========================================================
  // 6. BUAT PROFILE JIKA USER BARU
  // =========================================================

  if (!profile) {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      ""

    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      ""

    // -------------------------------------------------------
    // 6A. ADMIN BARU
    // -------------------------------------------------------

    if (isAdmin) {
      console.log("Membuat profile admin baru...")

      const { error: adminInsertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: avatarUrl,
          role: "admin",
          verification_status: "verified",

          // Admin tidak memiliki nomor anggota.
          member_number: null,
          certificate_number: null,

          // Masa keanggotaan tidak berlaku untuk admin.
          registered_at: null,
          membership_start_date: null,
          membership_expiry_date: null,
        })

      if (adminInsertError) {
        console.error(
          "Gagal membuat profile admin:",
          adminInsertError
        )

        return NextResponse.redirect(
          new URL("/login?error=admin_creation_failed", origin)
        )
      }

      console.log("Admin baru berhasil dibuat.")

      return NextResponse.redirect(new URL("/admin", origin))
    }

    // -------------------------------------------------------
    // 6B. MEMBER BARU
    // -------------------------------------------------------

    console.log("Membuat profile member baru...")

    const registeredAt = new Date().toISOString()

    const { error: memberInsertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        role: "member",
        verification_status: "pending",

        // Nomor dibuat setelah admin menyetujui verifikasi.
        member_number: null,
        certificate_number: null,

        // Tanggal registrasi pertama.
        registered_at: registeredAt,

        // Masa keanggotaan belum aktif.
        membership_start_date: null,
        membership_expiry_date: null,
      })

    if (memberInsertError) {
      console.error(
        "Gagal membuat profile member:",
        memberInsertError
      )

      return NextResponse.redirect(
        new URL("/login?error=profile_creation_failed", origin)
      )
    }

    console.log("Profile member baru berhasil dibuat.")
    console.log("Registered At:", registeredAt)

    // Arahkan member baru ke halaman verifikasi.
    // Parameter registered=1 digunakan untuk membuka dialog.
    const verificationUrl = new URL("/verification", origin)

    verificationUrl.searchParams.set("registered", "1")

    return NextResponse.redirect(verificationUrl)
  }

  // =========================================================
  // 7. PROFILE SUDAH ADA: TENTUKAN TUJUAN REDIRECT
  // =========================================================

  console.log("Profile sudah tersedia.")
  console.log("Role:", profile.role)
  console.log("Verification Status:", profile.verification_status)

  // ---------------------------------------------------------
  // 7A. ADMIN
  // ---------------------------------------------------------

  if (profile.role === "admin") {
    console.log("ADMIN → /admin")

    return NextResponse.redirect(new URL("/admin", origin))
  }

  // ---------------------------------------------------------
  // 7B. EMAIL ADMIN TETAPI PROFILE BELUM BERROLE ADMIN
  // ---------------------------------------------------------
  //
  // Jangan langsung memberikan akses admin hanya berdasarkan
  // email apabila role database masih member.
  //
  // Sinkronkan role admin melalui proses administrasi yang
  // tepercaya jika email ini memang harus menjadi admin.

  if (isAdmin && profile.role !== "admin") {
    console.error(
      "Email terdaftar sebagai admin, tetapi role profile bukan admin.",
      {
        userId: user.id,
        role: profile.role,
      }
    )

    return NextResponse.redirect(
      new URL("/login?error=role_mismatch", origin)
    )
  }

  // ---------------------------------------------------------
  // 7C. MEMBER SUDAH TERVERIFIKASI
  // ---------------------------------------------------------

  if (
    profile.role === "member" &&
    profile.verification_status === "verified"
  ) {
    console.log("MEMBER VERIFIED → /dashboard")

    return NextResponse.redirect(
      new URL("/dashboard", origin)
    )
  }

  // ---------------------------------------------------------
  // 7D. MEMBER BELUM TERVERIFIKASI
  // ---------------------------------------------------------

  if (profile.role === "member") {
    console.log("MEMBER BELUM VERIFIED → /verification")

    return NextResponse.redirect(
      new URL("/verification", origin)
    )
  }

  // =========================================================
  // 8. ROLE TIDAK DIKENALI
  // =========================================================

  console.error("Role profile tidak dikenali:", profile.role)

  return NextResponse.redirect(
    new URL("/login?error=invalid_role", origin)
  )
}
