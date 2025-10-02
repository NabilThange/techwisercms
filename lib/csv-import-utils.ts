// CSV Import Utilities for Product Import

export type ParsedProduct = {
  rowNumber: number
  data: {
    title: string
    category_id?: string
    category_name?: string
    brand_id?: string
    brand_name?: string
    price: number
    original_price?: number
    rating: number
    short_description?: string
    description?: string
    images?: string[]
    pros?: string[]
    cons?: string[]
    specs?: Array<{ key: string; value: string }>
    in_stock?: boolean
    featured?: boolean
    youtube_video_id?: string
    main_image_url?: string
  }
  errors: string[]
}

export type ImportSummary = {
  totalRows: number
  inserted: number
  updated: number
  failed: number
  errors: Array<{ row: number; errors: string[] }>
}

// Column name aliases mapping
const COLUMN_ALIASES: Record<string, string[]> = {
  title: ["name", "product_name"],
  price: ["cost", "selling_price"],
  original_price: ["mrp", "list_price", "was_price"],
  short_description: ["summary", "tagline"],
  description: ["details", "full_description"],
  images: ["image_urls", "img_urls", "photos"],
  category_id: ["category", "category_name"],
  brand_id: ["brand", "brand_name"],
  in_stock: ["stock", "available", "availability"],
  youtube_video_id: ["youtube_url", "video_url", "yt_url"],
}

// Normalize header name to standard field name
function normalizeHeader(header: string): string {
  const normalized = header.trim().toLowerCase().replace(/\s+/g, "_")

  // Check if it's already a standard field
  if (Object.keys(COLUMN_ALIASES).includes(normalized)) {
    return normalized
  }

  // Check aliases
  for (const [standard, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(normalized)) {
      return standard
    }
  }

  return normalized
}

// Parse CSV text into rows
export function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = lines[0].split(",").map((h) => normalizeHeader(h))
  const rows = lines.slice(1).map((line) => {
    // Simple CSV parsing (doesn't handle quoted commas)
    return line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
  })

  return { headers, rows }
}

