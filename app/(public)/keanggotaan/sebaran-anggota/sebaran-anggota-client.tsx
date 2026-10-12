"use client"

import * as React from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  MapPinned,
  Search,
  Users,
  Map as MapIcon,
  TrendingUp,
  RefreshCw,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type ProvinceData = {
  province: string
  member_count: number
}

type Props = {
  distribution: ProvinceData[]
  hasError: boolean
}

type GeoProperties = {
  PROVINSI?: string | null
  province?: string | null
  NAME_1?: string | null
  name?: string | null
  [key: string]: unknown
}

const GEO_URL = "/indonesia-38-provinces.geojson"

function normalizeProvince(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/^(provinsi|propinsi)/, "")
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value)
}

function formatProvinceName(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-3 text-2xl font-semibold tracking-tight wrap-break-words text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 px-5 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

export default function SebaranAnggotaClient({
  distribution,
  hasError,
}: Props) {
  const [search, setSearch] = React.useState("")
  const [selectedProvince, setSelectedProvince] = React.useState<string | null>(
    null
  )
  const [geoError, setGeoError] = React.useState(false)

  const provinceLookup = React.useMemo(() => {
    const lookup = new globalThis.Map<string, ProvinceData>()

    distribution.forEach((item) => {
      lookup.set(normalizeProvince(item.province), item)
    })

    return lookup
  }, [distribution])

  const totalMembers = distribution.reduce(
    (total, item) => total + item.member_count,
    0
  )

  const coveredProvinces = distribution.filter(
    (item) => item.member_count > 0
  ).length

  const selectedData = selectedProvince
    ? provinceLookup.get(normalizeProvince(selectedProvince))
    : undefined

  const filteredDistribution = React.useMemo(() => {
    const query = search.toLowerCase().trim()

    return [...distribution]
      .filter((item) => item.province.toLowerCase().includes(query))
      .sort((a, b) => b.member_count - a.member_count)
  }, [distribution, search])

  const topProvinces = React.useMemo(
    () =>
      [...distribution]
        .sort((a, b) => b.member_count - a.member_count)
        .slice(0, 10)
        .map((item) => ({
          ...item,
          label: formatProvinceName(item.province),
        })),
    [distribution]
  )

  const maxMembers = Math.max(
    1,
    ...distribution.map((item) => item.member_count)
  )

  return (
    <main className="min-h-screen bg-slate-50/70">
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-linear-to-br from-[#071633] via-[#102b65] to-[#1b3d80]">
        <div className="pointer-events-none absolute -top-32 -right-24 -z-10 size-96 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 size-96 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 pt-28 pb-14 md:pb-16 lg:px-20">
          <h1 className="mt-4 max-w-3xl text-4xl tracking-tight text-white md:text-5xl">
            Sebaran Anggota
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
            Jelajahi persebaran anggota terverifikasi di seluruh provinsi
            Indonesia dan lihat jangkauan komunitas profesi kecerdasan
            artifisial secara nasional.
          </p>
        </div>
      </section>
      
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 sm:px-8 md:py-10 lg:px-20">
        {/* ERROR DATABASE */}
        {hasError && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Data anggota belum berhasil dimuat. Periksa fungsi RPC Supabase
              dan izin aksesnya.
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 size-4" />
              Muat ulang
            </Button>
          </div>
        )}

        {/* STATISTIK */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Anggota"
            value={formatNumber(totalMembers)}
            description="Anggota terverifikasi"
            icon={<Users className="size-5" />}
          />

          <StatCard
            title="Provinsi Terjangkau"
            value={`${coveredProvinces} dari 38`}
            description="Provinsi dengan anggota"
            icon={<MapPinned className="size-5" />}
          />

          <StatCard
            title="Provinsi Teratas"
            value={
              topProvinces[0]
                ? formatProvinceName(topProvinces[0].province)
                : "-"
            }
            description={
              topProvinces[0]
                ? `${formatNumber(topProvinces[0].member_count)} anggota`
                : "Belum ada data anggota"
            }
            icon={<TrendingUp className="size-5" />}
          />
        </div>

        {/* PETA */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Peta Sebaran Indonesia
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pilih wilayah pada peta untuk melihat statistik provinsi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="size-3 rounded-sm bg-slate-200" />
              Tidak ada data
              <span className="size-3 rounded-sm bg-blue-100" />
              Sedikit
              <span className="size-3 rounded-sm bg-blue-400" />
              Sedang
              <span className="size-3 rounded-sm bg-blue-800" />
              Banyak
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="relative min-w-0 p-3 sm:p-5">
              {!geoError ? (
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    center: [118, -2],
                    scale: 850,
                  }}
                  width={900}
                  height={480}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "520px",
                  }}
                >
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const properties = (geo.properties ??
                          {}) as GeoProperties

                        const provinceName = String(
                          properties.PROVINSI ??
                            properties.province ??
                            properties.NAME_1 ??
                            properties.name ??
                            ""
                        )

                        const provinceData = provinceLookup.get(
                          normalizeProvince(provinceName)  
                        )

                        const count = provinceData?.member_count ?? 0
                        const intensity = count / maxMembers

                        const fill =
                          count === 0
                            ? "#E2E8F0"
                            : intensity > 0.65
                              ? "#1D4ED8"
                              : intensity > 0.3
                                ? "#60A5FA"
                                : "#BFDBFE"

                        const isSelected =
                          selectedProvince !== null &&
                          normalizeProvince(selectedProvince) ===
                            normalizeProvince(provinceName)

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onClick={() => setSelectedProvince(provinceName)}
                            style={
                              {
                                default: {
                                  fill: isSelected ? "#F59E0B" : fill,
                                  stroke: "#FFFFFF",
                                  strokeWidth: isSelected ? 1.2 : 0.7,
                                  outline: "none",
                                },
                                hover: {
                                  fill: "#F59E0B",
                                  stroke: "#FFFFFF",
                                  strokeWidth: 1.2,
                                  outline: "none",
                                  cursor: "pointer",
                                },
                                pressed: {
                                  fill: "#D97706",
                                  outline: "none",
                                },
                              } as any
                            }
                            aria-label={`${provinceName}: ${count} anggota`}
                            tabIndex={0}
                            role="button"
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                setSelectedProvince(provinceName)
                              }
                            }}
                          />
                        )
                      })
                    }
                  </Geographies>
                </ComposableMap>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
                  <MapPinned className="size-8 text-slate-400" />

                  <p className="text-sm text-slate-500">
                    Peta tidak dapat dimuat.
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setGeoError(false)
                      window.location.reload()
                    }}
                  >
                    Muat ulang peta
                  </Button>
                </div>
              )}

              <div className="px-2 pb-3 text-xs leading-5 text-slate-400">
                Warna menunjukkan jumlah anggota relatif terhadap provinsi
                dengan anggota terbanyak. Wilayah abu-abu berarti belum memiliki
                data anggota terverifikasi.
              </div>
            </div>

            {/* DETAIL PROVINSI */}
            <aside className="border-t border-slate-100 bg-slate-50/70 p-5 lg:border-t-0 lg:border-l">
              <div className="mb-5 flex items-center gap-2">
                <MapIcon className="size-4 text-blue-600" />

                <h3 className="font-semibold text-slate-900">
                  Detail Provinsi
                </h3>
              </div>

              {selectedProvince ? (
                <div>
                  <p className="text-sm text-slate-500">Provinsi dipilih</p>

                  <h4 className="mt-1 text-xl font-semibold text-slate-900">
                    {formatProvinceName(selectedProvince)}
                  </h4>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">
                      Anggota terverifikasi
                    </p>

                    <p className="mt-1 text-3xl font-semibold text-blue-700">
                      {formatNumber(selectedData?.member_count ?? 0)}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {selectedData
                        ? "Berdasarkan data keanggotaan terverifikasi."
                        : "Belum ada anggota terverifikasi yang tercatat."}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => setSelectedProvince(null)}
                  >
                    Hapus pilihan
                  </Button>
                </div>
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <MapPinned className="size-6" />
                  </div>

                  <p className="text-sm font-medium text-slate-800">
                    Pilih provinsi
                  </p>

                  <p className="mt-1 max-w-48 text-xs leading-5 text-slate-500">
                    Klik salah satu wilayah pada peta untuk melihat jumlah
                    anggotanya.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </section>

        {/* GRAFIK */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              10 Provinsi dengan Anggota Terbanyak
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Peringkat berdasarkan jumlah anggota terverifikasi.
            </p>
          </div>

          {topProvinces.length > 0 ? (
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProvinces}
                  layout="vertical"
                  margin={{
                    top: 4,
                    right: 20,
                    left: 12,
                    bottom: 4,
                  }}
                >
                  <CartesianGrid
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="label"
                    width={125}
                    tick={{ fill: "#475569", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${formatNumber(Number(value))} anggota`,
                      "Jumlah",
                    ]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      fontSize: 12,
                    }}
                  />

                  <Bar
                    dataKey="member_count"
                    name="Anggota"
                    fill="#2563EB"
                    radius={[0, 5, 5, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="Belum ada data anggota terverifikasi untuk ditampilkan pada grafik." />
          )}
        </section>

        {/* TABEL PROVINSI */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Data per Provinsi
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Cari dan bandingkan jumlah anggota tiap provinsi.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari provinsi..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">#</th>

                  <th className="px-5 py-3 font-medium">Provinsi</th>

                  <th className="px-5 py-3 text-right font-medium">
                    Jumlah Anggota
                  </th>

                  <th className="px-5 py-3 font-medium">Proporsi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredDistribution.map((item, index) => (
                  <tr
                    key={item.province}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-slate-400">{index + 1}</td>

                    <td className="px-5 py-4 font-medium text-slate-800">
                      {formatProvinceName(item.province)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-900 tabular-nums">
                      {formatNumber(item.member_count)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex min-w-24 items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{
                              width: `${
                                totalMembers > 0
                                  ? (item.member_count / totalMembers) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>

                        <span className="w-12 text-right text-xs text-slate-500 tabular-nums">
                          {totalMembers > 0
                            ? `${(
                                (item.member_count / totalMembers) *
                                100
                              ).toFixed(1)}%`
                            : "0%"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredDistribution.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm text-slate-500"
                    >
                      Tidak ada provinsi yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Menampilkan {filteredDistribution.length} provinsi dengan data
            keanggotaan.
          </div>
        </section>

        <p className="text-center text-xs leading-5 text-slate-400">
          Statistik hanya menampilkan jumlah agregat anggota terverifikasi.
          Tidak ada informasi pribadi anggota yang ditampilkan.
        </p>
      </div>
    </main>
  )
}
