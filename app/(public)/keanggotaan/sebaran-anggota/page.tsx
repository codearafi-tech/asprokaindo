import { createClient } from "@/lib/supabase/server"
import SebaranAnggotaClient from "./sebaran-anggota-client"

export const metadata = {
  title: "Sebaran Anggota | ASPROKAINDONESIA",
  description:
    "Visualisasi persebaran anggota ASPROKAINDONESIA di seluruh provinsi Indonesia.",
}

export default async function SebaranAnggotaPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    "get_member_distribution_by_province",
  )

  const distribution = !error
    ? (data ?? []).map(
        (item: { province: string; member_count: number | string }) => ({
          province: item.province,
          member_count: Number(item.member_count),
        }),
      )
    : []

  return (
    <SebaranAnggotaClient
      distribution={distribution}
      hasError={Boolean(error)}
    />
  )
}