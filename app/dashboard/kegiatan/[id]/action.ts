"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

function getExtension(type: string) {
  if (type === "image/jpeg") return "jpg"
  if (type === "image/png") return "png"
  return "webp"
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

export async function registerForActivity(
  activityId: string,
  formData: FormData
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const fullName = String(formData.get("full_name") ?? "").trim()
  const memberNumber = String(formData.get("member_number") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const paymentFile = formData.get("payment_proof")

  if (!fullName || !memberNumber || !phone) {
    redirect(`/dashboard/kegiatan/${activityId}?error=required`)
  }

  if (fullName.length > 150 || memberNumber.length > 100 || phone.length > 30) {
    redirect(`/dashboard/kegiatan/${activityId}?error=invalid`)
  }

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("id, status, is_paid, registration_start_at, registration_end_at")
    .eq("id", activityId)
    .eq("status", "published")
    .maybeSingle()

  if (activityError || !activity) {
    redirect("/dashboard/kegiatan?error=activity")
  }

  const now = Date.now()

  if (
    activity.registration_start_at &&
    now < new Date(activity.registration_start_at).getTime()
  ) {
    redirect(`/dashboard/kegiatan/${activityId}?error=not_open`)
  }

  if (
    activity.registration_end_at &&
    now > new Date(activity.registration_end_at).getTime()
  ) {
    redirect(`/dashboard/kegiatan/${activityId}?error=closed`)
  }

  // Bukti pembayaran wajib jika kegiatan berbayar.
  if (activity.is_paid) {
    if (!(paymentFile instanceof File) || paymentFile.size === 0) {
      redirect(`/dashboard/kegiatan/${activityId}?error=payment_file`)
    }

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(paymentFile.type) ||
      paymentFile.size > 5 * 1024 * 1024
    ) {
      redirect(`/dashboard/kegiatan/${activityId}?error=payment_invalid`)
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from("activity_registrations")
    .select("id")
    .eq("activity_id", activityId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingError) {
    redirect(`/dashboard/kegiatan/${activityId}?error=database`)
  }

  if (existing) {
    redirect(`/dashboard/kegiatan/${activityId}?registered=1`)
  }

  // Upload bukti terlebih dahulu jika kegiatan berbayar.
  let paymentProofPath: string | null = null

  if (activity.is_paid && paymentFile instanceof File) {
    const extension =
      paymentFile.type === "image/jpeg"
        ? "jpg"
        : paymentFile.type === "image/png"
          ? "png"
          : "webp"

    paymentProofPath = `${user.id}/${activityId}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from("activity-payment-proofs")
      .upload(paymentProofPath, paymentFile, {
        contentType: paymentFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Gagal upload bukti pembayaran:", uploadError.message)
      redirect(`/dashboard/kegiatan/${activityId}?error=payment_upload`)
    }
  }

  const { error: insertError } = await supabase
    .from("activity_registrations")
    .insert({
      activity_id: activityId,
      user_id: user.id,
      full_name: fullName,
      member_number: memberNumber,
      phone,
      email: user.email ?? "",
      status: "registered",
      attendance_status: "registered",
      proof_path: paymentProofPath,
      proof_status: activity.is_paid ? "pending" : "not_submitted",
      registered_at: new Date().toISOString(),
    })

  if (insertError) {
    console.error("Gagal menyimpan pendaftaran:", insertError.message)

    // Bersihkan file jika pendaftaran gagal disimpan.
    if (paymentProofPath) {
      await supabase.storage
        .from("activity-payment-proofs")
        .remove([paymentProofPath])
    }

    if (insertError.code === "23505") {
      redirect(`/dashboard/kegiatan/${activityId}?registered=1`)
    }

    redirect(`/dashboard/kegiatan/${activityId}?error=registration`)
  }

  revalidatePath("/dashboard/kegiatan")
  revalidatePath(`/dashboard/kegiatan/${activityId}`)
  revalidatePath(`/admin/manajemen/kegiatan/${activityId}/peserta`)

  redirect(`/dashboard/kegiatan/${activityId}?registered=1`)
}

export async function submitPaymentProof(
  activityId: string,
  formData: FormData
) {
  const { supabase, user } = await getAuthenticatedUser()

  if (!user) redirect("/login")

  const file = formData.get("payment_proof")

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/dashboard/kegiatan/${activityId}?error=payment_file`)
  }

  if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
    redirect(`/dashboard/kegiatan/${activityId}?error=payment_invalid`)
  }

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("id, is_paid, status")
    .eq("id", activityId)
    .eq("status", "published")
    .maybeSingle()

  if (activityError || !activity) {
    redirect("/dashboard/kegiatan?error=activity")
  }

  if (!activity.is_paid) {
    redirect(`/dashboard/kegiatan/${activityId}`)
  }

  const { data: registration, error: registrationError } = await supabase
    .from("activity_registrations")
    .select("id, status, proof_status")
    .eq("activity_id", activityId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (
    registrationError ||
    !registration ||
    registration.status !== "registered"
  ) {
    redirect(`/dashboard/kegiatan/${activityId}?error=registration`)
  }

  if (registration.proof_status === "approved") {
    redirect(`/dashboard/kegiatan/${activityId}?payment=approved`)
  }

  const extension = getExtension(file.type)
  const filePath = `${user.id}/${registration.id}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from("activity-payment-proofs")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error("Gagal upload bukti pembayaran:", uploadError.message)
    redirect(`/dashboard/kegiatan/${activityId}?error=payment_upload`)
  }

  const { error: updateError } = await supabase
    .from("activity_registrations")
    .update({
      proof_path: filePath,
      proof_status: "pending",
      proof_submitted_at: new Date().toISOString(),
      proof_reviewed_by: null,
      proof_reviewed_at: null,
      proof_admin_note: null,
    })
    .eq("id", registration.id)
    .eq("user_id", user.id)

  if (updateError) {
    await supabase.storage.from("activity-payment-proofs").remove([filePath])

    console.error("Gagal menyimpan bukti pembayaran:", updateError.message)
    redirect(`/dashboard/kegiatan/${activityId}?error=payment_database`)
  }

  revalidatePath(`/dashboard/kegiatan/${activityId}`)
  revalidatePath(`/admin/manajemen/kegiatan/${activityId}/peserta`)

  redirect(`/dashboard/kegiatan/${activityId}?payment=submitted`)
}


export async function submitAttendanceProof(
  activityId: string,
  formData: FormData
) {
  const { supabase, user } = await getAuthenticatedUser()

  if (!user) redirect("/login")

  const file = formData.get("attendance_proof")

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/dashboard/kegiatan/${activityId}?error=attendance_file`)
  }

  if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
    redirect(`/dashboard/kegiatan/${activityId}?error=attendance_invalid`)
  }

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("id, is_paid, status")
    .eq("id", activityId)
    .eq("status", "published")
    .maybeSingle()

  if (activityError || !activity) {
    redirect("/dashboard/kegiatan?error=activity")
  }

  const { data: registration, error: registrationError } = await supabase
    .from("activity_registrations")
    .select(
      "id, status, proof_status, attendance_proof_status"
    )
    .eq("activity_id", activityId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (
    registrationError ||
    !registration ||
    registration.status !== "registered"
  ) {
    redirect(`/dashboard/kegiatan/${activityId}?error=registration`)
  }

  // Pastikan pembayaran sudah disetujui untuk kegiatan berbayar.
  if (activity.is_paid && registration.proof_status !== "approved") {
    redirect(`/dashboard/kegiatan/${activityId}?error=payment_required`)
  }

  const currentStatus = registration.attendance_proof_status

  // Bukti yang sudah disetujui tidak boleh dikirim ulang.
  if (currentStatus === "approved") {
    redirect(`/dashboard/kegiatan/${activityId}?attendance=approved`)
  }

  // Bukti yang sedang menunggu verifikasi tidak boleh dikirim ulang.
  if (currentStatus === "pending") {
    redirect(`/dashboard/kegiatan/${activityId}?attendance=pending`)
  }

  // Upload pertama atau upload ulang setelah ditolak.
  const extension = getExtension(file.type)
  const filePath = `${user.id}/${registration.id}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from("attendance-proofs")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error("Gagal upload bukti kehadiran:", uploadError.message)
    redirect(`/dashboard/kegiatan/${activityId}?error=attendance_upload`)
  }

  // Update hanya jika status masih memungkinkan pengiriman.
  // Filter ini juga mencegah request bersamaan menimpa status pending.
  const { data: updatedRegistration, error: updateError } = await supabase
    .from("activity_registrations")
    .update({
      attendance_proof_path: filePath,
      attendance_proof_status: "pending",
      attendance_proof_submitted_at: new Date().toISOString(),
      attendance_proof_reviewed_at: null,
      attendance_proof_reviewed_by: null,
      attendance_proof_admin_note: null,
    })
    .eq("id", registration.id)
    .eq("user_id", user.id)
    .or(
      "attendance_proof_status.is.null,attendance_proof_status.eq.rejected,attendance_proof_status.eq.not_submitted"
    )
    .select("id")
    .maybeSingle()

  if (updateError || !updatedRegistration) {
    // Hapus file baru jika status tidak berhasil diperbarui.
    await supabase.storage
      .from("attendance-proofs")
      .remove([filePath])

    if (updateError) {
      console.error(
        "Gagal menyimpan bukti kehadiran:",
        updateError.message
      )
      redirect(
        `/dashboard/kegiatan/${activityId}?error=attendance_database`
      )
    }

    // Status mungkin berubah menjadi pending atau approved
    // saat proses upload sedang berlangsung.
    const { data: latestRegistration } = await supabase
      .from("activity_registrations")
      .select("attendance_proof_status")
      .eq("id", registration.id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (latestRegistration?.attendance_proof_status === "approved") {
      redirect(`/dashboard/kegiatan/${activityId}?attendance=approved`)
    }

    redirect(`/dashboard/kegiatan/${activityId}?attendance=pending`)
  }

  revalidatePath(`/dashboard/kegiatan/${activityId}`)
  revalidatePath(`/admin/manajemen/kegiatan/${activityId}/peserta`)

  redirect(`/dashboard/kegiatan/${activityId}?attendance=submitted`)
}

