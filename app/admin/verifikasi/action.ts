"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type ApproveResult = {
  success: boolean
  member_number?: string
  certificate_number?: string
  membership_start_date?: string
  membership_expiry_date?: string
}

type RejectResult = {
  success: boolean
  status?: string
}

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Sesi login tidak valid. Silakan login kembali.")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    throw new Error("Anda tidak memiliki akses sebagai admin.")
  }

  return supabase
}

// =====================================================
// APPROVE VERIFICATION
// =====================================================

export async function approveVerification(id: string) {
  if (!id) {
    throw new Error("ID pengajuan tidak valid.")
  }

  const supabase = await requireAdmin()

  const { data, error } = await supabase.rpc(
    "approve_verification",
    {
      p_submission_id: id,
    }
  )

  if (error) {
    console.error("Approve verification error:", error)
    throw new Error(
      error.message || "Gagal menyetujui pengajuan verifikasi."
    )
  }

  const result = data as ApproveResult | null

  if (!result?.success) {
    throw new Error("Persetujuan pengajuan gagal diproses.")
  }

  revalidatePath("/admin/verifikasi")
  revalidatePath("/verification")
  revalidatePath("/dashboard")

  return {
    success: true,
    memberNumber: result.member_number,
    certificateNumber: result.certificate_number,
    membershipStartDate: result.membership_start_date,
    membershipExpiryDate: result.membership_expiry_date,
  }
}

// =====================================================
// REJECT VERIFICATION
// =====================================================

export async function rejectVerification(
  id: string,
  reason: string
) {
  if (!id) {
    throw new Error("ID pengajuan tidak valid.")
  }

  const trimmedReason = reason.trim()

  if (!trimmedReason) {
    throw new Error("Alasan penolakan wajib diisi.")
  }

  const supabase = await requireAdmin()

  const { data, error } = await supabase.rpc(
    "reject_verification",
    {
      p_submission_id: id,
      p_reason: trimmedReason,
    }
  )

  if (error) {
    console.error("Reject verification error:", error)
    throw new Error(
      error.message || "Gagal menolak pengajuan verifikasi."
    )
  }

  const result = data as RejectResult | null

  if (!result?.success) {
    throw new Error("Penolakan pengajuan gagal diproses.")
  }

  revalidatePath("/admin/verifikasi")
  revalidatePath("/verification")
  revalidatePath("/dashboard")

  return {
    success: true,
  }
}