"use server"

import { createClient } from "@/lib/supabase/server"

export async function createExpense(formData: FormData) {
  const supabase = await createClient()

  // =========================
  // CHECK LOGIN
  // =========================

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      message: "Anda harus login terlebih dahulu.",
    }
  }

  // =========================
  // CHECK ADMIN
  // =========================

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    return {
      success: false,
      message: "Anda tidak memiliki akses sebagai admin.",
    }
  }

  // =========================
  // GET FORM DATA
  // =========================

  const category = String(
    formData.get("category") || ""
  ).trim()

  const description = String(
    formData.get("description") || ""
  ).trim()

  const notes = String(
    formData.get("notes") || ""
  ).trim()

  const amountValue = String(
    formData.get("amount") || ""
  ).trim()

  const transactionDate = String(
    formData.get("transaction_date") || ""
  ).trim()

  // =========================
  // VALIDATION
  // =========================

  if (!category) {
    return {
      success: false,
      message: "Kategori pengeluaran wajib diisi.",
    }
  }

  if (!description) {
    return {
      success: false,
      message: "Deskripsi pengeluaran wajib diisi.",
    }
  }

  const amount = Number(amountValue)

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      success: false,
      message: "Nominal pengeluaran tidak valid.",
    }
  }

  if (!transactionDate) {
    return {
      success: false,
      message: "Tanggal transaksi wajib diisi.",
    }
  }

  // =========================
  // INSERT TRANSACTION
  // =========================

  const { error } = await supabase
    .from("financial_transactions")
    .insert({
      user_id: null,
      type: "expense",
      category,
      description,
      notes: notes || null,
      amount,
      transaction_date: transactionDate,
      reference_id: null,
      reference_type: "manual_expense",
      created_by: user.id,
    })

  if (error) {
    console.error(
      "Gagal membuat transaksi pengeluaran:",
      error
    )

    return {
      success: false,
      message:
        error.message ||
        "Gagal menyimpan transaksi pengeluaran.",
    }
  }

  // =========================
  // SUCCESS
  // =========================

  return {
    success: true,
    message: "Pengeluaran berhasil dicatat.",
  }
}