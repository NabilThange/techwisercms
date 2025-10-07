"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Download, Upload } from "lucide-react"
import {
  parseCsvText,
  validateAndParseRow,
  generateCsvTemplate,
  type ParsedProduct,
  type ImportSummary,
} from "@/lib/csv-import-utils"
import type { Category } from "@/types/database"

type Props = { onCompleted?: () => void }

export default function ImportCsvDialog({ onCompleted }: Props) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([])
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const categoriesRes = await fetch("/api/categories")
      const categoriesData = await categoriesRes.json()
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error("[v0] Error fetching categories:", error)
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" })
    }
  }

  function downloadTemplate() {
    const csv = generateCsvTemplate()
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "products-import-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(selected: File | null) {
    if (!selected) return
    setFile(selected)
    setParsedProducts([])
    setImportSummary(null)

    if (selected.type === "text/csv" || selected.name.toLowerCase().endsWith(".csv")) {
      const text = await selected.text()
      const { headers, rows } = parseCsvText(text)

      console.log("[v0] CSV headers:", headers)
      console.log("[v0] CSV rows:", rows.length)

      // Validate and parse each row
      const parsed: ParsedProduct[] = []
      for (let i = 0; i < rows.length; i++) {
        const result = validateAndParseRow(headers, rows[i], i + 2, categories) // +2 because row 1 is header
        parsed.push(result)
      }

      setParsedProducts(parsed)

      const validCount = parsed.filter((p) => p.errors.length === 0).length
      const errorCount = parsed.filter((p) => p.errors.length > 0).length

      toast({
        title: "CSV Parsed",
        description: `${validCount} valid rows, ${errorCount} rows with errors`,
      })
    } else {
      toast({ title: "Invalid file type", description: "Please upload a .csv file", variant: "destructive" })
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    handleFile(f || null)
  }

  function onBrowse() {
    inputRef.current?.click()
  }

  async function processImport() {
    if (!file || parsedProducts.length === 0) {
      toast({ title: "No data to import", variant: "destructive" })
      return
    }

    const validProducts = parsedProducts.filter((p) => p.errors.length === 0)
    if (validProducts.length === 0) {
      toast({ title: "No valid products to import", description: "Fix errors and try again", variant: "destructive" })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    const summary: ImportSummary = {
      totalRows: parsedProducts.length,
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    }

    // Process in batches of 10
    const batchSize = 10
    for (let i = 0; i < validProducts.length; i += batchSize) {
      const batch = validProducts.slice(i, i + batchSize)

      for (const product of batch) {
        try {
          // Call the products API to insert
          const response = await fetch("/api/products/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product.data),
          })

          if (response.ok) {
            summary.inserted++
          } else {
            const errorData = await response.json()
            summary.failed++
            summary.errors.push({
              row: product.rowNumber,
              errors: [errorData.error || "Failed to insert product"],
            })
          }
        } catch (error) {
          console.error("[v0] Error inserting product:", error)
          summary.failed++
          summary.errors.push({
            row: product.rowNumber,
            errors: [error instanceof Error ? error.message : "Unknown error"],
          })
        }
      }

      // Update progress
      const progressPercent = Math.min(100, Math.round(((i + batch.length) / validProducts.length) * 100))
      setProgress(progressPercent)
    }

    // Add validation errors to summary
    const invalidProducts = parsedProducts.filter((p) => p.errors.length > 0)
    for (const product of invalidProducts) {
      summary.errors.push({
        row: product.rowNumber,
        errors: product.errors,
      })
    }

    setImportSummary(summary)
    setIsProcessing(false)
    setProgress(100)

    toast({
      title: "Import Complete",
      description: `${summary.inserted} products imported, ${summary.failed + invalidProducts.length} failed`,
    })

    if (summary.inserted > 0) {
      onCompleted?.()
    }
  }

  function downloadFailedRows() {
    if (!importSummary || importSummary.errors.length === 0) return

    const headers = ["row_number", "title", "category_id", "price", "rating", "errors"]
    const rows = importSummary.errors.map((err) => {
      const product = parsedProducts.find((p) => p.rowNumber === err.row)
      return [
        err.row,
        product?.data.title || "",
        product?.data.category_id || "",
        product?.data.price || "",
        product?.data.rating || "",
        err.errors.join("; "),
      ].join(",")
    })

    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "failed-imports.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const validCount = parsedProducts.filter((p) => p.errors.length === 0).length
  const errorCount = parsedProducts.filter((p) => p.errors.length > 0).length

  return (
    <div className="grid gap-6">
      {/* File Upload Area */}
      <div
        className={
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors " +
          (dragActive ? "bg-accent border-primary" : "bg-background border-border")
        }
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        role="button"
        aria-label="Drag and drop CSV"
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">Drag & drop your CSV file here</p>
        <p className="text-sm text-muted-foreground mb-4">or</p>
        <Button type="button" variant="secondary" onClick={onBrowse} size="lg">
          Browse Files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv, text/csv"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        {file && (
          <div className="mt-4">
            <Badge variant="outline" className="text-sm">
              {file.name}
            </Badge>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={downloadTemplate} variant="outline" size="lg">
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
        <Button
          type="button"
          onClick={processImport}
          disabled={!file || parsedProducts.length === 0 || validCount === 0 || isProcessing}
          size="lg"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isProcessing ? "Importing..." : `Import ${validCount} Products`}
        </Button>
        {importSummary && importSummary.errors.length > 0 && (
          <Button type="button" variant="outline" onClick={downloadFailedRows} size="lg">
            <Download className="mr-2 h-4 w-4" />
            Download Failed Rows
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="grid gap-2">
          <Label>Import Progress</Label>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{progress}% complete</p>
        </div>
      )}

      {/* Import Summary */}
      {importSummary && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Import Complete</AlertTitle>
          <AlertDescription>
            <div className="grid gap-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Total Rows:</span>
                <Badge variant="secondary">{importSummary.totalRows}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Successfully Imported:</span>
                <Badge variant="default" className="bg-green-600">
                  {importSummary.inserted}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Failed:</span>
                <Badge variant="destructive">{importSummary.failed + (parsedProducts.length - validCount)}</Badge>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {parsedProducts.length > 0 && errorCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors ({errorCount} rows)</AlertTitle>
          <AlertDescription>
            <div className="mt-2 max-h-48 overflow-y-auto">
              {parsedProducts
                .filter((p) => p.errors.length > 0)
                .slice(0, 10)
                .map((product) => (
                  <div key={product.rowNumber} className="text-sm mb-2">
                    <strong>Row {product.rowNumber}:</strong>
                    <ul className="list-disc ml-5">
                      {product.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              {errorCount > 10 && <p className="text-sm mt-2">... and {errorCount - 10} more errors</p>}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Table */}
      {parsedProducts.length > 0 && validCount > 0 && (
        <div className="grid gap-3">
          <Label className="text-lg font-semibold">Preview (first 10 valid rows)</Label>
          <div className="rounded-md border overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Row</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedProducts
                  .filter((p) => p.errors.length === 0)
                  .slice(0, 10)
                  .map((product) => (
                    <TableRow key={product.rowNumber}>
                      <TableCell>{product.rowNumber}</TableCell>
                      <TableCell className="font-medium">{product.data.title}</TableCell>
                      <TableCell>{product.data.category_id}</TableCell>
                      <TableCell>₹{product.data.price}</TableCell>
                      <TableCell>{product.data.rating}/5</TableCell>
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
          <p className="text-sm text-muted-foreground">Showing 10 of {validCount} valid products ready to import</p>
        </div>
      )}
    </div>
  )
}
