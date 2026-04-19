"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react"
import { parseFile, type FileParseResult } from "@/lib/file-parsers"
import { useToast } from "@/components/ui/use-toast"
import { CSVFormatGuide } from "../csv-format-guide"

type Props = {
  onNext: (result: FileParseResult) => void
}

export function FileUploadStep({ onNext }: Props) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(selectedFile: File | null) {
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setIsProcessing(true)

    try {
      const result = await parseFile(selectedFile)

      if (result.error) {
        setError(result.error)
        toast({
          title: "Parse Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      if (result.totalRows === 0) {
        setError("File is empty or has no data rows")
        return
      }

      if (result.totalRows > 1000) {
        setError("File contains more than 1000 rows. Please split into smaller files.")
        return
      }

      toast({
        title: "File Parsed Successfully",
        description: `Found ${result.totalRows} rows with ${result.headers.length} columns`,
      })

      onNext(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse file"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  function downloadTemplate() {
    const headers = [
      "title",
      "category",
      "brand_name",
      "price",
      "original_price",
      "short_description",
      "description",
      "images",
      "specs",
      "in_stock",
      "featured",
    ]

    const exampleRow = [
      "Premium Wireless Headphones",
      "Audio",
      "Sony",
      "9999.00",
      "12999.00",
      "Premium wireless headphones with noise cancellation",
      "These headphones deliver exceptional audio quality with deep bass and crystal clear highs. Features active noise cancellation and 30-hour battery life.",
      "https://example.com/img1.jpg,https://example.com/img2.jpg",
      "Battery:30 hours|Weight:250g|Bluetooth:5.0|Driver:40mm",
      "true",
      "true",
    ]

    const csv = `${headers.join(",")}\n${exampleRow.map((v) => `"${v}"`).join(",")}\n`
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "products-import-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive ? "bg-accent border-primary" : "bg-background border-border"
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          handleFile(e.dataTransfer.files?.[0] || null)
        }}
      >
        <FileSpreadsheet className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Upload CSV or XLSX File</h3>
        <p className="text-sm text-muted-foreground mb-4">Drag and drop your file here, or click to browse</p>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isProcessing ? "Processing..." : "Browse Files"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
          className="hidden"
        />

        {file && !error && (
          <div className="mt-4">
            <Badge variant="outline" className="text-sm">
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </Badge>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info */}
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold">File Requirements:</h4>
          <CSVFormatGuide />
        </div>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Maximum file size: 50MB</li>
          <li>Maximum rows: 1000 products per file</li>
          <li>Supported formats: CSV, XLS, XLSX</li>
          <li>Required columns: title, price, category</li>
        </ul>
      </div>

      {/* Template Download */}
      <Button type="button" variant="outline" onClick={downloadTemplate} className="w-full bg-transparent">
        <Download className="mr-2 h-4 w-4" />
        Download Template
      </Button>
    </div>
  )
}
