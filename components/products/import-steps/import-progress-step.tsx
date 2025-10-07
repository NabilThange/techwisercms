"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Loader2 } from "lucide-react"
import type { ValidationResult, ImportResult } from "@/lib/import-types"
import { performBulkImport } from "@/lib/import-processor"

type Props = {
  validationResult: ValidationResult
  onComplete: (result: ImportResult) => void
}

export function ImportProgressStep({ validationResult, onComplete }: Props) {
  const [progress, setProgress] = useState(0)
  const [currentRow, setCurrentRow] = useState(0)
  const [status, setStatus] = useState<string>("Preparing import...")

  useEffect(() => {
    startImport()
  }, [])

  async function startImport() {
    const startTime = Date.now()

    try {
      const result = await performBulkImport(validationResult, (current, total, message) => {
        setCurrentRow(current)
        setProgress(Math.round((current / total) * 100))
        setStatus(message)
      })

      const duration = Date.now() - startTime
      onComplete({ ...result, duration })
    } catch (error) {
      console.error("[v0] Import error:", error)
      onComplete({
        totalRows: validationResult.validCount,
        successCount: 0,
        failedCount: validationResult.validCount,
        skippedCount: 0,
        createdCategories: [],
        errors: [{ row: 0, message: error instanceof Error ? error.message : "Import failed" }],
        duration: Date.now() - startTime,
      })
    }
  }

  const totalRows = validationResult.validCount

  return (
    <div className="grid gap-6 py-8">
      <div className="text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Importing Products...</h3>
        <p className="text-muted-foreground mb-6">{status}</p>
      </div>

      <div className="max-w-md mx-auto w-full space-y-4">
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {currentRow} of {totalRows} products
          </span>
          <span>{progress}%</span>
        </div>
      </div>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>Please don't close this window. The import process may take a few minutes.</AlertDescription>
      </Alert>
    </div>
  )
}
