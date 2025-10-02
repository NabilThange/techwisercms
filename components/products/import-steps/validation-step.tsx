"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, AlertCircle, AlertTriangle, Download } from "lucide-react"
import type { FileParseResult } from "@/lib/file-parsers"
import type { ColumnMapping, ValidationResult } from "@/lib/import-types"
import type { Category, Brand } from "@/types/database"
import { validateImportData } from "@/lib/import-validator"

type Props = {
  parseResult: FileParseResult
  columnMapping: ColumnMapping
  categories: Category[]
  brands: Brand[]
  onBack: () => void
  onNext: (result: ValidationResult) => void
}

export function ValidationStep({ parseResult, columnMapping, categories, brands, onBack, onNext }: Props) {
  const [isValidating, setIsValidating] = useState(true)
  const [progress, setProgress] = useState(0)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  useEffect(() => {
    performValidation()
  }, [])

  async function performValidation() {
    setIsValidating(true)
    setProgress(0)

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90))
    }, 100)

    try {
      const result = await validateImportData(parseResult, columnMapping, categories, brands)

      clearInterval(progressInterval)
      setProgress(100)
      setValidationResult(result)
    } catch (error) {
      console.error("[v0] Validation error:", error)
      clearInterval(progressInterval)
    } finally {
      setIsValidating(false)
    }
  }

  function downloadErrorReport() {
    if (!validationResult) return

    const errorRows = validationResult.rows.filter((row) => !row.isValid)
    const headers = ["Row", "Field", "Error"]
    const rows = errorRows.flatMap((row) =>
      row.errors.map((error) => [row.rowNumber, error.field, error.message].join(",")),
    )

    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "validation-errors.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isValidating) {
    return (
      <div className="grid gap-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Validating Data...</h3>
          <p className="text-sm text-muted-foreground mb-4">Checking {parseResult.totalRows} rows for errors</p>
          <Progress value={progress} className="max-w-md mx-auto" />
        </div>
      </div>
    )
  }

  if (!validationResult) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to validate data. Please try again.</AlertDescription>
      </Alert>
    )
  }

  const hasErrors = validationResult.errorCount > 0
  const hasNewEntities = validationResult.newCategories.length > 0 || validationResult.newBrands.length > 0

  return (
    <div className="grid gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Valid Rows</span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold mt-2">{validationResult.validCount}</p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Errors</span>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold mt-2">{validationResult.errorCount}</p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Warnings</span>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold mt-2">{validationResult.warningCount}</p>
        </div>
      </div>

      {/* New Categories/Brands Alert */}
      {hasNewEntities && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>New Categories and Brands Will Be Created</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {validationResult.newCategories.length > 0 && (
                <div>
                  <span className="font-semibold">New Categories:</span>{" "}
                  {validationResult.newCategories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="ml-1">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}
              {validationResult.newBrands.length > 0 && (
                <div>
                  <span className="font-semibold">New Brands:</span>{" "}
                  {validationResult.newBrands.map((brand) => (
                    <Badge key={brand} variant="secondary" className="ml-1">
                      {brand}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors Found</AlertTitle>
          <AlertDescription>
            {validationResult.errorCount} rows have errors and will be skipped during import.
            <Button variant="outline" size="sm" className="ml-4 bg-transparent" onClick={downloadErrorReport}>
              <Download className="mr-2 h-3 w-3" />
              Download Error Report
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Table - First 10 Valid Rows */}
      {validationResult.validCount > 0 && (
        <div className="grid gap-3">
          <h3 className="font-semibold">Preview (First 10 Valid Rows)</h3>
          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Row</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationResult.rows
                  .filter((row) => row.isValid)
                  .slice(0, 10)
                  .map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell className="font-medium">{row.data.title}</TableCell>
                      <TableCell>{row.data.category}</TableCell>
                      <TableCell>{row.data.brand || "-"}</TableCell>
                      <TableCell>₹{row.data.price}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Valid
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Error Preview - First 10 Errors */}
      {hasErrors && (
        <div className="grid gap-3">
          <h3 className="font-semibold">Errors (First 10)</h3>
          <div className="rounded-md border overflow-auto max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Row</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationResult.rows
                  .filter((row) => !row.isValid)
                  .slice(0, 10)
                  .flatMap((row) =>
                    row.errors.map((error, idx) => (
                      <TableRow key={`${row.rowNumber}-${idx}`}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell className="font-medium">{error.field}</TableCell>
                        <TableCell className="text-red-600">{error.message}</TableCell>
                      </TableRow>
                    )),
                  )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={() => onNext(validationResult)} disabled={validationResult.validCount === 0}>
          Import {validationResult.validCount} Products
        </Button>
      </div>
    </div>
  )
}
