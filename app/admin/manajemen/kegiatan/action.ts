"use server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
const MAX_FLYER_SIZE = 5 * 1024 * 1024
const ALLOWED_FLYER_TYPES = ["image/jpeg", "image/png", "image/webp"]
const ACTIVITY_PATH = "/admin/manajemen/kegiatan"
type ActionResult = {
  success: boolean
  message: string
}
/**
 * Input datetime-local tidak membawa timezone.
 * Seluruh jadwal kegiatan dianggap menggunakan WIB (UTC+7).
 */
function parseWibDateTime(value: string): Date | null {
  if (!value) return null
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? `${value}:00`
    : value
  const date = new Date(`${normalized}+07:00`)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}
/**
 * Memastikan pengguna yang menjalankan action adalah admin.
 */
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      supabase,
      user: null,
      error: "Sesi login tidak ditemukan.",
    }
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profileError || !profile || profile.role !== "admin") {
    return {
      supabase,
      user: null,
      error: "Anda tidak memiliki akses sebagai administrator.",
    }
  }
  return {
    supabase,
    user,
    error: null,
  }
}
/**
 * Validasi file flyer.
 */
function validateFlyer(flyerFile: File | null): string | null {
  if (!flyerFile) return null
  if (flyerFile.size > MAX_FLYER_SIZE) {
    return "Ukuran flyer maksimal 5 MB."
  }
  if (!ALLOWED_FLYER_TYPES.includes(flyerFile.type)) {
    return "Format flyer harus JPG, PNG, atau WEBP."
  }
  return null
}
/**
 * Mengunggah flyer ke Supabase Storage.
 */
