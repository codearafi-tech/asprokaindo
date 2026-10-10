"use client"

import { ArrowDownLeft, ArrowUpRight, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type FinancialTransaction = {
  id: string
  type: "income" | "expense"
  category: string
  description: string
  notes: string | null
  amount: number
  transaction_date: string
  created_at: string
  user_id: string | null
  reference_type: string | null
}

type FinancialTableProps = {
  transactions: FinancialTransaction[]
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function FinancialTable({ transactions }: FinancialTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex min-h-70 items-center justify-center rounded-xl border bg-background">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <h3 className="font-medium">Belum ada transaksi</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Transaksi pemasukan dan pengeluaran akan muncul di sini.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full min-w-212.5 text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                Tanggal
              </th>

              <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                Jenis
              </th>

              <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                Kategori
              </th>

              <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                Deskripsi
              </th>

              <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                Nominal
              </th>

              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income"

              return (
                <tr
                  key={transaction.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-4 whitespace-nowrap">
                    {formatDate(transaction.transaction_date)}
                  </td>

                  <td className="px-5 py-4">
                    {isIncome ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                          <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                        </div>

                        <span className="font-medium text-emerald-600">
                          Pemasukan
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                          <ArrowUpRight className="h-4 w-4 text-red-600" />
                        </div>

                        <span className="font-medium text-red-600">
                          Pengeluaran
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                      {transaction.category}
                    </span>
                  </td>

                  <td className="max-w-[320px] px-5 py-4">
                    <div className="truncate font-medium">
                      {transaction.description}
                    </div>

                    {transaction.notes && (
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {transaction.notes}
                      </div>
                    )}
                  </td>

                  <td
                    className={`px-5 py-4 text-right font-semibold whitespace-nowrap ${
                      isIncome ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatRupiah(transaction.amount)}
                  </td>

                  <td className="px-3 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menu transaksi</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
