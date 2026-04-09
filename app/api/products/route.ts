import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// GET all products with filters and pagination
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    // Get filter parameters
    const collection = searchParams.get("category") || searchParams.get("collection")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Calculate pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query - updated for new schema
    let query = supabase
      .from("products")
      .select(
        `
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
          available_for_sale
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to)

    // Apply filters
    if (collection && collection !== "all") {
      query = query.eq("collection_id", collection)
    }

    if (search) {
      // Search in title and description
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("[v0] Database error:", error)
      throw error
    }

    return NextResponse.json({
      products: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// POST new product
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    console.log("[v0] Creating product with data:", body)

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: "Product title is required" }, { status: 400 })
    }

    const price = Number.parseFloat(body.price || body.min_price || "0")
    if (price <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 })
    }

    const collectionId = body.collection_id || body.category_id
    if (!collectionId) {
      return NextResponse.json({ error: "Collection/Category is required" }, { status: 400 })
    }

    // Generate unique slug
    const slug = body.handle || generateSlug(body.title)

    // Convert specifications
    let specifications: Record<string, any> | undefined
    if (body.specifications) {
      specifications = body.specifications
    } else if (Array.isArray(body.specs) && body.specs.length > 0) {
      specifications = {}
      for (const spec of body.specs) {
        if (spec?.key && spec?.value) specifications[spec.key] = spec.value
      }
    }

    // Insert product with new schema
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        title: body.title,
        handle: slug,
        description: body.description || body.short_description || null,
        description_html: body.description_html || null,
        product_type: body.product_type || null,
        collection_id: collectionId,
        featured_image_url: body.featured_image_url || body.main_image_url || null,
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

    console.log("[v0] Product created:", product.id)

    // Insert product images if provided
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      const imageInserts = body.images.map((img: any, index: number) => ({
        product_id: product.id,
        image_url: typeof img === "string" ? img : img.url || img.image_url,
        alt_text: typeof img === "object" ? img.alt_text : body.title,
        display_order: typeof img === "object" ? img.display_order : index,
      }))

      const { error: imagesError } = await supabase.from("product_images").insert(imageInserts)

      if (imagesError) {
        console.error("[v0] Error inserting images:", imagesError)
      }
    }

    // Create default variant if variants provided
    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      const variantInserts = body.variants.map((v: any, index: number) => ({
        product_id: product.id,
        title: v.title || body.title,
        sku: v.sku || null,
        price: Number.parseFloat(v.price || body.price),
        compare_at_price: v.compare_at_price ? Number.parseFloat(v.compare_at_price) : null,
        available_for_sale: v.available_for_sale !== false,
        position: index,
      }))

      const { error: variantsError } = await supabase.from("variants").insert(variantInserts)

      if (variantsError) {
        console.error("[v0] Error inserting variants:", variantsError)
      }
    } else {
      // Create single default variant
      const { error: variantError } = await supabase.from("variants").insert({
        product_id: product.id,
        title: body.title,
        sku: body.sku || null,
        price: price,
        available_for_sale: true,
        position: 0,
      })

      if (variantError) {
        console.error("[v0] Error creating default variant:", variantError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}