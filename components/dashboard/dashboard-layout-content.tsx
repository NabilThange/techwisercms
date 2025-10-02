"use client"

import { usePathname } from "next/navigation"
import type * as React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import Widget from "@/components/dashboard/widget"
import Notifications from "@/components/dashboard/notifications"
import type { MockData } from "@/types/dashboard"

export function DashboardLayoutContent({
  children,
  mockData,
}: {
  children: React.ReactNode
  mockData: MockData
}) {
  const pathname = usePathname()
  const showRightRail = pathname === "/" || pathname === "/overview"

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides">
      {/* Sidebar - always visible on desktop */}
      <div className="hidden lg:block col-span-2 top-0 relative">
        <DashboardSidebar />
      </div>

      {/* Main content - spans more columns when right rail is hidden */}
      <div className={`col-span-1 ${showRightRail ? "lg:col-span-7" : "lg:col-span-10"}`}>{children}</div>

      {/* Right rail - only rendered on overview page */}
      {showRightRail && (
        <div className="col-span-3 hidden lg:block">
          <div className="space-y-gap py-sides min-h-screen max-h-screen sticky top-0 overflow-clip">
            <Widget widgetData={mockData.widgetData} />
            <Notifications initialNotifications={mockData.notifications} />
            {/* Chat component removed */}
          </div>
        </div>
      )}
    </div>
  )
}
