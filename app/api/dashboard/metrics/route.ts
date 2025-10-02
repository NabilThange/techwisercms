import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-dashboard-password")
  if (password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { VERCEL_API_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID, NEXT_PUBLIC_SITE1_URL } = process.env

    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
      console.log("[v0] Missing environment variables for metrics")
      return NextResponse.json({ error: "Missing required environment variables" }, { status: 500 })
    }

    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "?"
    const deploymentsUrl = `https://api.vercel.com/v6/deployments${teamParam}&projectId=${VERCEL_PROJECT_ID}&limit=10`

    console.log("[v0] Fetching deployment status from:", deploymentsUrl)

    const deployResponse = await fetch(deploymentsUrl, {
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text()
      console.error("[v0] Vercel API error:", deployResponse.status, errorText)
      throw new Error(`Vercel API error: ${deployResponse.status}`)
    }

    const deployData = await deployResponse.json()
    console.log("[v0] Received deployments for metrics:", deployData.deployments?.length || 0)

    const latestDeployment = deployData.deployments?.[0]
    const readyDeployments = deployData.deployments?.filter((d: any) => d.state === "READY") || []
    const errorDeployments = deployData.deployments?.filter((d: any) => d.state === "ERROR") || []

    const successRate =
      deployData.deployments?.length > 0 ? (readyDeployments.length / deployData.deployments.length) * 100 : 0

    const uptime =
      latestDeployment?.state === "READY"
        ? 100
        : latestDeployment?.state === "ERROR"
          ? 0
          : latestDeployment?.state === "BUILDING"
            ? 95
            : 50

    let responseTime = 0
    if (NEXT_PUBLIC_SITE1_URL) {
      try {
        const startTime = Date.now()
        const siteResponse = await fetch(NEXT_PUBLIC_SITE1_URL, {
          method: "HEAD",
          cache: "no-store",
        })
        responseTime = Date.now() - startTime
        console.log("[v0] Site response time:", responseTime, "ms")
      } catch (error) {
        console.error("[v0] Failed to check site response time:", error)
        responseTime = 999 // Indicate site is down
      }
    }

    let buildTime = 0
    if (latestDeployment?.buildingAt && latestDeployment?.ready) {
      buildTime = Math.round(
        (new Date(latestDeployment.ready).getTime() - new Date(latestDeployment.buildingAt).getTime()) / 1000,
      )
    }

    const metrics = {
      performanceScore: Math.round(successRate),
      uptime,
      responseTime: responseTime || 999,
      buildTime,
      lastDeployment: latestDeployment || null,
      totalDeployments: deployData.deployments?.length || 0,
      readyDeployments: readyDeployments.length,
      errorDeployments: errorDeployments.length,
      deploymentState: latestDeployment?.state || "UNKNOWN",
    }

    console.log("[v0] Calculated real metrics:", metrics)

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("[v0] Metrics error:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
