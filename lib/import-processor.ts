// Bulk import processor with category auto-creation (new schema)
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

  // Step 2: Fetch updated categories
  const categoriesRes = await fetch("/api/categories")
  const categoriesData = await categoriesRes.json()
  const categories = categoriesData.categories || []

  // Step 3: Import products in batches
  const batchSize = 10
  for (let i = 0; i < validRows.length; i += batchSize) {
    const batch = validRows.slice(i, i + batchSize)

    for (const row of batch) {
      const currentIndex = i + batch.indexOf(row) + 1
      onProgress(currentIndex, validRows.length, `Importing product ${currentIndex} of ${validRows.length}...`)

      try {
        // Find category/collection ID by name — match title (new) or name (legacy)
        const category = categories.find(
          (c: any) => (c.title || c.name).toLowerCase() === String(row.data.category).toLowerCase()
        )

        const productData = {
          title: row.data.title,
          collection_id: category?.id,
          product_type: row.data.brand_name || row.data.brand || null,
          price: row.data.price,
          max_price: row.data.original_price || null,
          description: row.data.short_description || row.data.description || null,
          description_html: row.data.description || null,
          images: row.data.images || [],
          specs: row.data.specs || [],
          in_stock: row.data.in_stock !== false,
          featured: row.data.featured || false,
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