// Validate and parse a single row
export function validateAndParseRow(
  headers: string[],
  row: string[],
  rowNumber: number,
  categories: Array<{ id: string; name: string }>,
  brands: Array<{ id: string; name: string }>,
): ParsedProduct {
  const errors: string[] = []
  const data: any = {}

  // Create a map of header -> value
  const rowData: Record<string, string> = {}
  headers.forEach((header, index) => {
    rowData[header] = row[index] || ""
  })

  // Required: title
  if (!rowData.title || rowData.title.trim() === "") {
    errors.push("Title is required")
  } else if (rowData.title.length > 255) {
    errors.push("Title must be under 255 characters")
  } else {
    data.title = rowData.title.trim()
  }

  // Required: price
  if (!rowData.price || rowData.price.trim() === "") {
    errors.push("Price is required")
  } else {
    const priceNum = Number.parseFloat(rowData.price)
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      errors.push("Price must be a positive number")
    } else {
      data.price = priceNum
    }
  }

  // Optional: original_price
  if (rowData.original_price && rowData.original_price.trim() !== "") {
    const originalPriceNum = Number.parseFloat(rowData.original_price)
    if (Number.isNaN(originalPriceNum) || originalPriceNum <= 0) {
      errors.push("Original price must be a positive number")
    } else {
      data.original_price = originalPriceNum
    }
  }

  // Required: rating
  if (!rowData.rating || rowData.rating.trim() === "") {
    errors.push("Rating is required")
  } else {
    const ratingNum = Number.parseFloat(rowData.rating)
    if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.push("Rating must be between 1 and 5")
    } else {
      data.rating = ratingNum
    }
  }

  // Required: category (can be ID or name)
  if (!rowData.category_id || rowData.category_id.trim() === "") {
    errors.push("Category is required")
  } else {
    const categoryValue = rowData.category_id.trim()
    // Check if it's a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryValue)

    if (isUuid) {
      const categoryExists = categories.some((c) => c.id === categoryValue)
      if (!categoryExists) {
        errors.push(`Category ID "${categoryValue}" not found`)
      } else {
        data.category_id = categoryValue
      }
    } else {
      // Try to find by name
      const category = categories.find((c) => c.name.toLowerCase() === categoryValue.toLowerCase())
      if (!category) {
        errors.push(`Category "${categoryValue}" not found`)
      } else {
        data.category_id = category.id
      }
    }
  }

  // Optional: brand (can be ID or name)
  if (rowData.brand_id && rowData.brand_id.trim() !== "") {
    const brandValue = rowData.brand_id.trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brandValue)

    if (isUuid) {
      const brandExists = brands.some((b) => b.id === brandValue)
      if (!brandExists) {
        errors.push(`Brand ID "${brandValue}" not found`)
      } else {
        data.brand_id = brandValue
      }
    } else {
      const brand = brands.find((b) => b.name.toLowerCase() === brandValue.toLowerCase())
      if (!brand) {
        errors.push(`Brand "${brandValue}" not found`)
      } else {
        data.brand_id = brand.id
      }
    }
  }

  // Optional: short_description
  if (rowData.short_description && rowData.short_description.trim() !== "") {
    const shortDesc = rowData.short_description.trim()
    if (shortDesc.length > 200) {
      errors.push("Short description must be under 200 characters")
    } else {
      data.short_description = shortDesc
    }
  }

  // Optional: description
  if (rowData.description && rowData.description.trim() !== "") {
    data.description = rowData.description.trim()
  }

  // Optional: images (comma-separated URLs)
  if (rowData.images && rowData.images.trim() !== "") {
    const imageUrls = rowData.images
      .split(",")
      .map((url) => url.trim())
      .filter((url) => url !== "")

    // Validate URLs
    const invalidUrls = imageUrls.filter((url) => {
      try {
        new URL(url)
        return false
      } catch {
        return true
      }
    })

    if (invalidUrls.length > 0) {
      errors.push(`Invalid image URLs: ${invalidUrls.join(", ")}`)
    } else {
      data.images = imageUrls
      if (imageUrls.length > 0) {
        data.main_image_url = imageUrls[0]
      }
    }
  }

  // Optional: pros (pipe-separated)
  if (rowData.pros && rowData.pros.trim() !== "") {
    data.pros = rowData.pros
      .split("|")
      .map((p) => p.trim())
      .filter((p) => p !== "")
  }

  // Optional: cons (pipe-separated)
  if (rowData.cons && rowData.cons.trim() !== "") {
    data.cons = rowData.cons
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "")
  }

  // Optional: specs (pipe-separated key:value pairs)
  if (rowData.specs && rowData.specs.trim() !== "") {
    const specPairs = rowData.specs.split("|").map((s) => s.trim())
    const specs: Array<{ key: string; value: string }> = []

    for (const pair of specPairs) {
      const [key, value] = pair.split(":").map((s) => s.trim())
      if (key && value) {
        specs.push({ key, value })
      }
    }

    if (specs.length > 0) {
      data.specs = specs
    }
  }

  // Optional: in_stock (boolean)
  if (rowData.in_stock && rowData.in_stock.trim() !== "") {
    const stockValue = rowData.in_stock.trim().toLowerCase()
    if (["true", "1", "yes"].includes(stockValue)) {
      data.in_stock = true
    } else if (["false", "0", "no"].includes(stockValue)) {
      data.in_stock = false
    } else {
      errors.push(`Invalid in_stock value: "${rowData.in_stock}". Use true/false or 1/0`)
    }
  } else {
    data.in_stock = true // Default
  }

  // Optional: featured (boolean)
  if (rowData.featured && rowData.featured.trim() !== "") {
    const featuredValue = rowData.featured.trim().toLowerCase()
    if (["true", "1", "yes"].includes(featuredValue)) {
      data.featured = true
    } else if (["false", "0", "no"].includes(featuredValue)) {
      data.featured = false
    } else {
      errors.push(`Invalid featured value: "${rowData.featured}". Use true/false or 1/0`)
    }
  } else {
    data.featured = false // Default
  }

  // Optional: youtube_video_id
  if (rowData.youtube_video_id && rowData.youtube_video_id.trim() !== "") {
    const ytValue = rowData.youtube_video_id.trim()
    // If it's a URL, extract the ID
    if (ytValue.includes("youtube.com") || ytValue.includes("youtu.be")) {
      const match = ytValue.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
      if (match) {
        data.youtube_video_id = match[1]
      } else {
        errors.push(`Could not extract YouTube video ID from: "${ytValue}"`)
      }
    } else {
      data.youtube_video_id = ytValue
    }
  }

  return {
    rowNumber,
    data,
    errors,
  }
}

// Generate CSV template
export function generateCsvTemplate(): string {
  const headers = [
    "title",
    "category_id",
    "brand_id",
    "price",
    "original_price",
    "rating",
    "short_description",
    "description",
    "images",
    "pros",
    "cons",
    "specs",
    "in_stock",
    "featured",
    "youtube_video_id",
  ]

  const exampleRow = [
    "Awesome Wireless Headphones",
    "category-uuid-or-name",
    "brand-uuid-or-name",
    "9999.00",
    "12999.00",
    "4",
    "Premium wireless headphones with noise cancellation",
    "These headphones deliver exceptional audio quality with deep bass and crystal clear highs. Perfect for music lovers and professionals.",
    "https://example.com/img1.jpg,https://example.com/img2.jpg",
    "Great sound quality|Comfortable fit|Long battery life",
    "Expensive|Slightly heavy",
    "Battery:30 hours|Weight:250g|Bluetooth:5.0",
    "true",
    "false",
    "dQw4w9WgXcQ",
  ]

  return `${headers.join(",")}\n${exampleRow.join(",")}\n`
}
