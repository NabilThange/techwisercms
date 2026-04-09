import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// GET single product (with collection, images, variants)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: product, error } = await supabase
      .from("products")
      .select(`
        *,
        collections (
          id,
          title,
          handle
        ),
        product_images (
          id,
          image_url,
          alt_text,
          display_order
        ),
        variants (
          id,
          title,
          sku,
          price,
          compare_at_price,
          available_for_sale
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
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const price = Number.parseFloat(body.price || body.min_price || "0")
    if (price <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 })
    }

    // Convert specifications
    let specifications: Record<string, any> | null = null
    if (body.specifications) {
      specifications = body.specifications
    } else if (Array.isArray(body.specs) && body.specs.length > 0) {
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
        handle: body.handle || generateSlug(body.title),
        description: body.description || body.short_description || null,
        description_html: body.description_html || null,
        product_type: body.product_type || null,
        collection_id: body.collection_id || body.category_id || null,
        featured_image_url: body.featured_image_url || body.main_image_url || null,
        featured_image_alt_text: body.featured_image_alt_text || body.title,
        min_price: price,
        max_price: Number.parseFloat(body.max_price || body.original_price || body.price || "0"),
        specifications: specifications,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Update error:", updateError)
      throw updateError
    }

    // Update product images if provided
    if (body.images && Array.isArray(body.images)) {
      // Delete existing images
      await supabase.from("product_images").delete().eq("product_id", params.id)

      // Insert new images
      if (body.images.length > 0) {
        const imageInserts = body.images.map((img: any, index: number) => ({
          product_id: params.id,
          image_url: typeof img === "string" ? img : img.url || img.image_url,
          alt_text: typeof img === "object" ? img.alt_text : body.title,
          display_order: typeof img === "object" ? img.display_order : index,
        }))

        await supabase.from("product_images").insert(imageInserts)
      }
    }

    // Update variants if provided
    if (body.variants && Array.isArray(body.variants)) {
      // Delete existing variants
      await supabase.from("variants").delete().eq("product_id", params.id)

      // Insert new variants
      if (body.variants.length > 0) {
        const variantInserts = body.variants.map((v: any, index: number) => ({
          product_id: params.id,
          title: v.title || body.title,
          sku: v.sku || null,
          price: Number.parseFloat(v.price || body.price),
          compare_at_price: v.compare_at_price ? Number.parseFloat(v.compare_at_price) : null,
          available_for_sale: v.available_for_sale !== false,
          position: index,
        }))

        await supabase.from("variants").insert(variantInserts)
      }
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

    // Delete product (cascade will handle images and variants)
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