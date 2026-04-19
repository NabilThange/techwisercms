"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { HelpCircle } from "lucide-react"

export function CSVFormatGuide() {
  const [open, setOpen] = useState(false)

  const requiredFields = [
    { name: "title", description: "Product name/title", example: "iPhone 15 Pro Max", nullable: false },
    { name: "category", description: "Product category/collection", example: "Smartphones", nullable: false },
    { name: "price", description: "Current selling price in INR", example: "99999.00", nullable: false },
  ]

  const optionalFields = [
    {
      name: "brand_name",
      description: "Brand or product type",
      example: "Apple",
      nullable: true,
      note: "Stored as product_type in new schema",
    },
    {
      name: "original_price",
      description: "Original/max price for showing price range",
      example: "129999.00",
      nullable: true,
      note: "Used to display price range (min_price to max_price)",
    },
    {
      name: "short_description",
      description: "Brief product description",
      example: "Premium smartphone with advanced features",
      nullable: true,
      note: "Max 200 characters",
    },
    {
      name: "description",
      description: "Detailed product description",
      example: "Full HTML or plain text description",
      nullable: true,
      note: "Can be HTML formatted",
    },
    {
      name: "images",
      description: "Product images (comma-separated URLs)",
      example: "https://example.com/img1.jpg,https://example.com/img2.jpg",
      nullable: true,
      note: "First image becomes featured image",
    },
    {
      name: "specs",
      description: "Product specifications (pipe-separated key:value pairs)",
      example: "Storage:256GB|RAM:8GB|Display:6.7 inch",
      nullable: true,
      note: "Format: key1:value1|key2:value2",
    },
    {
      name: "in_stock",
      description: "Product availability status",
      example: "true or false",
      nullable: true,
      note: "Accepts: true/false, 1/0, yes/no",
    },
    {
      name: "featured",
      description: "Whether product is featured",
      example: "true or false",
      nullable: true,
      note: "Accepts: true/false, 1/0, yes/no",
    },
  ]

  const deprecatedFields = [
    {
      name: "rating",
      description: "Product rating (1-5)",
      status: "Optional",
      note: "Parsed but not stored in new schema",
    },
    {
      name: "pros",
      description: "Product pros (pipe-separated)",
      status: "Optional",
      note: "Parsed but not stored in new schema",
    },
    {
      name: "cons",
      description: "Product cons (pipe-separated)",
      status: "Optional",
      note: "Parsed but not stored in new schema",
    },
    {
      name: "youtube_video_id",
      description: "YouTube video ID or URL",
      status: "Optional",
      note: "Parsed but not stored in new schema",
    },
    {
      name: "affiliate_url",
      description: "Affiliate link URL",
      status: "Optional",
      note: "Parsed but not stored in new schema",
    },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="CSV Format Guide"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] max-h-[600px] overflow-y-auto p-0">
        <div className="sticky top-0 bg-background border-b p-4">
          <h3 className="font-semibold text-lg">CSV Import Format Guide</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Learn how to format your CSV file for product import
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-muted/50 px-4 py-2">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="required" className="text-xs">
              Required Fields
            </TabsTrigger>
            <TabsTrigger value="optional" className="text-xs">
              Optional Fields
            </TabsTrigger>
            <TabsTrigger value="deprecated" className="text-xs">
              Legacy Fields
            </TabsTrigger>
            <TabsTrigger value="examples" className="text-xs">
              Examples
            </TabsTrigger>
          </TabsList>

          <div className="p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Supported File Formats</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline">.CSV</Badge>
                    <Badge variant="outline">.XLS</Badge>
                    <Badge variant="outline">.XLSX</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">File Constraints</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Maximum file size: 50MB</li>
                    <li>• Maximum rows: 1000 products per file</li>
                    <li>• First row must contain column headers</li>
                    <li>• Column names are case-insensitive</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Import Process</h4>
                  <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                    <li>Upload CSV/XLSX file</li>
                    <li>Map CSV columns to product fields</li>
                    <li>Validate data for errors</li>
                    <li>Review and import products</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            {/* Required Fields Tab */}
            <TabsContent value="required" className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                These fields must be present in your CSV file. Rows missing these fields will be skipped.
              </p>
              {requiredFields.map((field) => (
                <div key={field.name} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{field.name}</code>
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Example: </span>
                    <code className="bg-muted px-1 py-0.5 rounded">{field.example}</code>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Optional Fields Tab */}
            <TabsContent value="optional" className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                These fields are optional. Empty cells or missing columns are acceptable.
              </p>
              {optionalFields.map((field) => (
                <div key={field.name} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{field.name}</code>
                    <Badge variant="secondary" className="text-xs">
                      Optional
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Example: </span>
                    <code className="bg-muted px-1 py-0.5 rounded">{field.example}</code>
                  </div>
                  {field.note && (
                    <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-200">
                      ℹ️ {field.note}
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            {/* Deprecated Fields Tab */}
            <TabsContent value="deprecated" className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                These fields are parsed during import but not stored in the new database schema. They're included for backward compatibility.
              </p>
              {deprecatedFields.map((field) => (
                <div key={field.name} className="border rounded-lg p-3 space-y-2 opacity-75">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{field.name}</code>
                    <Badge variant="outline" className="text-xs">
                      Legacy
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                  <div className="text-xs bg-yellow-50 text-yellow-700 p-2 rounded border border-yellow-200">
                    ⚠️ {field.note}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Examples Tab */}
            <TabsContent value="examples" className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Minimal Example (Required Fields Only)</h4>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{`title,category,price
iPhone 15 Pro,Smartphones,99999.00
Samsung Galaxy S24,Smartphones,79999.00
MacBook Pro,Laptops,189999.00`}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Complete Example (With Optional Fields)</h4>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{`title,category,brand_name,price,original_price,short_description,images,specs,in_stock,featured
iPhone 15 Pro,Smartphones,Apple,99999.00,129999.00,Premium smartphone,https://example.com/img1.jpg,Storage:256GB|RAM:8GB,true,true
Samsung Galaxy S24,Smartphones,Samsung,79999.00,99999.00,Flagship Android phone,https://example.com/img2.jpg,Storage:256GB|RAM:12GB,true,false`}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Special Format Examples</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-mono bg-muted px-2 py-1 rounded">images</span>
                    <p className="text-muted-foreground mt-1">
                      Comma-separated URLs: <code className="bg-muted px-1">url1.jpg,url2.jpg,url3.jpg</code>
                    </p>
                  </div>
                  <div>
                    <span className="font-mono bg-muted px-2 py-1 rounded">specs</span>
                    <p className="text-muted-foreground mt-1">
                      Pipe-separated key:value pairs: <code className="bg-muted px-1">Key1:Value1|Key2:Value2</code>
                    </p>
                  </div>
                  <div>
                    <span className="font-mono bg-muted px-2 py-1 rounded">boolean fields</span>
                    <p className="text-muted-foreground mt-1">
                      Accepts: <code className="bg-muted px-1">true/false</code>, <code className="bg-muted px-1">1/0</code>, or{" "}
                      <code className="bg-muted px-1">yes/no</code>
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
