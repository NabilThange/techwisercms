import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// POST bulk operations (publish, unpublish, delete)
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    const { action, productIds } = body

    if (!action || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "Invalid request. Action and productIds are required." }, { status: 400 })
    }

    console.log("[v0] Bulk operation:", action, "on", productIds.length, "products")

    let result

    switch (action) {
      case "publish":
        result = await supabase.from("products").update({ in_stock: true }).in("id", productIds)
        break

      case "unpublish":
        result = await supabase.from("products").update({ in_stock: false }).in("id", productIds)
        break

      case "delete":
        result = await supabase.from("products").delete().in("id", productIds)
        break

      default:
        return NextResponse.json({ error: "Invalid action. Use: publish, unpublish, or delete" }, { status: 400 })
    }

    if (result.error) {
      console.error("[v0] Bulk operation error:", result.error)
      throw result.error
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}ed ${productIds.length} product(s)`,
    })
  } catch (error) {
    console.error("[v0] Error in bulk operation:", error)
    return NextResponse.json({ error: "Failed to perform bulk operation" }, { status: 500 })
  }
}
