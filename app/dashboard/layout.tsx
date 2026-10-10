import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

import { TooltipProvider } from "@/components/ui/tooltip"

import { MemberSidebar } from "@/components/ui/member-sidebar"

import { MemberBreadcrumbs } from "@/components/ui/member-breadcrumbs"

import { Toaster } from "sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Tidak ada session
  if (!user) {
    redirect("/login")
  }

  // Ambil profil pengguna
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, verification_status")
    .eq("id", user.id)
    .single()

  // Gagal mengambil profil
  if (error || !profile) {
    redirect("/login")
  }

  // Admin diarahkan ke portal admin
  if (profile.role === "admin") {
    redirect("/admin")
  }

  // Anggota belum terverifikasi
  if (profile.verification_status !== "verified") {
    redirect("/verification")
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-svh w-full min-w-0">
          {/* Sidebar member */}
          <MemberSidebar />

          {/* Konten utama */}
          <main className="flex min-h-svh min-w-0 flex-1 flex-col overflow-x-clip bg-white">
            {/* Header member */}
            <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center gap-4 border-b border-border bg-white px-4 opacity-100 md:px-6">
              <SidebarTrigger />

              <div className="min-w-0 flex-1">
                <MemberBreadcrumbs />
              </div>
            </header>

            {/* Konten halaman */}
            <div className="w-full min-w-0 flex-1 bg-background p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Notifikasi */}
        <Toaster richColors position="top-right" />
      </SidebarProvider>
    </TooltipProvider>
  )
}
