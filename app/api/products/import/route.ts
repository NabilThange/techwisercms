import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { generateSlug } from "@/lib/db-utils"

// POST endpoint for CSV import (single product)
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    console.log("[v0] Importing product:", body.title)

    // Validate required fields
    if (!body.title || !body.price || !body.category_id || !body.rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate unique slug
    let slug = generateSlug(body.title)

    // Check if slug exists and make it unique
    let slugExists = true
    let counter = 1
    while (slugExists) {
      const { data } = await supabase.from("products").select("id").eq("slug", slug).single()
      if (!data) {
        slugExists = false
      } else {
        slug = `${generateSlug(body.title)}-${counter}`
        counter++
      }
    }

    // Set main image URL
    const mainImageUrl = body.main_image_url || body.images?.[0] || "/diverse-products-still-life.png"

    // Insert main product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        title: body.title,
        slug: slug,
        short_description: body.short_description || null,
        description: body.description || null,
        price: body.price,
        original_price: body.original_price || null,
        currency: "INR",
        main_image_url: mainImageUrl,
        rating: body.rating,
        review_count: 0,
        youtube_video_id: body.youtube_video_id || null,
        in_stock: body.in_stock !== false,
        featured: body.featured || false,
        category_id: body.category_id,
        brand_id: body.brand_id || null,
      })
      .select()
      .single()

    if (productError) {
      console.error("[v0] Product insert error:", productError)
      throw productError
    }

    // Insert additional images
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      const imageInserts = body.images.map((url: string, index: number) => ({
        product_id: product.id,
        image_url: url,
        alt_text: body.title,
        display_order: index,
      }))

      await supabase.from("product_images").insert(imageInserts)
    }

    // Insert specifications
    if (body.specs && Array.isArray(body.specs) && body.specs.length > 0) {
      const specInserts = body.specs.map((spec: any, index: number) => ({
        product_id: product.id,
        spec_key: spec.key,
        spec_value: spec.value,
        display_order: index,
      }))

      await supabase.from("product_specs").insert(specInserts)
    }

    // Insert pros
    if (body.pros && Array.isArray(body.pros) && body.pros.length > 0) {
      const prosInserts = body.pros.map((pro: string, index: number) => ({
        product_id: product.id,
        content: pro,
        type: "pro",
        display_order: index,
      }))

      await supabase.from("product_pros_cons").insert(prosInserts)
    }

    // Insert cons
    if (body.cons && Array.isArray(body.cons) && body.cons.length > 0) {
      const consInserts = body.cons.map((con: string, index: number) => ({
        product_id: product.id,
        content: con,
        type: "con",
        display_order: index,
      }))

      await supabase.from("product_pros_cons").insert(consInserts)
    }

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error importing product:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import product" },
      { status: 500 },
    )
  }
}
