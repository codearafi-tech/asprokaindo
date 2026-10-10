"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function deleteMember(memberId: string) {
  // ============================================================
  // VALIDASI ID
  // ============================================================

  if (!memberId) {
    return {
      success: false,
      message: "ID anggota tidak valid.",
    }
  }

  // ============================================================
  // CLIENT
  // ============================================================

  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  // ============================================================
  // CEK LOGIN
  // ============================================================

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      message: "Anda harus login terlebih dahulu.",
    }
  }

  // ============================================================
  // CEK ADMIN
  // ============================================================

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (
    adminError ||
    !adminProfile ||
    adminProfile.role !== "admin"
  ) {
    return {
      success: false,
      message: "Anda tidak memiliki akses untuk menghapus anggota.",
    }
  }

  // ============================================================
  // AMBIL DATA MEMBER
  // ============================================================

  const { data: member, error: memberError } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", memberId)
    .single()

  if (memberError || !member) {
    console.error("Member tidak ditemukan:", memberError)

    return {
      success: false,
      message: "Data anggota tidak ditemukan.",
    }
  }

  // ============================================================
  // PASTIKAN BUKAN ADMIN
  // ============================================================

  if (member.role !== "member") {
    return {
      success: false,
      message: "Data ini bukan merupakan anggota.",
    }
  }

  // ============================================================
  // AMBIL DATA FOTO MEMBER
  // ============================================================

  const { data: memberDetails, error: memberDetailsError } =
    await supabaseAdmin
      .from("member_details")
      .select("photo_path")
      .eq("user_id", memberId)
      .maybeSingle()

  if (memberDetailsError) {
    console.error(
      "Gagal mengambil data foto member:",
      memberDetailsError
    )
  }

  // ============================================================
  // HAPUS FOTO MEMBER DARI STORAGE
  // ============================================================

  if (memberDetails?.photo_path) {
    const { error: photoDeleteError } =
      await supabaseAdmin.storage
        .from("member-photos")
        .remove([memberDetails.photo_path])

    if (photoDeleteError) {
      console.error(
        "Gagal menghapus foto member:",
        photoDeleteError
      )

      return {
        success: false,
        message:
          "Gagal menghapus foto anggota. Data anggota tidak jadi dihapus.",
      }
    }
  }

  // ============================================================
  // AMBIL DATA BUKTI PEMBAYARAN
  // ============================================================

  const { data: verificationSubmissions } =
    await supabaseAdmin
      .from("verification_submissions")
      .select("payment_proof_path")
      .eq("user_id", memberId)

  // ============================================================
  // HAPUS BUKTI PEMBAYARAN DARI STORAGE
  // ============================================================

  const paymentProofPaths =
    verificationSubmissions
      ?.map((item) => item.payment_proof_path)
      .filter(
        (path): path is string =>
          Boolean(path)
      ) ?? []

  if (paymentProofPaths.length > 0) {
    const { error: paymentDeleteError } =
      await supabaseAdmin.storage
        .from("verification-documents")
        .remove(paymentProofPaths)

    if (paymentDeleteError) {
      console.error(
        "Gagal menghapus bukti pembayaran:",
        paymentDeleteError
      )

      return {
        success: false,
        message:
          "Gagal menghapus dokumen verifikasi. Data anggota tidak jadi dihapus.",
      }
    }
  }

  // ============================================================
  // HAPUS MEMBER DETAILS
  // ============================================================

  const { error: detailsError } =
    await supabaseAdmin
      .from("member_details")
      .delete()
      .eq("user_id", memberId)

  if (detailsError) {
    console.error(
      "Gagal menghapus member_details:",
      detailsError
    )

    return {
      success: false,
      message: "Gagal menghapus detail anggota.",
    }
  }

  // ============================================================
  // HAPUS DATA VERIFIKASI
  // ============================================================

  const { error: verificationError } =
    await supabaseAdmin
      .from("verification_submissions")
      .delete()
      .eq("user_id", memberId)

  if (verificationError) {
    console.error(
      "Gagal menghapus data verifikasi:",
      verificationError
    )

    return {
      success: false,
      message:
        "Gagal menghapus data verifikasi anggota.",
    }
  }

  // ============================================================
  // HAPUS PROFILE
  // ============================================================

  const { error: profileError } =
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", memberId)

  if (profileError) {
    console.error(
      "Gagal menghapus profile:",
      profileError
    )

    return {
      success: false,
      message:
        "Gagal menghapus data profil anggota.",
    }
  }

  // ============================================================
  // HAPUS AKUN AUTH SUPABASE
  // ============================================================

  const { error: authDeleteError } =
    await supabaseAdmin.auth.admin.deleteUser(
      memberId
    )

  if (authDeleteError) {
    console.error(
      "Gagal menghapus akun Auth:",
      authDeleteError
    )

    return {
      success: false,
      message:
        "Data anggota sudah dihapus, tetapi akun login gagal dihapus. Silakan periksa Supabase Auth.",
    }
  }

  // ============================================================
  // BERHASIL
  // ============================================================

  return {
    success: true,
    message:
      "Data anggota dan akun login berhasil dihapus.",
  }
}