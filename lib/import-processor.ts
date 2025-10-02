// Bulk import processor with category/brand auto-creation
import type { ValidationResult, ImportResult } from "./import-types"
import { generateSlug } from "./db-utils"

type ProgressCallback = (current: number, total: number, message: string) => void

export async function performBulkImport(
  validationResult: ValidationResult,
  onProgress: ProgressCallback,
): Promise<ImportResult> {
  const result: ImportResult = {
    totalRows: validationResult.validCount,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    createdCategories: [],
    createdBrands: [],
    errors: [],
    duration: 0,
  }

  const validRows = validationResult.rows.filter((row) => row.isValid)

  // Step 1: Create new categories
  if (validationResult.newCategories.length > 0) {
    onProgress(0, validRows.length, "Creating new categories...")

    for (const categoryName of validationResult.newCategories) {
      try {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryName,
            slug: generateSlug(categoryName),
          }),
        })

        if (response.ok) {
          result.createdCategories.push(categoryName)
        }
      } catch (error) {
        console.error("[v0] Error creating category:", error)
      }
    }
  }

  // Step 2: Create new brands
  if (validationResult.newBrands.length > 0) {
    onProgress(0, validRows.length, "Creating new brands...")

    for (const brandName of validationResult.newBrands) {
      try {
        const response = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: brandName,
            slug: generateSlug(brandName),
          }),
        })

        if (response.ok) {
          result.createdBrands.push(brandName)
        }
      } catch (error) {
        console.error("[v0] Error creating brand:", error)
      }
    }
  }

  // Step 3: Fetch updated categories and brands
  const [categoriesRes, brandsRes] = await Promise.all([fetch("/api/categories"), fetch("/api/brands")])

  const categoriesData = await categoriesRes.json()
  const brandsData = await brandsRes.json()
  const categories = categoriesData.categories || []
  const brands = brandsData.brands || []

  // Step 4: Import products in batches
  const batchSize = 10
  for (let i = 0; i < validRows.length; i += batchSize) {
    const batch = validRows.slice(i, i + batchSize)

    for (const row of batch) {
      const currentIndex = i + batch.indexOf(row) + 1
      onProgress(currentIndex, validRows.length, `Importing product ${currentIndex} of ${validRows.length}...`)

      try {
        // Find category ID
        const category = categories.find((c: any) => c.name.toLowerCase() === row.data.category.toLowerCase())

        // Find brand ID
        const brand = row.data.brand
          ? brands.find((b: any) => b.name.toLowerCase() === row.data.brand.toLowerCase())
          : null

        const productData = {
          title: row.data.title,
          category_id: category?.id,
          brand_id: brand?.id || null,
          price: row.data.price,
          original_price: row.data.original_price || null,
          rating: row.data.rating,
          short_description: row.data.short_description || null,
          description: row.data.description || null,
          images: row.data.images || [],
          pros: row.data.pros || [],
          cons: row.data.cons || [],
          specs: row.data.specs || [],
          in_stock: row.data.in_stock !== false,
          featured: row.data.featured || false,
          youtube_video_id: row.data.youtube_video_id || null,
          main_image_url: row.data.images?.[0] || null,
        }

        const response = await fetch("/api/products/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        })

        if (response.ok) {
          result.successCount++
        } else {
          const errorData = await response.json()
          result.failedCount++
          result.errors.push({
            row: row.rowNumber,
            message: errorData.error || "Failed to import product",
          })
        }
      } catch (error) {
        console.error("[v0] Error importing product:", error)
        result.failedCount++
        result.errors.push({
          row: row.rowNumber,
          message: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Small delay between batches to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return result
}
