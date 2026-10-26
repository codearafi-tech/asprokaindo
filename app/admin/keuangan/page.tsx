import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  ReceiptText,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"

import { ExpenseDialog } from "./expense-dialog"
import {
  FinancialTable,
  type FinancialTransaction,
} from "./financial-table"

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function FinancialPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: transactions, error } = await supabase
    .from("financial_transactions")
    .select(`
      id,
      type,
      category,
      description,
      notes,
      amount,
      transaction_date,
      created_at,
      user_id,
      reference_type
    `)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Financial transactions error:", error)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Keuangan
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Kelola pemasukan dan pengeluaran organisasi.
          </p>
        </div>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          Gagal memuat data keuangan.
        </div>
      </div>
    )
  }

  const financialTransactions: FinancialTransaction[] =
    (transactions ?? []).map((transaction) => ({
      ...transaction,
      type:
        transaction.type === "expense"
          ? "expense"
          : "income",
      amount: Number(transaction.amount),
    }))

  const totalIncome = financialTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => {
      return total + transaction.amount
    }, 0)

  const totalExpense = financialTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => {
      return total + transaction.amount
    }, 0)

  const balance = totalIncome - totalExpense

  const transactionCount = financialTransactions.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Keuangan
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Kelola dan pantau seluruh pemasukan serta
            pengeluaran organisasi.
          </p>
        </div>

        <ExpenseDialog />
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Income */}
        <div className="rounded-xl border bg-background p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Pemasukan
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {formatRupiah(totalIncome)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Seluruh pemasukan tercatat
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Expense */}
        <div className="rounded-xl border bg-background p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Pengeluaran
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {formatRupiah(totalExpense)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Seluruh pengeluaran tercatat
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <ArrowUpRight className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="rounded-xl border bg-background p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Saldo
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {formatRupiah(balance)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Pemasukan dikurangi pengeluaran
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Transaction count */}
        <div className="rounded-xl border bg-background p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Transaksi
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {transactionCount}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Pemasukan dan pengeluaran
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <ReceiptText className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            Transaksi Keuangan
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Riwayat seluruh transaksi keuangan organisasi.
          </p>
        </div>

        <FinancialTable
          transactions={financialTransactions}
        />
      </section>
    </div>
  )
}