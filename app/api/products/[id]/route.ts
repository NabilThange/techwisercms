import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { generateSlug } from "@/lib/db-utils"

// GET single product (with category)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      throw error
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("[v0] Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PUT update product (new schema)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    console.log("[v0] Updating product:", params.id)

    // Validate required fields
    if (!body.title || !body.price || !body.category_id) {
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

    // Normalize additional_images
    let additional_images: string[] | null = null
    if (Array.isArray(body.images) && body.images.length > 0) {
      additional_images = (typeof body.images[0] === "string")
        ? (body.images as string[])
        : (body.images as Array<{ url: string }>).map((i) => i.url).filter(Boolean)
    }

    // Convert specs array to specifications object
    let specifications: Record<string, string> | null = null
    if (Array.isArray(body.specs) && body.specs.length > 0) {
      specifications = {}
      for (const spec of body.specs) {
        if (spec?.key && spec?.value) specifications[spec.key] = spec.value
      }
    }

    // Update product
    const { data: product, error: updateError } = await supabase
      .from("products")
      .update({
        title: body.title,
        slug: body.slug || generateSlug(body.title),
        short_description: body.short_description || null,
        description: body.description || null,
        price: Number.parseFloat(body.price),
        original_price: body.original_price ? Number.parseFloat(body.original_price) : null,
        currency: body.currency || "INR",
        main_image_url: body.main_image_url,
        additional_images,
        rating: body.rating || 0,
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
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Update error:", updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE product
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseServerClient()

    console.log("[v0] Deleting product:", params.id)

    const { error } = await supabase.from("products").delete().eq("id", params.id)

    if (error) {
      console.error("[v0] Delete error:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
