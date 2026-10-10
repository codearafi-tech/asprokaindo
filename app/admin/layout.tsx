import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { TooltipProvider } from "@/components/ui/tooltip"

import { AppSidebar } from "@/components/ui/app-sidebar"

import { AdminBreadcrumb } from "@/components/ui/admin-breadcrumb"

import { Toaster } from "sonner"

export default async function AdminLayout({
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
    .select("role")
    .eq("id", user.id)
    .single()

  // Gagal mengambil profil
  if (error || !profile) {
    redirect("/dashboard")
  }

  // Bukan admin
  if (profile.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-svh w-full min-w-0">
          {/* Sidebar */}
          <AppSidebar />

          {/* Konten utama */}
          <main className="flex min-h-svh min-w-0 flex-1 flex-col overflow-x-clip bg-white">
            {/* Header admin */}
            <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center gap-4 border-b border-border bg-white px-4 opacity-100 md:px-6">
              <SidebarTrigger />

              <div className="min-w-0 flex-1">
                <AdminBreadcrumb />
              </div>
            </header>

            {/* Konten halaman */}
            <div className="w-full min-w-0 bg-background flex-1 p-4 md:p-6">
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