// File parsing utilities for CSV and XLSX imports
import * as XLSX from "xlsx"

export type FileParseResult = {
  headers: string[]
  rows: string[][]
  totalRows: number
  error?: string
}

/**
 * Parse CSV file content
 */
export function parseCSV(text: string): FileParseResult {
  try {
    const lines = text.trim().split(/\r?\n/)

    if (lines.length === 0) {
      return { headers: [], rows: [], totalRows: 0, error: "Empty file" }
    }

    // Parse CSV with proper quote handling
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i++ // Skip next quote
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0])
    const rows = lines.slice(1).map(parseCSVLine)

    return {
      headers,
      rows,
      totalRows: rows.length,
    }
  } catch (error) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      error: error instanceof Error ? error.message : "Failed to parse CSV",
    }
  }
}

/**
 * Parse XLSX file content
 */
export function parseXLSX(arrayBuffer: ArrayBuffer): FileParseResult {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "array" })
    const firstSheetName = workbook.SheetNames[0]

    if (!firstSheetName) {
      return { headers: [], rows: [], totalRows: 0, error: "No sheets found in file" }
    }

    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

    if (jsonData.length === 0) {
      return { headers: [], rows: [], totalRows: 0, error: "Empty sheet" }
    }

    const headers = jsonData[0].map((h) => String(h || ""))
    const rows = jsonData.slice(1).map((row) => row.map((cell) => String(cell ?? "")))

    return {
      headers,
      rows,
      totalRows: rows.length,
    }
  } catch (error) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      error: error instanceof Error ? error.message : "Failed to parse XLSX",
    }
  }
}

/**
 * Validate file before parsing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  const ALLOWED_TYPES = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]
  const ALLOWED_EXTENSIONS = [".csv", ".xls", ".xlsx"]

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 50MB limit" }
  }

  // Check file type
  const hasValidType = ALLOWED_TYPES.includes(file.type)
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))

  if (!hasValidType && !hasValidExtension) {
    return { valid: false, error: "Invalid file type. Please upload CSV or XLSX files only" }
  }

  return { valid: true }
}

/**
 * Parse file based on type
 */
export async function parseFile(file: File): Promise<FileParseResult> {
  const validation = validateFile(file)
  if (!validation.valid) {
    return { headers: [], rows: [], totalRows: 0, error: validation.error }
  }

  const isCSV = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv"

  if (isCSV) {
    const text = await file.text()
    return parseCSV(text)
  } else {
    const arrayBuffer = await file.arrayBuffer()
    return parseXLSX(arrayBuffer)
  }
}
