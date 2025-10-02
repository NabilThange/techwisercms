import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.from("categories").select("*").order("name")

    if (error) {
      console.error("[v0] Error fetching categories:", error)
      throw error
    }

    return NextResponse.json({ categories: data || [] })
  } catch (error) {
    console.error("[v0] Error fetching categories:", error)
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

    // Check if category already exists
    const { data: existing } = await supabase.from("categories").select("id").eq("name", body.name).single()

    if (existing) {
      return NextResponse.json({ category: existing }, { status: 200 })
    }

    // Create new category
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating category:", error)
      throw error
    }

    return NextResponse.json({ category: data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating category:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 500 },
    )
  }
}
