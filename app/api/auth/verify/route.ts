export async function GET(req: Request) {
  const headerPassword = req.headers.get("x-dashboard-password")
  if (headerPassword && headerPassword === process.env.DASHBOARD_PASSWORD) {
    return Response.json({ ok: true })
  }
  return new Response("Unauthorized", { status: 401 })
}
