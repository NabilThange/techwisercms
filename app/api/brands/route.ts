import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.from("brands").select("*").order("name")

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

    // Check if brand already exists
    const { data: existing } = await supabase.from("brands").select("id").eq("name", body.name).single()

    if (existing) {
      return NextResponse.json({ brand: existing }, { status: 200 })
    }

    // Create new brand
    const { data, error } = await supabase
      .from("brands")
      .insert({
        name: body.name,
        slug: body.slug,
        logo_url: body.logo_url || null,
        website_url: body.website_url || null,
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