async function uploadFlyer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  flyerFile: File
): Promise<{ path: string | null; error: string | null }> {
  const extension = flyerFile.name.split(".").pop()?.toLowerCase() || "jpg"
  const flyerPath = `activities/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from("activity-flyers")
    .upload(flyerPath, flyerFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: flyerFile.type,
    })
  if (error) {
    console.error("Gagal upload flyer:", error)
    return {
      path: null,
      error: "Gagal mengunggah flyer kegiatan.",
    }
  }
  return {
    path: flyerPath,
    error: null,
  }
}
/**
 * Menghapus file flyer dari Storage.
 */
async function removeFlyer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null
) {
  if (!path) return
  const { error } = await supabase.storage
    .from("activity-flyers")
    .remove([path])
  if (error) {
    console.error("Gagal menghapus flyer:", error)
  }
}
/**
 * =========================================================
 * CREATE ACTIVITY
 * =========================================================
 */
export async function createActivity(
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user, error } = await requireAdmin()
  if (!user) {
    return {
      success: false,
      message: error ?? "Anda tidak memiliki akses.",
    }
  }
  // =======================================================
  // FORM DATA
  // =======================================================
  const title = String(formData.get("title") ?? "").trim()
  const type = String(formData.get("type") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const isPaid = formData.get("is_paid") === "true"
  const registrationFee = Number(formData.get("registration_fee") ?? 0)
  const startAt = String(formData.get("start_at") ?? "").trim()
  const endAt = String(formData.get("end_at") ?? "").trim()
  const registrationStartAt = String(
    formData.get("registration_start_at") ?? ""
  ).trim()
  const registrationEndAt = String(
    formData.get("registration_end_at") ?? ""
  ).trim()
  const locationType = String(formData.get("location_type") ?? "").trim()
  const location = String(formData.get("location") ?? "").trim()
  const zoomUrl = String(formData.get("zoom_url") ?? "").trim()
  const organizer = String(formData.get("organizer") ?? "").trim()
  const certificateTitle = String(
    formData.get("certificate_title") ?? ""
  ).trim()
  const flyerValue = formData.get("flyer")
  const flyerFile =
    flyerValue instanceof File && flyerValue.size > 0 ? flyerValue : null
  // =======================================================
  // VALIDATION
  // =======================================================
  if (!title) {
    return {
      success: false,
      message: "Judul kegiatan wajib diisi.",
    }
  }
  if (!["training", "workshop", "webinar"].includes(type)) {
    return {
      success: false,
      message: "Jenis kegiatan tidak valid.",
    }
  }
  if (!startAt || !endAt) {
    return {
      success: false,
      message: "Tanggal dan waktu mulai serta selesai wajib diisi.",
    }
  }
  if (!Number.isSafeInteger(registrationFee) || registrationFee < 0) {
    return {
      success: false,
      message: "Nominal biaya pendaftaran tidak valid.",
    }
  }
  if (isPaid && registrationFee <= 0) {
    return {
      success: false,
      message: "Nominal biaya wajib diisi untuk kegiatan berbayar.",
    }
  }
  if (!isPaid && registrationFee !== 0) {
    return {
      success: false,
      message: "Kegiatan gratis tidak boleh memiliki biaya pendaftaran.",
    }
  }
  const startDate = parseWibDateTime(startAt)
  const endDate = parseWibDateTime(endAt)
  if (!startDate || !endDate) {
    return {
      success: false,
      message: "Tanggal atau waktu kegiatan tidak valid.",
    }
  }
  if (endDate <= startDate) {
    return {
      success: false,
      message: "Tanggal dan waktu selesai harus setelah waktu mulai.",
    }
  }
  let registrationStartDate: Date | null = null
  let registrationEndDate: Date | null = null
  if (registrationStartAt) {
    registrationStartDate = parseWibDateTime(registrationStartAt)
    if (!registrationStartDate) {
      return {
        success: false,
        message: "Tanggal mulai pendaftaran tidak valid.",
      }
    }
  }
  if (registrationEndAt) {
    registrationEndDate = parseWibDateTime(registrationEndAt)
    if (!registrationEndDate) {
      return {
        success: false,
        message: "Batas pendaftaran tidak valid.",
      }
    }
  }
  if (
    registrationStartDate &&
    registrationEndDate &&
    registrationEndDate < registrationStartDate
  ) {
    return {
      success: false,
      message: "Batas pendaftaran harus setelah waktu mulai pendaftaran.",
    }
  }
  if (registrationEndDate && registrationEndDate > startDate) {
    return {
      success: false,
      message: "Batas pendaftaran tidak boleh melewati waktu mulai kegiatan.",
    }
  }
  if (!["offline", "online", "hybrid"].includes(locationType)) {
    return {
      success: false,
      message: "Mode kegiatan tidak valid.",
    }
  }
  if (!organizer) {
    return {
      success: false,
      message: "Penyelenggara wajib diisi.",
    }
  }
  if (!certificateTitle) {
    return {
      success: false,
      message: "Judul sertifikat wajib diisi.",
    }
  }
  if ((locationType === "offline" || locationType === "hybrid") && !location) {
    return {
      success: false,
      message: "Lokasi wajib diisi untuk kegiatan offline atau hybrid.",
    }
  }
  if ((locationType === "online" || locationType === "hybrid") && !zoomUrl) {
    return {
      success: false,
      message: "Link Zoom wajib diisi untuk kegiatan online atau hybrid.",
    }
  }
  const flyerValidationError = validateFlyer(flyerFile)
  if (flyerValidationError) {
    return {
      success: false,
      message: flyerValidationError,
    }
  }
  // =======================================================
  // UPLOAD FLYER
  // =======================================================
  let flyerPath: string | null = null
  if (flyerFile) {
    const uploadResult = await uploadFlyer(supabase, flyerFile)
    if (uploadResult.error) {
      return {
        success: false,
        message: uploadResult.error,
      }
    }
    flyerPath = uploadResult.path
  }
  // =======================================================
  // INSERT ACTIVITY
  // zoom_url TIDAK disimpan di tabel activities.
  // =======================================================
  const { data: newActivity, error: insertError } = await supabase
    .from("activities")
    .insert({
      title,
      type,
      status: "draft",
      description: description || null,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      registration_start_at: registrationStartDate
        ? registrationStartDate.toISOString()
        : null,
      registration_end_at: registrationEndDate
        ? registrationEndDate.toISOString()
        : null,
      is_paid: isPaid,
      registration_fee: isPaid ? registrationFee : 0,
      location_type: locationType,
      location: location || null,
      organizer,
      certificate_title: certificateTitle,
      image_path: flyerPath,
      created_by: user.id,
    })
    .select("id")
    .single()
  if (insertError || !newActivity) {
    console.error("Gagal membuat kegiatan:", insertError)
    await removeFlyer(supabase, flyerPath)
    return {
      success: false,
      message: "Gagal membuat kegiatan.",
    }
  }
  // =======================================================
  // SIMPAN LINK ZOOM SECARA TERPISAH
  // =======================================================
  if (zoomUrl) {
    const { error: linkError } = await supabase
      .from("activity_access_links")
      .insert({
        activity_id: newActivity.id,
        zoom_url: zoomUrl,
      })
    if (linkError) {
      console.error("Gagal menyimpan link Zoom:", linkError)
      // Bersihkan kegiatan dan flyer jika penyimpanan link gagal.
      const { error: rollbackError } = await supabase
        .from("activities")
        .delete()
        .eq("id", newActivity.id)
      if (rollbackError) {
        console.error("Gagal membersihkan kegiatan:", rollbackError)
      }
      await removeFlyer(supabase, flyerPath)
      return {
        success: false,
        message: "Gagal menyimpan link Zoom. Kegiatan belum dapat dibuat.",
      }
    }
  }
  revalidatePath(ACTIVITY_PATH)
  revalidatePath("/dashboard/kegiatan")
  return {
    success: true,
    message: "Kegiatan berhasil dibuat.",
  }
}
/**
 * =========================================================
 * UPDATE ACTIVITY
 * =========================================================
 */
export async function updateActivity(
  activityId: string,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user, error } = await requireAdmin()
  if (!user) {
    return {
      success: false,
      message: error ?? "Anda tidak memiliki akses.",
    }
  }
  // =======================================================
  // GET EXISTING ACTIVITY
  // =======================================================
  const { data: existingActivity, error: activityError } = await supabase
    .from("activities")
    .select("id, image_path")
    .eq("id", activityId)
    .single()
  if (activityError || !existingActivity) {
    return {
      success: false,
      message: "Kegiatan tidak ditemukan.",
    }
  }
  // =======================================================
  // FORM DATA
  // =======================================================
  const title = String(formData.get("title") ?? "").trim()
  const type = String(formData.get("type") ?? "").trim()
  const status = String(formData.get("status") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const isPaid = formData.get("is_paid") === "true"
  const registrationFee = Number(formData.get("registration_fee") ?? 0)
  const startAt = String(formData.get("start_at") ?? "").trim()
  const endAt = String(formData.get("end_at") ?? "").trim()
  const registrationStartAt = String(
    formData.get("registration_start_at") ?? ""
  ).trim()
  const registrationEndAt = String(
    formData.get("registration_end_at") ?? ""
  ).trim()
  const locationType = String(formData.get("location_type") ?? "").trim()
  const location = String(formData.get("location") ?? "").trim()
  const zoomUrl = String(formData.get("zoom_url") ?? "").trim()
  const organizer = String(formData.get("organizer") ?? "").trim()
  const certificateTitle = String(
    formData.get("certificate_title") ?? ""
  ).trim()
  const flyerValue = formData.get("flyer")
  const flyerFile =
    flyerValue instanceof File && flyerValue.size > 0 ? flyerValue : null
  // =======================================================
  // VALIDATION
  // =======================================================
  if (!title) {
    return {
      success: false,
      message: "Judul kegiatan wajib diisi.",
    }
  }
  if (!["training", "workshop", "webinar"].includes(type)) {
    return {
      success: false,
      message: "Jenis kegiatan tidak valid.",
    }
  }
  if (!["draft", "published", "completed", "cancelled"].includes(status)) {
    return {
      success: false,
      message: "Status kegiatan tidak valid.",
    }
  }
  if (!startAt || !endAt) {
    return {
      success: false,
      message: "Tanggal dan waktu mulai serta selesai wajib diisi.",
    }
  }
  if (!Number.isSafeInteger(registrationFee) || registrationFee < 0) {
    return {
      success: false,
      message: "Nominal biaya pendaftaran tidak valid.",
    }
  }
  if (isPaid && registrationFee <= 0) {
    return {
      success: false,
      message: "Nominal biaya wajib diisi untuk kegiatan berbayar.",
    }
  }
  if (!isPaid && registrationFee !== 0) {
    return {
      success: false,
      message: "Kegiatan gratis tidak boleh memiliki biaya pendaftaran.",
    }
  }
  const startDate = parseWibDateTime(startAt)
  const endDate = parseWibDateTime(endAt)
  if (!startDate || !endDate) {
    return {
      success: false,
      message: "Tanggal atau waktu kegiatan tidak valid.",
    }
  }
  if (endDate <= startDate) {
    return {
      success: false,
      message: "Tanggal dan waktu selesai harus setelah waktu mulai.",
    }
  }
  let registrationStartDate: Date | null = null
  let registrationEndDate: Date | null = null
  if (registrationStartAt) {
    registrationStartDate = parseWibDateTime(registrationStartAt)
    if (!registrationStartDate) {
      return {
        success: false,
        message: "Tanggal mulai pendaftaran tidak valid.",
      }
    }
  }
  if (registrationEndAt) {
    registrationEndDate = parseWibDateTime(registrationEndAt)
    if (!registrationEndDate) {
      return {
        success: false,
        message: "Batas pendaftaran tidak valid.",
      }
    }
  }
  if (
    registrationStartDate &&
    registrationEndDate &&
    registrationEndDate < registrationStartDate
  ) {
    return {
      success: false,
      message: "Batas pendaftaran harus setelah waktu mulai pendaftaran.",
    }
  }
  if (registrationEndDate && registrationEndDate > startDate) {
    return {
      success: false,
      message: "Batas pendaftaran tidak boleh melewati waktu mulai kegiatan.",
    }
  }
  if (!["offline", "online", "hybrid"].includes(locationType)) {
    return {
      success: false,
      message: "Mode kegiatan tidak valid.",
    }
  }
  if (!organizer) {
    return {
      success: false,
      message: "Penyelenggara wajib diisi.",
    }
  }
  if (!certificateTitle) {
    return {
      success: false,
      message: "Judul sertifikat wajib diisi.",
    }
  }
  if ((locationType === "offline" || locationType === "hybrid") && !location) {
    return {
      success: false,
      message: "Lokasi wajib diisi untuk kegiatan offline atau hybrid.",
    }
  }
  if ((locationType === "online" || locationType === "hybrid") && !zoomUrl) {
    return {
      success: false,
      message: "Link Zoom wajib diisi untuk kegiatan online atau hybrid.",
    }
  }
  const flyerValidationError = validateFlyer(flyerFile)
  if (flyerValidationError) {
    return {
      success: false,
      message: flyerValidationError,
    }
  }
  // =======================================================
  // UPLOAD FLYER BARU
  // =======================================================
  let newFlyerPath: string | null = null
  if (flyerFile) {
    const uploadResult = await uploadFlyer(supabase, flyerFile)
    if (uploadResult.error) {
      return {
        success: false,
        message: uploadResult.error,
      }
    }
    newFlyerPath = uploadResult.path
  }
  // =======================================================
  // UPDATE ACTIVITY
  // zoom_url TIDAK diupdate di tabel activities.
  // =======================================================
  const { error: updateError } = await supabase
    .from("activities")
    .update({
      title,
      type,
      status,
      description: description || null,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      registration_start_at: registrationStartDate
        ? registrationStartDate.toISOString()
        : null,
      registration_end_at: registrationEndDate
        ? registrationEndDate.toISOString()
        : null,
      is_paid: isPaid,
      registration_fee: isPaid ? registrationFee : 0,
      location_type: locationType,
      location: location || null,
      organizer,
      certificate_title: certificateTitle,
      ...(newFlyerPath
        ? {
            image_path: newFlyerPath,
          }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", activityId)
  if (updateError) {
    console.error("Gagal memperbarui kegiatan:", updateError)
    await removeFlyer(supabase, newFlyerPath)
    return {
      success: false,
      message: "Gagal memperbarui kegiatan.",
    }
  }
  // =======================================================
  // UPDATE / HAPUS LINK ZOOM
  // =======================================================
  if (zoomUrl) {
    const { error: linkError } = await supabase
      .from("activity_access_links")
      .upsert(
        {
          activity_id: activityId,
          zoom_url: zoomUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "activity_id",
        }
      )
    if (linkError) {
      console.error("Gagal memperbarui link Zoom:", linkError)
      return {
        success: false,
        message: "Data kegiatan tersimpan, tetapi link Zoom gagal diperbarui.",
      }
    }
  } else {
    const { error: deleteLinkError } = await supabase
      .from("activity_access_links")
      .delete()
      .eq("activity_id", activityId)
    if (deleteLinkError) {
      console.error("Gagal menghapus link Zoom:", deleteLinkError)
      return {
        success: false,
        message: "Data kegiatan tersimpan, tetapi link Zoom gagal dihapus.",
      }
    }
  }
  // =======================================================
  // DELETE FLYER LAMA
  // =======================================================
  if (newFlyerPath && existingActivity.image_path) {
    await removeFlyer(supabase, existingActivity.image_path)
  }
  revalidatePath(ACTIVITY_PATH)
  revalidatePath("/dashboard/kegiatan")
  revalidatePath(`/dashboard/kegiatan/${activityId}`)
  return {
    success: true,
    message: "Kegiatan berhasil diperbarui.",
  }
}

