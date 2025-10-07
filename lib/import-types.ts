// Type definitions for the import system

export type ColumnMapping = {
  [standardField: string]: string | null // Maps standard field names to CSV column names
}

export type ValidationError = {
  row: number
  field: string
  message: string
}

export type ValidatedRow = {
  rowNumber: number
  data: Record<string, any>
  errors: ValidationError[]
  warnings: string[]
  isValid: boolean
}

export type ValidationResult = {
  rows: ValidatedRow[]
  validCount: number
  errorCount: number
  warningCount: number
  newCategories: string[]
}

export type ImportResult = {
  totalRows: number
  successCount: number
  failedCount: number
  skippedCount: number
  createdCategories: string[]
  errors: Array<{ row: number; message: string }>
  duration: number
}
