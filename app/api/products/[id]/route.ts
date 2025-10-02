import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { generateSlug } from "@/lib/db-utils"

// GET single product with all relations
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
        ),
        brands (
          id,
          name,
          slug
        ),
        product_images (
          id,
          image_url,
          alt_text,
          display_order
        ),
        product_specs (
          id,
          spec_key,
          spec_value,
          display_order
        ),
        product_pros_cons (
          id,
          content,
          type,
          display_order
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

    // Organize pros and cons
    const pros =
      product.product_pros_cons
        ?.filter((pc: any) => pc.type === "pro")
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((pc: any) => pc.content) || []

    const cons =
      product.product_pros_cons
        ?.filter((pc: any) => pc.type === "con")
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((pc: any) => pc.content) || []

    // Organize specs
    const specs =
      product.product_specs
        ?.sort((a: any, b: any) => a.display_order - b.display_order)
        .map((spec: any) => ({
          key: spec.spec_key,
          value: spec.spec_value,
        })) || []

    // Organize images
    const images =
      product.product_images
        ?.sort((a: any, b: any) => a.display_order - b.display_order)
        .map((img: any) => ({
          url: img.image_url,
          alt_text: img.alt_text,
        })) || []

    return NextResponse.json({
      product: {
        ...product,
        pros,
        cons,
        specs,
        images,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PUT update product
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    console.log("[v0] Updating product:", params.id)

    // Validate required fields
    if (!body.title || !body.price || !body.category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update main product
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
        rating: body.rating || 0,
        youtube_video_id: body.youtube_video_id || null,
        in_stock: body.in_stock !== false,
        featured: body.featured || false,
        category_id: body.category_id,
        brand_id: body.brand_id || null,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Update error:", updateError)
      throw updateError
    }

    // Delete existing related data
    await supabase.from("product_images").delete().eq("product_id", params.id)
    await supabase.from("product_specs").delete().eq("product_id", params.id)
    await supabase.from("product_pros_cons").delete().eq("product_id", params.id)

    // Re-insert images
    if (body.images && body.images.length > 0) {
      const imageInserts = body.images.map((img: any, index: number) => ({
        product_id: params.id,
        image_url: img.url,
        alt_text: img.alt_text || body.title,
        display_order: index,
      }))

      await supabase.from("product_images").insert(imageInserts)
    }

    // Re-insert specs
    if (body.specs && body.specs.length > 0) {
      const specInserts = body.specs
        .filter((spec: any) => spec.key && spec.value)
        .map((spec: any, index: number) => ({
          product_id: params.id,
          spec_key: spec.key,
          spec_value: spec.value,
          display_order: index,
        }))

      if (specInserts.length > 0) {
        await supabase.from("product_specs").insert(specInserts)
      }
    }

    // Re-insert pros
    if (body.pros && body.pros.length > 0) {
      const prosInserts = body.pros
        .filter((pro: string) => pro.trim())
        .map((pro: string, index: number) => ({
          product_id: params.id,
          content: pro.trim(),
          type: "pro",
          display_order: index,
        }))

      if (prosInserts.length > 0) {
        await supabase.from("product_pros_cons").insert(prosInserts)
      }
    }

    // Re-insert cons
    if (body.cons && body.cons.length > 0) {
      const consInserts = body.cons
        .filter((con: string) => con.trim())
        .map((con: string, index: number) => ({
          product_id: params.id,
          content: con.trim(),
          type: "con",
          display_order: index,
        }))

      if (consInserts.length > 0) {
        await supabase.from("product_pros_cons").insert(consInserts)
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

    // Delete product (cascade will remove related data)
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
