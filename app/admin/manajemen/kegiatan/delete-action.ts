"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ActionResult = {
  success: boolean
  message: string
}

export async function deleteActivity(
  activityId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "Silakan login terlebih dahulu." }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { success: false, message: "Akses ditolak." }
  }

  const { data: activity, error: fetchError } = await supabase
    .from("activities")
    .select("id, title, image_path")
    .eq("id", activityId)
    .maybeSingle()

  if (fetchError || !activity) {
    return { success: false, message: "Kegiatan tidak ditemukan." }
  }

  // Hapus tautan akses terlebih dahulu.
  const { error: linkError } = await supabase
    .from("activity_access_links")
    .delete()
    .eq("activity_id", activityId)

  if (linkError) {
    console.error("Gagal menghapus tautan akses:", linkError)
    return {
      success: false,
      message: "Tautan akses gagal dihapus. Kegiatan tidak dihapus.",
    }
  }

  // Hapus kegiatan.
  const { error: deleteError } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId)

  if (deleteError) {
    console.error("Gagal menghapus kegiatan:", deleteError)
    return {
      success: false,
      message:
        "Kegiatan gagal dihapus. Periksa relasi data dan foreign key.",
    }
  }

  // Hapus poster setelah data kegiatan berhasil dihapus.
  if (activity.image_path) {
    const { error: storageError } = await supabase.storage
      .from("activity-flyers")
      .remove([activity.image_path])

    if (storageError) {
      console.error("Gagal menghapus poster:", storageError)
    }
  }

  revalidatePath("/admin/manajemen/kegiatan")
  revalidatePath("/dashboard/kegiatan")

  return {
    success: true,
    message: `Kegiatan "${activity.title}" berhasil dihapus.`,
  }
}