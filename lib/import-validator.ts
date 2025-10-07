// Data validation logic for imports (new schema)
import type { FileParseResult } from "./file-parsers"
import type { ColumnMapping, ValidationResult, ValidatedRow, ValidationError } from "./import-types"
import type { Category } from "@/types/database"

export async function validateImportData(
  parseResult: FileParseResult,
  columnMapping: ColumnMapping,
  categories: Category[],
): Promise<ValidationResult> {
  const validatedRows: ValidatedRow[] = []
  const newCategories = new Set<string>()
  let warningCount = 0

  for (let i = 0; i < parseResult.rows.length; i++) {
    const row = parseResult.rows[i]
    const rowNumber = i + 2 // +2 because row 1 is header
    const errors: ValidationError[] = []
    const warnings: string[] = []
    const data: Record<string, any> = {}

    // Extract data based on column mapping
    for (const [standardField, csvColumn] of Object.entries(columnMapping)) {
      if (!csvColumn) continue

      const columnIndex = parseResult.headers.indexOf(csvColumn)
      if (columnIndex === -1) continue

      const value = row[columnIndex]?.trim() || ""
      data[standardField] = value
    }

    // Validate required fields
    if (!data.title || data.title === "") {
      errors.push({ row: rowNumber, field: "title", message: "Title is required" })
    } else if (data.title.length > 255) {
      errors.push({ row: rowNumber, field: "title", message: "Title must be under 255 characters" })
    }

    if (!data.price || data.price === "") {
      errors.push({ row: rowNumber, field: "price", message: "Price is required" })
    } else {
      const priceNum = Number.parseFloat(data.price)
      if (Number.isNaN(priceNum) || priceNum <= 0) {
        errors.push({ row: rowNumber, field: "price", message: "Price must be a positive number" })
      } else {
        data.price = priceNum
      }
    }

    if (!data.rating || data.rating === "") {
      errors.push({ row: rowNumber, field: "rating", message: "Rating is required" })
    } else {
      const ratingNum = Number.parseFloat(data.rating)
      if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        errors.push({ row: rowNumber, field: "rating", message: "Rating must be between 1 and 5" })
      } else {
        data.rating = ratingNum
      }
    }

    if (!data.category || data.category === "") {
      errors.push({ row: rowNumber, field: "category", message: "Category is required" })
    } else {
      // Check if category exists or needs to be created
      const categoryExists = categories.some((c) => c.name.toLowerCase() === String(data.category).toLowerCase())
      if (!categoryExists) {
        newCategories.add(String(data.category))
        warnings.push(`Category "${data.category}" will be created`)
      }
    }

    // Validate affiliate_url (required)
    if (!data.affiliate_url || data.affiliate_url === "") {
      errors.push({ row: rowNumber, field: "affiliate_url", message: "Affiliate URL is required" })
    } else {
      try {
        new URL(data.affiliate_url)
      } catch {
        errors.push({ row: rowNumber, field: "affiliate_url", message: "Affiliate URL must be a valid URL" })
      }
    }

    // Validate optional fields
    if (data.original_price && data.original_price !== "") {
      const originalPriceNum = Number.parseFloat(data.original_price)
      if (Number.isNaN(originalPriceNum) || originalPriceNum <= 0) {
        errors.push({ row: rowNumber, field: "original_price", message: "Original price must be a positive number" })
      } else {
        data.original_price = originalPriceNum
      }
    }

    // Optional brand_name: accept as-is (free text in new schema)
    if (data.brand && data.brand !== "") {
      data.brand = String(data.brand)
    }

    if (data.short_description && data.short_description.length > 200) {
      errors.push({
        row: rowNumber,
        field: "short_description",
        message: "Short description must be under 200 characters",
      })
    }

    // Parse array fields
    if (data.images && data.images !== "") {
      const imageUrls = data.images
        .split(",")
        .map((url: string) => url.trim())
        .filter((url: string) => url !== "")
      data.images = imageUrls
    }

    if (data.pros && data.pros !== "") {
      data.pros = data.pros
        .split("|")
        .map((p: string) => p.trim())
        .filter((p: string) => p !== "")
    }

    if (data.cons && data.cons !== "") {
      data.cons = data.cons
        .split("|")
        .map((c: string) => c.trim())
        .filter((c: string) => c !== "")
    }

    if (data.specs && data.specs !== "") {
      const specPairs = data.specs.split("|").map((s: string) => s.trim())
      const specs: Array<{ key: string; value: string }> = []
      for (const pair of specPairs) {
        const [key, value] = pair.split(":").map((s) => s.trim())
        if (key && value) {
          specs.push({ key, value })
        }
      }
      data.specs = specs
    }

    // Parse boolean fields
    if (data.in_stock !== undefined && data.in_stock !== "") {
      const stockValue = data.in_stock.toLowerCase()
      data.in_stock = ["true", "1", "yes"].includes(stockValue)
    } else {
      data.in_stock = true
    }

    if (data.featured !== undefined && data.featured !== "") {
      const featuredValue = data.featured.toLowerCase()
      data.featured = ["true", "1", "yes"].includes(featuredValue)
    } else {
      data.featured = false
    }

    // Parse YouTube video ID
    if (data.youtube_video_id && data.youtube_video_id !== "") {
      const ytValue = data.youtube_video_id.trim()
      if (ytValue.includes("youtube.com") || ytValue.includes("youtu.be")) {
        const match = ytValue.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
        if (match) {
          data.youtube_video_id = match[1]
        }
      }
    }

    if (warnings.length > 0) {
      warningCount++
    }

    validatedRows.push({
      rowNumber,
      data,
      errors,
      warnings,
      isValid: errors.length === 0,
    })
  }

  return {
    rows: validatedRows,
    validCount: validatedRows.filter((r) => r.isValid).length,
    errorCount: validatedRows.filter((r) => !r.isValid).length,
    warningCount,
    newCategories: Array.from(newCategories),
  }
}
