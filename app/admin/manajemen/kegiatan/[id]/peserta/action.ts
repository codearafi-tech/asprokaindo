"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ActionResult = {
  success: boolean
  message: string
}

type IssueCertificateResult = ActionResult & {
  issuedCount?: number
}

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      user: null,
      error: "Silakan login terlebih dahulu.",
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    return {
      supabase,
      user: null,
      error: "Akses ditolak. Hanya admin yang dapat melakukan tindakan ini.",
    }
  }

  return {
    supabase,
    user,
    error: null,
  }
}

function revalidateParticipantPages(activityId: string) {
  revalidatePath(`/admin/manajemen/kegiatan/${activityId}/peserta`)
  revalidatePath("/admin/manajemen/kegiatan")
  revalidatePath("/dashboard/kegiatan")
  revalidatePath(`/dashboard/kegiatan/${activityId}`)
  revalidatePath("/dashboard/sertifikat")
}

// ============================================================
// HAPUS PESERTA
// Peserta yang sudah memiliki sertifikat tidak dapat dihapus.
// ============================================================

export async function deleteParticipant(
  registrationId: string
): Promise<ActionResult> {
  const { supabase, user, error: authError } = await requireAdmin()

  if (!user) {
    return {
      success: false,
      message: authError ?? "Akses ditolak.",
    }
  }

  const { data: registration, error: fetchError } = await supabase
    .from("activity_registrations")
    .select("id, activity_id")
    .eq("id", registrationId)
    .maybeSingle()

  if (fetchError || !registration) {
    return {
      success: false,
      message: "Data pendaftaran tidak ditemukan.",
    }
  }

  const { data: existingCertificate, error: certificateError } = await supabase
    .from("activity_certificates")
    .select("id")
    .eq("registration_id", registrationId)
    .maybeSingle()

  if (certificateError) {
    console.error("Gagal memeriksa sertifikat:", certificateError)

    return {
      success: false,
      message: "Sertifikat gagal diperiksa. Peserta tidak dihapus.",
    }
  }

  if (existingCertificate) {
    return {
      success: false,
      message:
        "Peserta sudah memiliki sertifikat. Pendaftaran tidak dapat dihapus agar riwayat sertifikat tetap terjaga.",
    }
  }

  const { error: deleteError } = await supabase
    .from("activity_registrations")
    .delete()
    .eq("id", registrationId)

  if (deleteError) {
    console.error("Gagal menghapus peserta:", deleteError)

    return {
      success: false,
      message:
        "Pendaftaran gagal dihapus. Periksa relasi dan kebijakan database.",
    }
  }

  revalidateParticipantPages(registration.activity_id)

  return {
    success: true,
    message: "Pendaftaran peserta berhasil dihapus.",
  }
}

// ============================================================
// MENYETUJUI BUKTI KEHADIRAN
// ============================================================

