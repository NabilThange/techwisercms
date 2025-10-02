"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"
import type { FileParseResult } from "@/lib/file-parsers"
import type { ColumnMapping } from "@/lib/import-types"
import type { Category, Brand } from "@/types/database"

type Props = {
  parseResult: FileParseResult
  categories: Category[]
  brands: Brand[]
  onBack: () => void
  onNext: (mapping: ColumnMapping) => void
}

const STANDARD_FIELDS = [
  { key: "title", label: "Title", required: true },
  { key: "category", label: "Category", required: true },
  { key: "brand", label: "Brand", required: false },
  { key: "price", label: "Price", required: true },
  { key: "original_price", label: "Original Price", required: false },
  { key: "rating", label: "Rating", required: true },
  { key: "short_description", label: "Short Description", required: false },
  { key: "description", label: "Description", required: false },
  { key: "images", label: "Images (comma-separated URLs)", required: false },
  { key: "pros", label: "Pros (pipe-separated)", required: false },
  { key: "cons", label: "Cons (pipe-separated)", required: false },
  { key: "specs", label: "Specs (pipe-separated key:value)", required: false },
  { key: "in_stock", label: "In Stock", required: false },
  { key: "featured", label: "Featured", required: false },
  { key: "youtube_video_id", label: "YouTube Video ID", required: false },
]

export function ColumnMappingStep({ parseResult, onBack, onNext }: Props) {
  const [mapping, setMapping] = useState<ColumnMapping>({})

  // Auto-detect column mappings
  useEffect(() => {
    const autoMapping: ColumnMapping = {}

    for (const field of STANDARD_FIELDS) {
      const matchedHeader = parseResult.headers.find((header) => {
        const normalized = header.toLowerCase().replace(/[_\s-]/g, "")
        const fieldNormalized = field.key.toLowerCase().replace(/[_\s-]/g, "")
        return normalized === fieldNormalized || normalized.includes(fieldNormalized)
      })

      if (matchedHeader) {
        autoMapping[field.key] = matchedHeader
      }
    }

    setMapping(autoMapping)
  }, [parseResult.headers])

  function handleMappingChange(fieldKey: string, columnName: string | null) {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: columnName,
    }))
  }

  function validateMapping(): boolean {
    const requiredFields = STANDARD_FIELDS.filter((f) => f.required)
    return requiredFields.every((field) => mapping[field.key])
  }

  const isValid = validateMapping()
  const mappedCount = Object.values(mapping).filter((v) => v !== null).length

  return (
    <div className="grid gap-6">
      {/* Status */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              Mapped {mappedCount} of {STANDARD_FIELDS.length} columns
            </span>
            <Badge variant={isValid ? "default" : "secondary"}>
              {isValid ? "Ready to proceed" : "Missing required fields"}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Mapping Grid */}
      <div className="grid gap-4">
        <h3 className="font-semibold">Map Your Columns</h3>
        <div className="grid gap-3">
          {STANDARD_FIELDS.map((field) => (
            <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
              <Label className="flex items-center gap-2">
                {field.label}
                {field.required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
              </Label>
              <Select
                value={mapping[field.key] || "skip"}
                onValueChange={(value) => handleMappingChange(field.key, value === "skip" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">-- Skip this field --</SelectItem>
                  {parseResult.headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Warning */}
      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please map all required fields: title, category, price, and rating</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={() => onNext(mapping)} disabled={!isValid}>
          Continue to Validation
        </Button>
      </div>
    </div>
  )
}
