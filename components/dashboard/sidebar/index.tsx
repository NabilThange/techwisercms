"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import MonkeyIcon from "@/components/icons/monkey"
import DotsVerticalIcon from "@/components/icons/dots-vertical"
import { Bullet } from "@/components/ui/bullet"
import LockIcon from "@/components/icons/lock"
import Image from "next/image"
import { useIsV0 } from "@/lib/v0-context"

// This is sample data for the sidebar
const data = {
  navMain: [
    {
      title: "Tools",
      items: [
        {
          title: "Overview",
          url: "/",
          icon: BracketsIcon,
          isActive: true,
        },
        {
          title: "Products",
          url: "/products",
          icon: BracketsIcon,
          isActive: false,
        },
      ],
    },
  ],
  desktop: {
    title: "Desktop (Online)",
    status: "online",
  },
  user: {
    name: "KRIMSON",
    email: "krimson@joyco.studio",
    avatar: "/avatars/user_krimson.png",
  },
}

export function DashboardSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const isV0 = useIsV0()
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()

  return (
    <Sidebar {...props} className={cn("py-sides", className)}>
      <SidebarHeader
        className="rounded-t-lg flex gap-3 flex-row rounded-b-none cursor-pointer"
        role="button"
        aria-label="Toggle sidebar"
        tabIndex={0}
        onClick={toggleSidebar}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            toggleSidebar()
          }
        }}
      >
        <div className="flex overflow-clip size-12 shrink-0 items-center justify-center rounded bg-sidebar-primary-foreground/10 transition-colors group-hover:bg-sidebar-primary text-sidebar-primary-foreground">
          <MonkeyIcon className="size-10 group-hover:scale-[1.7] origin-top-left transition-transform" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="text-2xl font-display">TECH.WISER.</span>
          <span className="text-xs uppercase">The Rebel for Tech </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {data.navMain.map((group, i) => (
          <SidebarGroup className={cn(i === 0 && "rounded-t-none")} key={group.title}>
            <SidebarGroupLabel>
              <Bullet className="mr-2" />
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem
                    key={item.title}
                    className={cn(item.locked && "opacity-50")}
                    data-disabled={item.locked}
                  >
                    {item.locked ? (
                      <SidebarMenuButton disabled className="cursor-not-allowed">
                        <item.icon className="size-5" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url || (item.url !== "/" && pathname?.startsWith(item.url))}
                      >
                        <Link href={item.url}>
                          <item.icon className="size-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                    {item.locked && (
                      <SidebarMenuBadge>
                        <LockIcon className="size-5 block" />
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SidebarGroup>
          <SidebarGroupLabel>
            <Bullet className="mr-2" />
            User
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger className="flex gap-0.5 w-full group cursor-pointer">
                    <div className="shrink-0 flex size-14 items-center justify-center rounded-lg overflow-clip text-background bg-muted">
                      
                    </div>
                    <span className="truncate text-xl font-display text-muted">{data.user.name}</span>
                    <span className="truncate text-xs uppercase opacity-50 group-hover/item:opacity-100 text-muted">
                      {data.user.email}
                    </span>
                    <DotsVerticalIcon className="ml-auto size-4" />
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" side="bottom" align="end" sideOffset={4}>
                    <div className="flex flex-col">
                      <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
                        <MonkeyIcon className="mr-2 h-4 w-4" />
                        Account
                      </button>
                      <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
                        <GearIcon className="mr-2 h-4 w-4" />
                        Settings
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
