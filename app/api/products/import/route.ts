import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// POST endpoint for CSV import (single product) — new schema
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    console.log("[v0] Importing product:", body.title)

    // Validate required fields (new schema — no affiliate_url or rating required)
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const price = Number.parseFloat(body.price || "0")
    if (!body.price || price <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 })
    }

    if (!body.collection_id && !body.category_id) {
      return NextResponse.json({ error: "Collection/Category is required" }, { status: 400 })
    }

    const collectionId = body.collection_id || body.category_id

    // Generate handle
    const handle = generateHandle(body.title)

    // Convert specs array to specifications object
    let specifications: Record<string, string> | null = null
    if (Array.isArray(body.specs) && body.specs.length > 0) {
      specifications = {}
      for (const spec of body.specs) {
        if (spec?.key && spec?.value) specifications[spec.key] = spec.value
      }
    }

    // Resolve featured image
    const imageUrls: string[] = Array.isArray(body.images)
      ? body.images.map((i: any) => (typeof i === "string" ? i : i.url || i.image_url)).filter(Boolean)
      : []
    const featuredImageUrl = body.featured_image_url || imageUrls[0] || null

    // Insert product with new schema
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        title: body.title,
        handle,
        description: body.description || body.short_description || null,
        description_html: body.description_html || null,
        product_type: body.product_type || body.brand_name || null,
        collection_id: collectionId,
        featured_image_url: featuredImageUrl,
        featured_image_alt_text: body.featured_image_alt_text || body.title,
        min_price: price,
        max_price: Number.parseFloat(body.max_price || body.original_price || body.price || "0"),
        specifications: specifications || null,
      })
      .select()
      .single()

    if (productError) {
      console.error("[v0] Product insert error:", productError)
      throw productError
    }

    // Insert product images
    if (imageUrls.length > 0) {
      const imageInserts = imageUrls.map((url: string, index: number) => ({
        product_id: product.id,
        image_url: url,
        alt_text: body.title,
        display_order: index,
      }))
      await supabase.from("product_images").insert(imageInserts)
    }

    // Create default variant
    await supabase.from("variants").insert({
      product_id: product.id,
      title: body.title,
      sku: body.sku || null,
      price,
      available_for_sale: true,
      position: 0,
    })

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error importing product:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import product" },
      { status: 500 },
    )
  }
}
