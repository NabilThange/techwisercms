"use client"

import { usePathname } from "next/navigation"
import type * as React from "react"

export function RightRailVisibility({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showOnOverview = pathname === "/" || pathname === "/overview"
  if (!showOnOverview) return null
  return <>{children}</>
}
