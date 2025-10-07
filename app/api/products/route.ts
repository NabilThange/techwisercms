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

    if (search) {
      // search in title/description/brand_name
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,brand_name.ilike.%${search}%`)
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

    if (!body.affiliate_url) {
      return NextResponse.json({ error: "Affiliate URL is required" }, { status: 400 })
    }
    try {
      new URL(body.affiliate_url)
    } catch {
      return NextResponse.json({ error: "Affiliate URL must be a valid URL" }, { status: 400 })
    }

    // Normalize images array to additional_images (array of URLs)
    let additional_images: string[] | undefined
    if (Array.isArray(body.images) && body.images.length > 0) {
      if (typeof body.images[0] === "string") {
        additional_images = body.images as string[]
      } else {
        additional_images = (body.images as Array<{ url: string }>).map((i) => i.url).filter(Boolean)
      }
    }

    // Convert specs array to specifications object
    let specifications: Record<string, string> | undefined
    if (Array.isArray(body.specs) && body.specs.length > 0) {
      specifications = {}
      for (const spec of body.specs) {
        if (spec?.key && spec?.value) specifications[spec.key] = spec.value
      }
    }

    // Generate unique slug
    const slug = generateSlug(body.title)

    // Insert product aligned to new schema
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        title: body.title,
        slug,
        short_description: body.short_description || null,
        description: body.description || null,
        price: Number.parseFloat(body.price),
        original_price: body.original_price ? Number.parseFloat(body.original_price) : null,
        currency: body.currency || "INR",
        main_image_url: body.main_image_url,
        additional_images: additional_images || null,
        rating: body.rating || 0,
        review_count: 0,
        youtube_video_id: body.youtube_video_id || null,
        in_stock: body.in_stock !== false,
        featured: body.featured || false,
        is_published: body.in_stock !== false, // publish if in stock by default
        category_id: body.category_id,
        brand_name: body.brand_name || null,
        affiliate_url: body.affiliate_url,
        specifications: specifications || null,
        pros: Array.isArray(body.pros) ? body.pros : null,
        cons: Array.isArray(body.cons) ? body.cons : null,
      })
      .select()
      .single()

    if (productError) {
      console.error("[v0] Product insert error:", productError)
      throw productError
    }

    console.log("[v0] Product created:", product.id)

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
