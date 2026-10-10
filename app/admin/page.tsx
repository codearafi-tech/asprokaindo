import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, UserCheck, ShieldCheck, Activity } from "lucide-react"

export default async function Dashboard() {
  const supabase = await createClient()

  const { count: totalMembers, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  return (
    <div className="space-y-6">
      {/* Bagian Judul Halaman */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Ringkasan informasi dan statistik utama portal asosiasi.
        </p>
      </div>

      {/* Grid Kartu Statistik */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Kartu 1: Total Anggota */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {error ? "0" : totalMembers ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Terdaftar via Google OAuth
            </p>
          </CardContent>
        </Card>

        {/* Kartu 2: Anggota Aktif */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anggota Aktif</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aktif bulan ini
            </p>
          </CardContent>
        </Card>

        {/* Kartu 3: Status Admin */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peran Aktif</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Administrator</div>
            <p className="text-xs text-muted-foreground mt-1">
              Akses hak penuh sistem
            </p>
          </CardContent>
        </Card>

        {/* Kartu 4: Status Sistem */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Koneksi Sistem</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-green-600 flex items-center gap-2 mt-1">
              <span className="h-2.5 w-2.5 rounded-full bg-green-600 animate-pulse" />
              Terhubung
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Supabase Database OK
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bagian Tambahan (Contoh: Aktivitas Terbaru / Shortcut) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Aktivitas Pendaftaran</CardTitle>
            <CardDescription>
              Grafik atau daftar anggota baru yang baru saja bergabung.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-50 flex items-center justify-center border-t border-dashed text-muted-foreground text-sm">
            Area untuk grafik statistik atau tabel ringkas
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Pintasan Cepat</CardTitle>
            <CardDescription>
              Aksi cepat pengelolan asosiasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Kelola data anggota pada menu <strong className="text-foreground">Manajemen Anggota</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              • Tambahkan informasi terbaru lewat menu <strong className="text-foreground">Pengumuman</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
