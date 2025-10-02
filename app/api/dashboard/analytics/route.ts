import { type NextRequest, NextResponse } from "next/server"
import { subDays, format } from "date-fns"

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-dashboard-password")
  if (password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Real analytics would need to be tracked separately or fetched from Site 1's own API
    const now = new Date()
    const visitors: any[] = []
    const pageViews: any[] = []

    // Generate empty data points for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i)
      const dateStr = format(date, "yyyy-MM-dd")

      visitors.push({
        date: dateStr,
        count: 0,
      })

      pageViews.push({
        date: dateStr,
        count: 0,
      })
    }

    const chartData = {
      visitors,
      pageViews,
      topPages: [],
      totalVisitors: 0,
      totalPageViews: 0,
    }

    console.log("[v0] Returning empty analytics data (Vercel Web Analytics API not publicly available)")

    return NextResponse.json(chartData)
  } catch (error) {
    console.error("[v0] Analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
