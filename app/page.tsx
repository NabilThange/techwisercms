import DashboardPageLayout from "@/components/dashboard/layout"
import DashboardStat from "@/components/dashboard/stat"
import DashboardChart from "@/components/dashboard/chart"
import SecurityStatus from "@/components/dashboard/security-status"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"
import QuickActionsCMS from "@/components/cms/quick-actions"
import mockDataJson from "@/mock.json"
import Notifications from "@/components/dashboard/notifications"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function DashboardOverview() {
  const supabaseClient = await getSupabaseServerClient()
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const nf = new Intl.NumberFormat("en-US")

  const [totalRes, activeRes, recentRes] = await Promise.all([
    supabaseClient.from("products").select("id", { count: "exact", head: true }),
    supabaseClient.from("products").select("id", { count: "exact", head: true }).gt("id", ""), // Count all products as "active" (new schema doesn't have in_stock)
    supabaseClient.from("products").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgoIso),
  ])

  const totalCount = totalRes.count || 0
  const activeCount = activeRes.count || 0
  const recentlyAdded = recentRes.count || 0

  // Mock “needs update” from total (approx 3%)
  const needsUpdate = Math.max(0, Math.round(totalCount * 0.03))

  const cmsStats = [
    {
      label: "TOTAL PRODUCTS",
      value: nf.format(totalCount),
      description: "IN CATALOG",
      icon: GearIcon,
      intent: "neutral" as const,
    },
    {
      label: "ACTIVE PRODUCTS",
      value: nf.format(activeCount),
      description: "PUBLISHED",
      icon: ProcessorIcon,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "NEEDS UPDATES",
      value: nf.format(needsUpdate),
      description: "REQUIRES REVIEW",
      icon: BoomIcon,
      intent: "negative" as const,
      direction: "down" as const,
    },
    {
      label: "RECENTLY ADDED",
      value: `+${nf.format(recentlyAdded)}`,
      description: "PAST 7 DAYS",
      icon: GearIcon,
      intent: "neutral" as const,
    },
  ]

  return (
    <DashboardPageLayout
      header={{
        title: "CMS Dashboard",
        description: "Welcome back, Creator • Last updated 12:05",
        icon: BracketsIcon,
      }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <QuickActionsCMS />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {cmsStats.map((stat, index) => (
          <DashboardStat
            key={index}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            intent={stat.intent}
            direction={stat.direction}
          />
        ))}
      </div>

      <div className="mb-6">
        <DashboardChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
        <Notifications initialNotifications={mockDataJson.notifications} />
        <SecurityStatus statuses={mockDataJson.securityStatus} />
      </div>
    </DashboardPageLayout>
  )
}
