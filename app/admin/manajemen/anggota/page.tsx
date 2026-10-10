import { createClient } from "@/lib/supabase/server"
import MemberTable from "./member-table"

export default async function ManajemenAnggotaPage() {
  const supabase = await createClient()

  // ============================================================
  // AMBIL DATA PROFILE MEMBER YANG SUDAH TERVERIFIKASI
  // ============================================================

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      role,
      member_number,
      certificate_number,
      verification_status,
      registered_at,
      membership_start_date,
      membership_expiry_date
    `)
    .eq("verification_status", "verified")
    .eq("role", "member")
    .order("registered_at", { ascending: false })

  if (profilesError) {
    console.error(
      "Gagal mengambil data anggota:",
      profilesError
    )
  }

  // ============================================================
  // AMBIL ID PROFILE
  // ============================================================

  const profileIds =
    profiles?.map((profile) => profile.id) ?? []

  // ============================================================
  // AMBIL MEMBER DETAILS
  // ============================================================

  const {
    data: memberDetails,
    error: memberDetailsError,
  } =
    profileIds.length > 0
      ? await supabase
          .from("member_details")
          .select(`
            user_id,
            full_name,
            institution_name,
            position,
            photo_path
          `)
          .in("user_id", profileIds)
      : {
          data: [],
          error: null,
        }

  if (memberDetailsError) {
    console.error(
      "Gagal mengambil detail anggota:",
      memberDetailsError
    )
  }

  // ============================================================
  // BUAT MAP MEMBER DETAILS
  // ============================================================

  const detailsMap = new Map(
    (memberDetails ?? []).map((detail) => [
      detail.user_id,
      detail,
    ])
  )

  // ============================================================
  // GABUNGKAN DATA PROFILE + MEMBER DETAILS
  // ============================================================

  const members = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      const detail = detailsMap.get(profile.id)

      // --------------------------------------------------------
      // BUAT SIGNED URL FOTO
      // --------------------------------------------------------

      let photoUrl: string | null = null

      if (detail?.photo_path) {
        const { data, error } =
          await supabase.storage
            .from("member-photos")
            .createSignedUrl(
              detail.photo_path,
              60 * 60
            )

        if (error) {
          console.error(
            "Gagal membuat signed URL foto:",
            detail.photo_path,
            error
          )
        } else {
          photoUrl = data?.signedUrl ?? null
        }
      }

      // --------------------------------------------------------
      // RETURN DATA MEMBER
      // --------------------------------------------------------

      return {
        id: profile.id,

        name:
          detail?.full_name ||
          profile.full_name ||
          "Tanpa Nama",

        email:
          profile.email || "-",

        memberNumber:
          profile.member_number,

        certificateNumber:
          profile.certificate_number,

        institution:
          detail?.institution_name || "-",

        position:
          detail?.position || "-",

        photoUrl,

        registeredAt:
          profile.registered_at,

        membershipStartDate:
          profile.membership_start_date,

        membershipExpiryDate:
          profile.membership_expiry_date,
      }
    })
  )

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="w-full space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Manajemen Anggota
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Kelola data anggota yang telah terverifikasi.
        </p>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <MemberTable members={members} />
    </div>
  )
}