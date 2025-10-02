"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, AlertCircle, Download, RefreshCw } from "lucide-react"
import type { ImportResult } from "@/lib/import-types"

type Props = {
  importResult: ImportResult
  onClose: () => void
  onStartOver: () => void
}

export function ImportSummaryStep({ importResult, onClose, onStartOver }: Props) {
  const hasErrors = importResult.failedCount > 0
  const hasNewEntities = importResult.createdCategories.length > 0 || importResult.createdBrands.length > 0

  function downloadErrorReport() {
    if (importResult.errors.length === 0) return

    const headers = ["Row", "Error"]
    const rows = importResult.errors.map((error) => [error.row, error.message].join(","))

    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "import-errors.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const successRate = Math.round((importResult.successCount / importResult.totalRows) * 100)

  return (
    <div className="grid gap-6">
      {/* Success Alert */}
      <Alert className={hasErrors ? "border-yellow-500" : "border-green-500"}>
        {hasErrors ? (
          <AlertCircle className="h-4 w-4 text-yellow-600" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
        <AlertTitle className="text-lg">
          {hasErrors ? "Import Completed with Errors" : "Import Completed Successfully!"}
        </AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-1">
            <p>
              Successfully imported <strong>{importResult.successCount}</strong> of{" "}
              <strong>{importResult.totalRows}</strong> products
            </p>
            <p className="text-sm text-muted-foreground">
              Completed in {(importResult.duration / 1000).toFixed(2)} seconds
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Rows</span>
          </div>
          <p className="text-2xl font-bold">{importResult.totalRows}</p>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Successful</span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">{importResult.successCount}</p>
        </div>
        <div className="border rounded-lg p-4 bg-red-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Failed</span>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700">{importResult.failedCount}</p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Success Rate</span>
          </div>
          <p className="text-2xl font-bold">{successRate}%</p>
        </div>
      </div>

      {/* New Entities Created */}
      {hasNewEntities && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>New Categories and Brands Created</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {importResult.createdCategories.length > 0 && (
                <div>
                  <span className="font-semibold">Categories ({importResult.createdCategories.length}):</span>{" "}
                  {importResult.createdCategories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="ml-1">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}
              {importResult.createdBrands.length > 0 && (
                <div>
                  <span className="font-semibold">Brands ({importResult.createdBrands.length}):</span>{" "}
                  {importResult.createdBrands.map((brand) => (
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

      {/* Error Details */}
      {hasErrors && (
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Error Details</h3>
            <Button variant="outline" size="sm" onClick={downloadErrorReport}>
              <Download className="mr-2 h-3 w-3" />
              Download Error Report
            </Button>
          </div>
          <div className="rounded-md border overflow-auto max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Row</TableHead>
                  <TableHead>Error Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importResult.errors.slice(0, 20).map((error, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{error.row}</TableCell>
                    <TableCell className="text-red-600">{error.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {importResult.errors.length > 20 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing 20 of {importResult.errors.length} errors. Download the full report for details.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onStartOver}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Import More Products
        </Button>
        <Button type="button" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
