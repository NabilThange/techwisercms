"use client"

import { Badge } from "@/components/ui/badge"
import DashboardCard from "@/components/dashboard/card"
import type { SecurityStatus as SecurityStatusType } from "@/types/dashboard"
import Image from "next/image"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Bullet } from "@/components/ui/bullet"
import useSWR from "swr"

const securityStatusItemVariants = cva("border rounded-md ring-4", {
  variants: {
    variant: {
      success: "border-success bg-success/5 text-success ring-success/3",
      warning: "border-warning bg-warning/5 text-warning ring-warning/3",
      destructive: "border-destructive bg-destructive/5 text-destructive ring-destructive/3",
    },
  },
  defaultVariants: {
    variant: "success",
  },
})

interface SecurityStatusItemProps extends VariantProps<typeof securityStatusItemVariants> {
  title: string
  value: string
  status: string
  className?: string
}

function SecurityStatusItem({ title, value, status, variant, className }: SecurityStatusItemProps) {
  return (
    <div className={cn(securityStatusItemVariants({ variant }), className)}>
      <div className="flex items-center gap-2 py-1 px-2 border-b border-current">
        <Bullet size="sm" variant={variant} />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="py-1 px-2.5">
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-xs opacity-50">{status}</div>
      </div>
    </div>
  )
}

interface SecurityStatusProps {
  statuses: SecurityStatusType[]
}

const fetcher = async (url: string) => {
  const password = typeof window !== "undefined" ? localStorage.getItem("dashboard_password") : null
  const response = await fetch(url, {
    headers: { "x-dashboard-password": password || "" },
  })
  if (!response.ok) throw new Error("Failed to fetch")
  return response.json()
}

export default function SecurityStatus({ statuses }: SecurityStatusProps) {
  const { data: metricsData, error } = useSWR("/api/dashboard/metrics", fetcher, {
    refreshInterval: 60000, // Refresh every 60 seconds
    fallbackData: null,
    revalidateOnFocus: false,
  })

  const displayStatuses: SecurityStatusType[] = metricsData
    ? [
        {
          title: "DEPLOYMENT SUCCESS",
          value: `${Math.round(metricsData.performanceScore)}%`,
          status: `[${metricsData.deploymentState}]`,
          variant:
            metricsData.performanceScore >= 90
              ? "success"
              : metricsData.performanceScore >= 70
                ? "warning"
                : "destructive",
        },
        {
          title: "SITE STATUS",
          value: metricsData.uptime === 100 ? "ONLINE" : metricsData.uptime === 0 ? "DOWN" : "DEGRADED",
          status: `[${metricsData.uptime}% UPTIME]`,
          variant: metricsData.uptime === 100 ? "success" : metricsData.uptime >= 95 ? "warning" : "destructive",
        },
        {
          title: "RESPONSE TIME",
          value: metricsData.responseTime < 999 ? `${Math.round(metricsData.responseTime)}ms` : "N/A",
          status: metricsData.responseTime < 999 ? "[MEASURED]" : "[UNAVAILABLE]",
          variant:
            metricsData.responseTime < 200 ? "success" : metricsData.responseTime < 500 ? "warning" : "destructive",
        },
      ]
    : [
        {
          title: "LOADING",
          value: "...",
          status: "[FETCHING DATA]",
          variant: "warning",
        },
      ]

  const systemStatus =
    metricsData?.deploymentState === "READY" && metricsData?.uptime === 100
      ? "ONLINE"
      : metricsData?.deploymentState === "ERROR"
        ? "ERROR"
        : metricsData
          ? "DEGRADED"
          : "LOADING"
  const statusVariant =
    systemStatus === "ONLINE"
      ? "outline-success"
      : systemStatus === "ERROR"
        ? "outline-destructive"
        : systemStatus === "LOADING"
          ? "outline-warning"
          : "outline-warning"

  return (
    <DashboardCard
      title="SECURITY STATUS"
      intent="success"
      addon={<Badge variant={statusVariant as any}>{systemStatus}</Badge>}
    >
      <div className="flex flex-col">
        <div className="max-md:order-1 grid grid-cols-3 md:grid-cols-1 gap-4 py-2 px-1 md:max-w-max">
          {displayStatuses.map((item, index) => (
            <SecurityStatusItem
              key={index}
              title={item.title}
              value={item.value}
              status={item.status}
              variant={item.variant}
            />
          ))}
        </div>
        <picture className="md:absolute md:top-0 md:right-0 w-full md:w-auto md:h-full aspect-square min-[2160px]:right-[10%]">
          <Image
            src="/assets/bot_greenprint.gif"
            alt="Security Status"
            width={1000}
            height={1000}
            quality={90}
            className="size-full object-contain"
          />
        </picture>
      </div>
    </DashboardCard>
  )
}
