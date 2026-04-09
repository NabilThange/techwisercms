import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// Collections (formerly categories) API
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .order("title")

    if (error) {
      console.error("[v0] Error fetching collections:", error)
      throw error
    }

    // Return as 'categories' for backward compatibility
    return NextResponse.json({ categories: data || [] })
  } catch (error) {
    console.error("[v0] Error fetching collections:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    if (!body.name || !body.slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    // Check if collection already exists
    const { data: existing } = await supabase
      .from("collections")
      .select("id")
      .eq("title", body.name)
      .single()

    if (existing) {
      return NextResponse.json({ category: existing }, { status: 200 })
    }

    // Create new collection
    const { data, error } = await supabase
      .from("collections")
      .insert({
        title: body.name,
        handle: body.slug,
        description: body.description || null,
        image_url: body.image_url || null,
        image_alt_text: body.image_alt_text || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating collection:", error)
      throw error
    }

    return NextResponse.json({ category: data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating collection:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 500 },
    )
  }
}
