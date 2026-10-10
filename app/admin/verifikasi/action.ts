"use server"

import { createClient } from "@/lib/supabase/server"

// =========================================================
// APPROVE VERIFICATION
// =========================================================

export async function approveVerification(
  id: string
) {
  const supabase = await createClient()

  // =========================================================
  // 1. CEK USER LOGIN
  // =========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // =========================================================
  // 2. CEK APAKAH USER ADALAH ADMIN
  // =========================================================

  const {
    data: adminProfile,
    error: adminProfileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (
    adminProfileError ||
    !adminProfile ||
    adminProfile.role !== "admin"
  ) {
    throw new Error(
      "Anda tidak memiliki akses sebagai admin."
    )
  }

  // =========================================================
  // 3. AMBIL DATA PENGAJUAN
  // =========================================================

  const {
    data: submission,
    error: submissionError,
  } = await supabase
    .from("verification_submissions")
    .select(`
      id,
      user_id,
      amount,
      status
    `)
    .eq("id", id)
    .single()

  if (
    submissionError ||
    !submission
  ) {
    console.error(
      "Submission Error:",
      submissionError
    )

    throw new Error(
      "Pengajuan verifikasi tidak ditemukan."
    )
  }

  // =========================================================
  // 4. CEK STATUS PENGAJUAN
  // =========================================================

  if (
    submission.status === "approved"
  ) {
    throw new Error(
      "Pengajuan ini sudah disetujui sebelumnya."
    )
  }

  if (
    submission.status === "rejected"
  ) {
    throw new Error(
      "Pengajuan ini sudah ditolak sebelumnya."
    )
  }

  // =========================================================
  // 5. AMBIL PROFILE MEMBER
  // =========================================================

  const {
    data: memberProfile,
    error: memberProfileError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      member_number,
      certificate_number
    `)
    .eq(
      "id",
      submission.user_id
    )
    .single()

  if (
    memberProfileError ||
    !memberProfile
  ) {
    console.error(
      "Member Profile Error:",
      memberProfileError
    )

    throw new Error(
      "Data profil anggota tidak ditemukan."
    )
  }

  // =========================================================
  // 6. AMBIL TARIF KEANGGOTAAN AKTIF
  // =========================================================

  const {
    data: membershipFee,
    error: membershipFeeError,
  } = await supabase
    .from("membership_fees")
    .select(`
      id,
      name,
      amount
    `)
    .eq("is_active", true)
    .single()

  if (
    membershipFeeError ||
    !membershipFee
  ) {
    console.error(
      "Membership Fee Error:",
      membershipFeeError
    )

    throw new Error(
      "Tarif keanggotaan aktif belum tersedia."
    )
  }

  // =========================================================
  // 7. VALIDASI NOMINAL PEMBAYARAN
  // =========================================================

  const submittedAmount =
    Number(submission.amount)

  const membershipAmount =
    Number(membershipFee.amount)

  if (
    submittedAmount !==
    membershipAmount
  ) {
    const formattedAmount =
      new Intl.NumberFormat(
        "id-ID"
      ).format(
        membershipAmount
      )

    throw new Error(
      `Nominal pembayaran tidak sesuai. ` +
        `Nominal yang harus dibayar adalah Rp ${formattedAmount}.`
    )
  }

  // =========================================================
  // 8. GENERATE NOMOR ANGGOTA
  // =========================================================

  let memberNumber =
    memberProfile.member_number

  if (!memberNumber) {
    const {
      data: generatedMemberNumber,
      error: memberNumberError,
    } = await supabase.rpc(
      "generate_member_number"
    )

    if (
      memberNumberError ||
      !generatedMemberNumber
    ) {
      console.error(
        "Generate Member Number Error:",
        memberNumberError
      )

      throw new Error(
        "Gagal membuat nomor anggota."
      )
    }

    memberNumber =
      generatedMemberNumber
  }

  // =========================================================
  // 9. GENERATE NOMOR SERTIFIKAT
  // =========================================================

  const certificateNumber =
    memberProfile.certificate_number ||
    `SERT-${memberNumber}`

  // =========================================================
  // 10. TENTUKAN MASA AKTIF MEMBERSHIP
  //
  // Mulai    = waktu approval
  // Berakhir = +12 bulan
  // =========================================================

  const membershipStartDate =
    new Date()

  const membershipExpiryDate =
    new Date(
      membershipStartDate
    )

  membershipExpiryDate.setFullYear(
    membershipExpiryDate.getFullYear() +
      1
  )

  // =========================================================
  // 11. CEK TRANSAKSI KEUANGAN
  //
  // Ini penting supaya approval tidak membuat
  // transaksi pemasukan ganda.
  // =========================================================

  const {
    data: existingTransaction,
    error: existingTransactionError,
  } = await supabase
    .from(
      "financial_transactions"
    )
    .select("id")
    .eq(
      "reference_id",
      id
    )
    .eq(
      "reference_type",
      "verification_submission"
    )
    .maybeSingle()

  if (
    existingTransactionError
  ) {
    console.error(
      "Existing Transaction Check Error:",
      existingTransactionError
    )

    throw new Error(
      "Gagal memeriksa transaksi keuangan."
    )
  }

  // =========================================================
  // 12. UPDATE PROFILE MEMBER
  // =========================================================

  const {
    error: profileUpdateError,
  } = await supabase
    .from("profiles")
    .update({
      verification_status:
        "verified",

      member_number:
        memberNumber,

      certificate_number:
        certificateNumber,

      membership_start_date:
        membershipStartDate.toISOString(),

      membership_expiry_date:
        membershipExpiryDate.toISOString(),
    })
    .eq(
      "id",
      submission.user_id
    )

  if (profileUpdateError) {
    console.error(
      "Profile Update Error:",
      profileUpdateError
    )

    throw new Error(
      "Gagal mengaktifkan keanggotaan: " +
        profileUpdateError.message
    )
  }

  // =========================================================
  // 13. UPDATE STATUS PENGAJUAN
  // =========================================================

  const {
    error: submissionUpdateError,
  } = await supabase
    .from(
      "verification_submissions"
    )
    .update({
      status: "approved",

      reviewed_by:
        user.id,

      reviewed_at:
        membershipStartDate.toISOString(),

      admin_note: null,
    })
    .eq(
      "id",
      id
    )

  if (
    submissionUpdateError
  ) {
    console.error(
      "Submission Update Error:",
      submissionUpdateError
    )

    throw new Error(
      "Membership berhasil diaktifkan, tetapi status pengajuan gagal diperbarui: " +
        submissionUpdateError.message
    )
  }

  // =========================================================
  // 14. BUAT TRANSAKSI PEMASUKAN
  // =========================================================

  if (!existingTransaction) {
    const {
      error: transactionError,
    } = await supabase
      .from(
        "financial_transactions"
      )
      .insert({
        user_id:
          submission.user_id,

        type:
          "income",

        category:
          "membership",

        description:
          `Biaya pendaftaran anggota - ${
            memberProfile.full_name ||
            "Anggota"
          }`,

        notes:
          `Pembayaran keanggotaan dengan nomor anggota ${memberNumber}.`,

        amount:
          membershipAmount,

        transaction_date:
          membershipStartDate
            .toISOString()
            .split("T")[0],

        reference_id:
          id,

        reference_type:
          "verification_submission",

        created_by:
          user.id,
      })

    if (
      transactionError
    ) {
      console.error(
        "Financial Transaction Error:",
        transactionError
      )

      throw new Error(
        "Anggota berhasil diverifikasi, tetapi transaksi keuangan gagal dibuat: " +
          transactionError.message
      )
    }
  }

  // =========================================================
  // 15. RETURN HASIL
  // =========================================================

  return {
    success: true,

    memberNumber,

    certificateNumber,

    membershipStartDate:
      membershipStartDate.toISOString(),

    membershipExpiryDate:
      membershipExpiryDate.toISOString(),

    financialAmount:
      membershipAmount,
  }
}


// =========================================================
// REJECT VERIFICATION
// =========================================================

export async function rejectVerification(
  id: string,
  reason: string
) {
  const supabase = await createClient()

  // =========================================================
  // 1. CEK USER LOGIN
  // =========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // =========================================================
  // 2. CEK APAKAH USER ADALAH ADMIN
  // =========================================================

  const {
    data: adminProfile,
    error: adminProfileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (
    adminProfileError ||
    !adminProfile ||
    adminProfile.role !== "admin"
  ) {
    throw new Error(
      "Anda tidak memiliki akses sebagai admin."
    )
  }

  // =========================================================
  // 3. VALIDASI ALASAN PENOLAKAN
  // =========================================================

  const rejectionReason =
    reason.trim()

  if (!rejectionReason) {
    throw new Error(
      "Alasan penolakan wajib diisi."
    )
  }

  // =========================================================
  // 4. AMBIL DATA PENGAJUAN
  // =========================================================

  const {
    data: submission,
    error: submissionError,
  } = await supabase
    .from(
      "verification_submissions"
    )
    .select(`
      id,
      user_id,
      status
    `)
    .eq(
      "id",
      id
    )
    .single()

  if (
    submissionError ||
    !submission
  ) {
    console.error(
      "Submission Error:",
      submissionError
    )

    throw new Error(
      "Pengajuan verifikasi tidak ditemukan."
    )
  }

  // =========================================================
  // 5. CEK APAKAH SUDAH DIPROSES
  // =========================================================

  if (
    submission.status === "approved"
  ) {
    throw new Error(
      "Pengajuan ini sudah disetujui dan tidak dapat ditolak."
    )
  }

  if (
    submission.status === "rejected"
  ) {
    throw new Error(
      "Pengajuan ini sudah ditolak sebelumnya."
    )
  }

  // =========================================================
  // 6. UPDATE STATUS VERIFIKASI
  // =========================================================

  const {
    error: submissionUpdateError,
  } = await supabase
    .from(
      "verification_submissions"
    )
    .update({
      status:
        "rejected",

      reviewed_by:
        user.id,

      reviewed_at:
        new Date().toISOString(),

      admin_note:
        rejectionReason,
    })
    .eq(
      "id",
      id
    )

  if (
    submissionUpdateError
  ) {
    console.error(
      "Submission Update Error:",
      submissionUpdateError
    )

    throw new Error(
      "Gagal menolak pengajuan: " +
        submissionUpdateError.message
    )
  }

  // =========================================================
  // 7. UPDATE STATUS PROFILE MEMBER
  // =========================================================

  const {
    error: profileUpdateError,
  } = await supabase
    .from("profiles")
    .update({
      verification_status:
        "pending",
    })
    .eq(
      "id",
      submission.user_id
    )

  if (profileUpdateError) {
    console.error(
      "Profile Update Error:",
      profileUpdateError
    )

    throw new Error(
      "Pengajuan ditolak, tetapi status profile gagal diperbarui: " +
        profileUpdateError.message
    )
  }

  // =========================================================
  // 8. RETURN HASIL
  // =========================================================

  return {
    success: true,
  }
}