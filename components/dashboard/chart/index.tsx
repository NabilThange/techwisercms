"use client"

import * as React from "react"
import { XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts"
import useSWR from "swr"

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bullet } from "@/components/ui/bullet"
import type { TimePeriod } from "@/types/dashboard"

type ChartDataPoint = {
  date: string
  spendings: number
  sales: number
  coffee: number
}

const chartConfig = {
  spendings: {
    label: "Visitors",
    color: "var(--chart-1)",
  },
  sales: {
    label: "Page Views",
    color: "var(--chart-2)",
  },
  coffee: {
    label: "Engagement",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const fetcher = async (url: string) => {
  const password = typeof window !== "undefined" ? localStorage.getItem("dashboard_password") : null
  const response = await fetch(url, {
    headers: { "x-dashboard-password": password || "" },
  })
  if (!response.ok) throw new Error("Failed to fetch")
  return response.json()
}

export default function DashboardChart() {
  const [activeTab, setActiveTab] = React.useState<TimePeriod>("week")

  const {
    data: analyticsData,
    error,
    isLoading,
  } = useSWR("/api/dashboard/analytics", fetcher, {
    refreshInterval: 30000,
    fallbackData: null,
    revalidateOnFocus: false,
  })

  const handleTabChange = (value: string) => {
    if (value === "week" || value === "month" || value === "year") {
      setActiveTab(value as TimePeriod)
    }
  }

  const transformAnalyticsData = (period: TimePeriod): ChartDataPoint[] => {
    if (!analyticsData?.visitors || !analyticsData?.pageViews) {
      return []
    }

    const visitors = analyticsData.visitors.slice(0, period === "week" ? 7 : period === "month" ? 30 : 365)
    const pageViews = analyticsData.pageViews.slice(0, period === "week" ? 7 : period === "month" ? 30 : 365)

    return visitors.map((item: any, index: number) => {
      const pageViewCount = pageViews[index]?.count || 0
      const visitorCount = item.count || 1

      return {
        date: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        spendings: visitorCount,
        sales: pageViewCount,
        coffee: visitorCount > 0 ? Math.round((pageViewCount / visitorCount) * 100) : 0,
      }
    })
  }

  const formatYAxisValue = (value: number) => {
    if (value === 0) {
      return ""
    }

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
  }

  const renderChart = (data: ChartDataPoint[]) => {
    const hasData = data.length > 0 && data.some((d) => d.spendings > 0 || d.sales > 0 || d.coffee > 0)

    return (
      <div className="bg-accent rounded-lg p-3">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm font-medium">Failed to load analytics data</p>
            <p className="text-xs mt-1">Check your connection and try again</p>
          </div>
        )}

        {!isLoading && !error && !hasData && (
          <div className="text-center text-muted-foreground py-16">
            <p className="text-sm font-medium">No analytics data available</p>
            <p className="text-xs mt-1">
              Vercel Web Analytics API is not publicly accessible. Install @vercel/analytics on Site 1 to track data.
            </p>
          </div>
        )}

        {!isLoading && !error && hasData && (
          <ChartContainer className="md:aspect-[3/1] w-full" config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{
                left: -12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <defs>
                <linearGradient id="fillSpendings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-spendings)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-spendings)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillCoffee" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-coffee)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-coffee)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                horizontal={false}
                strokeDasharray="8 8"
                strokeWidth={2}
                stroke="var(--muted-foreground)"
                opacity={0.3}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={12}
                strokeWidth={1.5}
                className="uppercase text-sm fill-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={0}
                tickCount={6}
                className="text-sm fill-muted-foreground"
                tickFormatter={formatYAxisValue}
                domain={[0, "dataMax"]}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" className="min-w-[200px] px-4 py-3" />}
              />
              <Area
                dataKey="spendings"
                type="linear"
                fill="url(#fillSpendings)"
                fillOpacity={0.4}
                stroke="var(--color-spendings)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                dataKey="sales"
                type="linear"
                fill="url(#fillSales)"
                fillOpacity={0.4}
                stroke="var(--color-sales)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                dataKey="coffee"
                type="linear"
                fill="url(#fillCoffee)"
                fillOpacity={0.4}
                stroke="var(--color-coffee)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="max-md:gap-4">
      <div className="flex items-center justify-between mb-4 max-md:contents">
        <TabsList className="max-md:w-full">
          <TabsTrigger value="week">WEEK</TabsTrigger>
          <TabsTrigger value="month">MONTH</TabsTrigger>
          <TabsTrigger value="year">YEAR</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-6 max-md:order-1">
          {Object.entries(chartConfig).map(([key, value]) => (
            <ChartLegend key={key} label={value.label} color={value.color} />
          ))}
        </div>
      </div>
      <TabsContent value="week" className="space-y-4">
        {renderChart(transformAnalyticsData("week"))}
      </TabsContent>
      <TabsContent value="month" className="space-y-4">
        {renderChart(transformAnalyticsData("month"))}
      </TabsContent>
      <TabsContent value="year" className="space-y-4">
        {renderChart(transformAnalyticsData("year"))}
      </TabsContent>
    </Tabs>
  )
}

export const ChartLegend = ({
  label,
  color,
}: {
  label: string
  color: string
}) => {
  return (
    <div className="flex items-center gap-2 uppercase">
      <Bullet style={{ backgroundColor: color }} className="rotate-45" />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  )
}
