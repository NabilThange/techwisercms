import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// Note: The new schema uses collections instead of brands
// This endpoint is deprecated but kept for backward compatibility
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    // Query collections as brands for backward compatibility
    const { data, error } = await supabase
      .from("collections")
      .select("id, title as name, handle as slug, description, image_url as logo_url")
      .order("title")

    if (error) {
      console.error("[v0] Error fetching brands:", error)
      throw error
    }

    return NextResponse.json({ brands: data || [] })
  } catch (error) {
    console.error("[v0] Error fetching brands:", error)
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    if (!body.name || !body.slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    // Create as collection instead
    const { data: existing } = await supabase
      .from("collections")
      .select("id")
      .eq("title", body.name)
      .single()

    if (existing) {
      return NextResponse.json({ brand: existing }, { status: 200 })
    }

    const { data, error } = await supabase
      .from("collections")
      .insert({
        title: body.name,
        handle: body.slug,
        image_url: body.logo_url || null,
        description: body.description || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating brand:", error)
      throw error
    }

    return NextResponse.json({ brand: data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating brand:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create brand" },
      { status: 500 },
    )
  }
}
