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
    if (!body.affiliate_url) {
      return NextResponse.json({ error: "Affiliate URL is required" }, { status: 400 })
    }
    try {
      new URL(body.affiliate_url)
    } catch {
      return NextResponse.json({ error: "Affiliate URL must be a valid URL" }, { status: 400 })
    }

    // Generate unique slug
    let slug = generateSlug(body.title)

    // Ensure slug is unique
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

    // Normalize images and main image
    const imageUrls: string[] = Array.isArray(body.images)
      ? (typeof body.images[0] === "string"
          ? (body.images as string[])
          : (body.images as Array<{ url: string }>).map((i) => i.url))
      : []
    const mainImageUrl = body.main_image_url || imageUrls[0] || "/diverse-products-still-life.png"

    // Convert specs array to specifications object
    let specifications: Record<string, string> | null = null
    if (Array.isArray(body.specs) && body.specs.length > 0) {
      specifications = {}
      for (const spec of body.specs) {
        if (spec?.key && spec?.value) specifications[spec.key] = spec.value
      }
    }

    // Insert product per new schema
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        title: body.title,
        slug,
        short_description: body.short_description || null,
        description: body.description || null,
        price: Number(body.price),
        original_price: body.original_price ? Number(body.original_price) : null,
        currency: "INR",
        main_image_url: mainImageUrl,
        additional_images: imageUrls.length > 0 ? imageUrls : null,
        rating: Number(body.rating),
        review_count: 0,
        youtube_video_id: body.youtube_video_id || null,
        in_stock: body.in_stock !== false,
        featured: body.featured || false,
        is_published: body.in_stock !== false,
        category_id: body.category_id,
        brand_name: body.brand_name || null,
        affiliate_url: body.affiliate_url,
        specifications,
        pros: Array.isArray(body.pros) ? body.pros : null,
        cons: Array.isArray(body.cons) ? body.cons : null,
      })
      .select()
      .single()

    if (productError) {
      console.error("[v0] Product insert error:", productError)
      throw productError
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
