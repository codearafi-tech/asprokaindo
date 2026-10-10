"use client"

import * as React from "react"

import {
  LayoutDashboard,
  Users,
  LogOut,
  Settings2,
  ChevronRight,
  WalletCards,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const supabase = React.useMemo(() => createClient(), [])

  const isManagementActive = pathname.startsWith("/admin/manajemen")

  const adminItems = [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Verifikasi Anggota",
      url: "/admin/verifikasi",
      icon: Users,
    },
    {
      title: "Keuangan",
      url: "/admin/keuangan",
      icon: WalletCards,
    },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()

    router.replace("/login")
    router.refresh()
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex h-16 flex-row items-center gap-3 border-b px-4">
        <img
          src="/Asproka-logo.png"
          alt="Logo Asproka"
          className="w-8 object-contain"
        />
        <div className="flex flex-col">
          <h2 className="text-base leading-none font-semibold tracking-tight uppercase">
            Asproka
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Admin Panel</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {/* Menu utama */}
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Manajemen */}
              <Collapsible
                asChild
                defaultOpen={isManagementActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Manajemen"
                      isActive={isManagementActive}
                    >
                      <Settings2 className="h-4 w-4" />

                      <span>Manajemen</span>

                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {/* Manajemen Anggota */}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === "/admin/manajemen/anggota"}
                        >
                          <Link href="/admin/manajemen/anggota">
                            <span>Manajemen Anggota</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Manajemen Kegiatan */}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === "/admin/manajemen/kegiatan"}
                        >
                          <Link href="/admin/manajemen/kegiatan">
                            <span>Manajemen Kegiatan</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="h-10 rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
