"use client"

import * as React from "react"
import {
  Award,
  ChevronRight,
  CreditCard,
  LayoutGrid,
  LogOut,
  Settings,
  Calendars,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

import { createClient } from "@/lib/supabase/client"

export function MemberSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const supabase = React.useMemo(() => createClient(), [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  const isMembershipActive = pathname.startsWith("/dashboard/keanggotaan")

  return (
    <Sidebar>
      {/* =========================
          HEADER
      ========================= */}
      <SidebarHeader className="flex h-16 flex-row items-center gap-3 border-b border-sidebar-border px-4">
        <img
          src="/Asproka-logo.png"
          alt="Logo Asproka"
          className="w-8 object-contain brightness-0 invert"
        />
        <div className="flex flex-col">
          <h2 className="text-base leading-none font-semibold tracking-tight uppercase">
            Asproka
          </h2>
          <p className="mt-1 text-xs text-blue-100/90">Member Portal</p>
        </div>
      </SidebarHeader>

      {/* =========================
          CONTENT
      ========================= */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {/* =========================
                  DASHBOARD
              ========================= */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard" className="flex items-center gap-3">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* =========================
                  KEANGGOTAAN (COLLAPSIBLE)
              ========================= */}
              <Collapsible
                asChild
                defaultOpen={isMembershipActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isMembershipActive}>
                      <CreditCard className="h-4 w-4" />
                      <span>Keanggotaan</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {/* KARTU ANGGOTA */}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === "/dashboard/keanggotaan/kartu"}
                        >
                          <Link href="/dashboard/keanggotaan/kartu">
                            <span>Kartu Anggota</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* SERTIFIKAT */}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={
                            pathname === "/dashboard/keanggotaan/sertifikat"
                          }
                        >
                          <Link href="/dashboard/keanggotaan/sertifikat">
                            <span>Sertifikat Anggota</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard/kegiatan">
                <Calendars />
                <span>Kegiatan Asosiasi</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard/sertifikat">
                <Award />
                <span>Sertifikat Kegiatan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard/pengaturan">
                <Settings />
                <span>Pengaturan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroup>
      </SidebarContent>

      {/* =========================
          FOOTER
      ========================= */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="h-10 rounded-lg text-blue-100/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
