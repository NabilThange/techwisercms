import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { generateSlug } from "@/lib/db-utils"

// GET all products with filters and pagination
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    // Get filter parameters
    const category = searchParams.get("category")
    const brand = searchParams.get("brand")
    const search = searchParams.get("search")
    const featured = searchParams.get("featured")
    const inStock = searchParams.get("in_stock")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Calculate pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    let query = supabase
      .from("products")
      .select(
        `
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
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to)

    // Apply filters
    if (category && category !== "all") {
      query = query.eq("category_id", category)
    }

    if (brand && brand !== "all") {
      query = query.eq("brand_id", brand)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (featured === "true") {
      query = query.eq("featured", true)
    }

    if (inStock === "true") {
      query = query.eq("in_stock", true)
    } else if (inStock === "false") {
      query = query.eq("in_stock", false)
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

    if (!body.price || Number.parseFloat(body.price) <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 })
    }

    if (!body.category_id) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    if (!body.main_image_url) {
      return NextResponse.json({ error: "Main product image is required" }, { status: 400 })
    }

    // Generate unique slug
    const slug = generateSlug(body.title)

    // Insert main product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        title: body.title,
        slug: slug,
        short_description: body.short_description || null,
        description: body.description || null,
        price: Number.parseFloat(body.price),
        original_price: body.original_price ? Number.parseFloat(body.original_price) : null,
        currency: body.currency || "INR",
        main_image_url: body.main_image_url,
        rating: body.rating || 0,
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

    console.log("[v0] Product created:", product.id)

    // Insert additional images
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      const imageInserts = body.images.map((img: any, index: number) => ({
        product_id: product.id,
        image_url: img.url,
        alt_text: img.alt_text || body.title,
        display_order: index,
      }))

      const { error: imagesError } = await supabase.from("product_images").insert(imageInserts)

      if (imagesError) {
        console.error("[v0] Images insert error:", imagesError)
      }
    }

    // Insert specifications
    if (body.specs && Array.isArray(body.specs) && body.specs.length > 0) {
      const specInserts = body.specs
        .filter((spec: any) => spec.key && spec.value)
        .map((spec: any, index: number) => ({
          product_id: product.id,
          spec_key: spec.key,
          spec_value: spec.value,
          display_order: index,
        }))

      if (specInserts.length > 0) {
        const { error: specsError } = await supabase.from("product_specs").insert(specInserts)

        if (specsError) {
          console.error("[v0] Specs insert error:", specsError)
        }
      }
    }

    // Insert pros
    if (body.pros && Array.isArray(body.pros) && body.pros.length > 0) {
      const prosInserts = body.pros
        .filter((pro: string) => pro.trim())
        .map((pro: string, index: number) => ({
          product_id: product.id,
          content: pro.trim(),
          type: "pro",
          display_order: index,
        }))

      if (prosInserts.length > 0) {
        const { error: prosError } = await supabase.from("product_pros_cons").insert(prosInserts)

        if (prosError) {
          console.error("[v0] Pros insert error:", prosError)
        }
      }
    }

    // Insert cons
    if (body.cons && Array.isArray(body.cons) && body.cons.length > 0) {
      const consInserts = body.cons
        .filter((con: string) => con.trim())
        .map((con: string, index: number) => ({
          product_id: product.id,
          content: con.trim(),
          type: "con",
          display_order: index,
        }))

      if (consInserts.length > 0) {
        const { error: consError } = await supabase.from("product_pros_cons").insert(consInserts)

        if (consError) {
          console.error("[v0] Cons insert error:", consError)
        }
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
