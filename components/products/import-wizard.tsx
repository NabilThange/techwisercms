"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { FileUploadStep } from "./import-steps/file-upload-step"
import { ColumnMappingStep } from "./import-steps/column-mapping-step"
import { ValidationStep } from "./import-steps/validation-step"
import { ImportProgressStep } from "./import-steps/import-progress-step"
import { ImportSummaryStep } from "./import-steps/import-summary-step"
import type { Category } from "@/types/database"
import type { FileParseResult } from "@/lib/file-parsers"
import type { ColumnMapping, ValidationResult, ImportResult } from "@/lib/import-types"

type ImportStep = "upload" | "mapping" | "validation" | "import" | "summary"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

export function ImportWizard({ open, onOpenChange, onCompleted }: Props) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<ImportStep>("upload")
  const [categories, setCategories] = useState<Category[]>([])

  // Step data
  const [parseResult, setParseResult] = useState<FileParseResult | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  async function fetchCategories() {
    try {
      const categoriesRes = await fetch("/api/categories")
      const categoriesData = await categoriesRes.json()
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error("[v0] Error fetching categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    }
  }

  function handleReset() {
    setCurrentStep("upload")
    setParseResult(null)
    setColumnMapping(null)
    setValidationResult(null)
    setImportResult(null)
  }

  function handleClose() {
    handleReset()
    onOpenChange(false)
  }

  function handleComplete() {
    handleReset()
    onCompleted?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>Upload CSV or XLSX files to bulk import products</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            {[
              { key: "upload", label: "Upload" },
              { key: "mapping", label: "Map Columns" },
              { key: "validation", label: "Validate" },
              { key: "import", label: "Import" },
              { key: "summary", label: "Summary" },
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep === step.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : index < ["upload", "mapping", "validation", "import", "summary"].indexOf(currentStep)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-background text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="ml-2 text-sm font-medium">{step.label}</span>
                {index < 4 && <div className="w-12 h-0.5 bg-muted mx-2" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {currentStep === "upload" && (
            <FileUploadStep
              onNext={(result) => {
                setParseResult(result)
                setCurrentStep("mapping")
              }}
            />
          )}

          {currentStep === "mapping" && parseResult && (
            <ColumnMappingStep
              parseResult={parseResult}
              categories={categories}
              onBack={() => setCurrentStep("upload")}
              onNext={(mapping) => {
                setColumnMapping(mapping)
                setCurrentStep("validation")
              }}
            />
          )}

          {currentStep === "validation" && parseResult && columnMapping && (
            <ValidationStep
              parseResult={parseResult}
              columnMapping={columnMapping}
              categories={categories}
              onBack={() => setCurrentStep("mapping")}
              onNext={(result) => {
                setValidationResult(result)
                setCurrentStep("import")
              }}
            />
          )}

          {currentStep === "import" && validationResult && (
            <ImportProgressStep
              validationResult={validationResult}
              onComplete={(result) => {
                setImportResult(result)
                setCurrentStep("summary")
              }}
            />
          )}

          {currentStep === "summary" && importResult && (
            <ImportSummaryStep importResult={importResult} onClose={handleComplete} onStartOver={handleReset} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