export async function approveAttendanceProof(
  registrationId: string
): Promise<ActionResult> {
  const { supabase, user, error: authError } = await requireAdmin()

  if (!user) {
    return {
      success: false,
      message: authError ?? "Akses ditolak.",
    }
  }

  const { data: registration, error: fetchError } = await supabase
    .from("activity_registrations")
    .select("id, activity_id, attendance_proof_path, attendance_proof_status")
    .eq("id", registrationId)
    .maybeSingle()

  if (fetchError || !registration) {
    return {
      success: false,
      message: "Data pendaftaran tidak ditemukan.",
    }
  }

  if (
    !registration.attendance_proof_path ||
    registration.attendance_proof_status !== "pending"
  ) {
    return {
      success: false,
      message: "Bukti tidak tersedia atau sudah direview.",
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("activity_registrations")
    .update({
      attendance_proof_status: "approved",
      attendance_proof_reviewed_at: new Date().toISOString(),
      attendance_proof_reviewed_by: user.id,
      attendance_proof_admin_note: null,
    })
    .eq("id", registrationId)
    .eq("attendance_proof_status", "pending")
    .select("id")
    .maybeSingle()

  if (updateError || !updated) {
    console.error("Gagal menyetujui bukti kehadiran:", updateError)

    return {
      success: false,
      message:
        "Bukti gagal disetujui. Silakan muat ulang halaman dan coba kembali.",
    }
  }

  revalidateParticipantPages(registration.activity_id)

  return {
    success: true,
    message: "Bukti daftar hadir berhasil disetujui.",
  }
}

// ============================================================
// MENOLAK BUKTI KEHADIRAN
// ============================================================

export async function rejectAttendanceProof(
  registrationId: string,
  note: string
): Promise<ActionResult> {
  const { supabase, user, error: authError } = await requireAdmin()

  if (!user) {
    return {
      success: false,
      message: authError ?? "Akses ditolak.",
    }
  }

  if (!note.trim()) {
    return {
      success: false,
      message: "Catatan penolakan wajib diisi.",
    }
  }

  const { data: registration, error: fetchError } = await supabase
    .from("activity_registrations")
    .select("id, activity_id, attendance_proof_path, attendance_proof_status")
    .eq("id", registrationId)
    .maybeSingle()

  if (fetchError || !registration) {
    return {
      success: false,
      message: "Data pendaftaran tidak ditemukan.",
    }
  }

  if (
    !registration.attendance_proof_path ||
    registration.attendance_proof_status !== "pending"
  ) {
    return {
      success: false,
      message: "Bukti tidak tersedia atau sudah direview.",
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("activity_registrations")
    .update({
      attendance_proof_status: "rejected",
      attendance_proof_admin_note: note.trim(),
      attendance_proof_reviewed_at: new Date().toISOString(),
      attendance_proof_reviewed_by: user.id,
    })
    .eq("id", registrationId)
    .eq("attendance_proof_status", "pending")
    .select("id")
    .maybeSingle()

  if (updateError || !updated) {
    console.error("Gagal menolak bukti kehadiran:", updateError)

    return {
      success: false,
      message:
        "Bukti gagal ditolak. Silakan muat ulang halaman dan coba kembali.",
    }
  }

  revalidateParticipantPages(registration.activity_id)

  return {
    success: true,
    message: "Bukti daftar hadir berhasil ditolak.",
  }
}

// ============================================================
// MENERBITKAN SERTIFIKAT KEGIATAN
//
// Ketentuan:
// 1. Hanya admin.
// 2. Kegiatan harus berstatus completed.
// 3. Seluruh peserta non-cancelled harus sudah memiliki
//    keputusan kehadiran final.
// 4. Hanya peserta approved yang mendapatkan sertifikat.
// 5. Sertifikat yang sudah ada tidak diterbitkan ulang.
// 6. Snapshot data disimpan pada saat penerbitan.
// ============================================================

export async function issueActivityCertificates(
  activityId: string
): Promise<IssueCertificateResult> {
  const { supabase, user, error: authError } = await requireAdmin()

  if (!user) {
    return {
      success: false,
      message: authError ?? "Akses ditolak.",
    }
  }

  // ----------------------------------------------------------
  // 1. Ambil data kegiatan
  // ----------------------------------------------------------

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("id, title, status, organizer, certificate_title, start_at")
    .eq("id", activityId)
    .maybeSingle()

  if (activityError || !activity) {
    console.error("Gagal mengambil kegiatan:", activityError)

    return {
      success: false,
      message: "Data kegiatan tidak ditemukan.",
    }
  }

  if (activity.status !== "completed") {
    return {
      success: false,
      message:
        "Sertifikat hanya dapat diterbitkan setelah kegiatan berstatus Selesai.",
    }
  }

  if (!activity.organizer?.trim() || !activity.certificate_title?.trim()) {
    return {
      success: false,
      message:
        "Lengkapi penyelenggara dan judul sertifikat pada data kegiatan.",
    }
  }

  // ----------------------------------------------------------
  // 2. Ambil peserta yang tidak dibatalkan
  // ----------------------------------------------------------

  const { data: registrations, error: registrationsError } = await supabase
    .from("activity_registrations")
    .select(
      "id, activity_id, user_id, full_name, status, attendance_proof_status"
    )
    .eq("activity_id", activityId)
    .neq("status", "cancelled")

  if (registrationsError) {
    console.error("Gagal mengambil peserta:", registrationsError)

    return {
      success: false,
      message: "Gagal memeriksa daftar peserta.",
    }
  }

  const participants = registrations ?? []

  if (participants.length === 0) {
    return {
      success: false,
      message: "Belum ada peserta pada kegiatan ini.",
    }
  }

  // ----------------------------------------------------------
  // 3. Pastikan keputusan kehadiran sudah final
  //
  // pending, null, dan belum mengirim bukti masih dianggap
  // belum final. rejected dianggap keputusan final di sini.
  // Jika peserta masih boleh mengirim ulang bukti yang ditolak,
  // jangan terbitkan sampai proses tersebut diselesaikan.
  // ----------------------------------------------------------

  const unresolvedCount = participants.filter((participant) => {
    return (
      participant.attendance_proof_status !== "approved" &&
      participant.attendance_proof_status !== "rejected"
    )
  }).length

  if (unresolvedCount > 0) {
    return {
      success: false,
      message:
        `${unresolvedCount} peserta belum memiliki keputusan akhir kehadiran. ` +
        "Selesaikan verifikasi sebelum menerbitkan sertifikat.",
    }
  }

  const eligibleParticipants = participants.filter(
    (participant) => participant.attendance_proof_status === "approved"
  )

  if (eligibleParticipants.length === 0) {
    return {
      success: false,
      message:
        "Tidak ada peserta dengan kehadiran yang disetujui untuk menerima sertifikat.",
    }
  }

  // Pastikan data yang dibutuhkan untuk sertifikat tersedia.
  const missingName = eligibleParticipants.some(
    (participant) => !participant.full_name?.trim()
  )

  if (missingName) {
    return {
      success: false,
      message:
        "Ada peserta yang belum memiliki nama lengkap pada data pendaftaran.",
    }
  }

  const missingUser = eligibleParticipants.some(
    (participant) => !participant.user_id
  )

  if (missingUser) {
    return {
      success: false,
      message:
        "Ada peserta yang belum memiliki user_id. Periksa data pendaftarannya.",
    }
  }

  // ----------------------------------------------------------
  // 4. Ambil sertifikat yang sudah pernah diterbitkan
  // ----------------------------------------------------------

  const { data: existingCertificates, error: existingError } = await supabase
    .from("activity_certificates")
    .select("registration_id")
    .eq("activity_id", activityId)

  if (existingError) {
    console.error("Gagal memeriksa sertifikat:", existingError)

    return {
      success: false,
      message: "Gagal memeriksa sertifikat yang sudah tersimpan.",
    }
  }

  const existingRegistrationIds = new Set(
    (existingCertificates ?? []).map(
      (certificate) => certificate.registration_id
    )
  )

  const participantsToIssue = eligibleParticipants.filter(
    (participant) => !existingRegistrationIds.has(participant.id)
  )

  if (participantsToIssue.length === 0) {
    revalidateParticipantPages(activityId)

    return {
      success: true,
      message:
        "Semua peserta yang memenuhi syarat sudah memiliki sertifikat. Tidak ada sertifikat duplikat yang dibuat.",
      issuedCount: 0,
    }
  }

  // ----------------------------------------------------------
  // 5. Buat nomor sertifikat dan snapshot
  // ----------------------------------------------------------

  const currentYear = new Date().getFullYear()

  const certificateRows = participantsToIssue.map((participant) => ({
    registration_id: participant.id,
    activity_id: participant.activity_id,
    user_id: participant.user_id,

    certificate_number: `ASPROKA-${currentYear}-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)
      .toUpperCase()}`,

    // Snapshot agar isi sertifikat tidak berubah jika
    // nama peserta atau data kegiatan diedit setelah terbit.
    participant_name: participant.full_name!.trim(),
    activity_title: activity.title,
    certificate_title: activity.certificate_title,
    organizer: activity.organizer,
    activity_start_at: activity.start_at,
  }))

  // ----------------------------------------------------------
  // 6. Simpan sertifikat
  //
  // registration_id memiliki UNIQUE constraint pada database.
  // ignoreDuplicates membantu mencegah duplikasi saat proses
  // penerbitan dipanggil berulang.
  // ----------------------------------------------------------

  const { data: insertedCertificates, error: insertError } = await supabase
    .from("activity_certificates")
    .upsert(certificateRows, {
      onConflict: "registration_id",
      ignoreDuplicates: true,
    })
    .select("id")

  if (insertError) {
    console.error("Gagal menerbitkan sertifikat:", insertError)

    return {
      success: false,
      message:
        "Sertifikat gagal diterbitkan. Periksa kolom snapshot, kebijakan RLS, dan relasi database.",
    }
  }

  revalidateParticipantPages(activityId)

  return {
    success: true,
    message: "Proses penerbitan sertifikat selesai.",
    issuedCount: insertedCertificates?.length ?? 0,
  }
}
