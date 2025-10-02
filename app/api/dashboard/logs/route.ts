import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-dashboard-password")
  if (password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { VERCEL_API_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID } = process.env

    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
      console.log("[v0] Missing environment variables for logs")
      return NextResponse.json({ error: "Missing required environment variables" }, { status: 500 })
    }

    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "?"
    const deploymentsUrl = `https://api.vercel.com/v6/deployments${teamParam}&projectId=${VERCEL_PROJECT_ID}&limit=20`

    console.log("[v0] Fetching deployment logs from:", deploymentsUrl)

    const response = await fetch(deploymentsUrl, {
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Vercel API error:", response.status, errorText)
      throw new Error(`Vercel API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Received deployments for logs:", data.deployments?.length || 0)

    const logs =
      data.deployments?.map((deployment: any) => {
        const stateMap: Record<string, string> = {
          READY: "success",
          ERROR: "error",
          BUILDING: "info",
          QUEUED: "info",
          CANCELED: "warning",
        }

        const duration =
          deployment.buildingAt && deployment.ready
            ? new Date(deployment.ready).getTime() - new Date(deployment.buildingAt).getTime()
            : null

        return {
          id: deployment.uid,
          type: stateMap[deployment.state] || "info",
          message: `DEPLOYMENT ${deployment.state}: ${deployment.name || "BUILD"}`,
          timestamp: deployment.created,
          details: {
            state: deployment.state,
            url: deployment.url ? `https://${deployment.url}` : null,
            duration: duration ? `${Math.round(duration / 1000)}s` : null,
            creator: deployment.creator?.username || "System",
          },
        }
      }) || []

    console.log("[v0] Formatted logs:", logs.length)

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("[v0] Logs error:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
