"use client" 

import { useMemo, useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { extractYouTubeVideoId } from "@/lib/db-utils"
import type { Category } from "@/types/database"
import { ImageUpload } from "./image-upload"
import { useToast } from "@/components/ui/use-toast"

type Props = {
  onSubmitted?: () => void
  categories?: Category[]
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="Overall rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-checked={value === n}
          role="radio"
          className={cn(
            "px-2 py-1 text-3xl md:text-2xl leading-none transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
            value >= n ? "text-yellow-500" : "text-muted-foreground",
          )}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function AddProductForm({ onSubmitted, categories = [] }: Props) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const [loadingData, setLoadingData] = useState(false)
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)

  // Basic
  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [brandName, setBrandName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [originalPrice, setOriginalPrice] = useState("")

  // Media
  const [images, setImages] = useState<string[]>([])
  const [ytUrl, setYtUrl] = useState("")
  const [affiliateUrl, setAffiliateUrl] = useState("")
  const ytId = useMemo(() => extractYouTubeVideoId(ytUrl), [ytUrl])

  // Review
  const [rating, setRating] = useState(0)
  const [pros, setPros] = useState<string[]>([""])
  const [cons, setCons] = useState<string[]>([""])
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }])

  // Publishing
  const [inStock, setInStock] = useState(true)
  const [featured, setFeatured] = useState(false)


  useEffect(() => {
    if (categories.length === 0) {
      fetchData()
    }
  }, [categories.length, brands.length])

  async function fetchData() {
    try {
      setLoadingData(true)
      const categoriesRes = await fetch("/api/categories")

      const categoriesData = await categoriesRes.json()

      setLocalCategories(categoriesData.categories || [])
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" })
    } finally {
      setLoadingData(false)
    }
  }


  function addRow<T>(list: T[], setter: (v: T[]) => void, empty: T) {
    setter([...list, empty])
  }

  function removeRow<T>(list: T[], setter: (v: T[]) => void, index: number) {
    setter(list.filter((_, i) => i !== index))
  }

  function validate(): string | null {
    if (!title.trim() || title.length > 255) return "Product name is required and must be under 255 characters."
    if (!categoryId) return "Please select a category."
    if (!price || Number.parseFloat(price) <= 0) return "Valid price is required."
    if (rating < 1 || rating > 5) return "Overall rating must be between 1 and 5."
    try {
      if (!affiliateUrl) return "Affiliate URL is required."
      new URL(affiliateUrl)
    } catch {
      return "Affiliate URL must be a valid URL."
    }
    return null
  }

  function goToNextTab() {
    const tabs = ["basic", "media", "review", "publish"]
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }

  async function handleSubmit(publish: boolean) {
    const error = validate()
    if (error) {
      toast({ title: "Validation error", description: error, variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      console.log("[v0] Submitting product...")

      const productMainImage = images.length > 0 ? images[0] : "/diverse-products-still-life.png"

      const productData = {
        title,
        short_description: shortDescription || null,
        description: description || null,
        price,
        original_price: originalPrice || null,
        currency: "INR",
        main_image_url: productMainImage,
        rating,
        youtube_video_id: ytId || null,
        in_stock: publish ? inStock : false,
        featured,
        category_id: categoryId,
        brand_name: brandName || null,
        affiliate_url: affiliateUrl,
        images: images,
        specs: specs.filter((s) => s.key && s.value),
        pros: pros.filter((p) => p.trim()),
        cons: cons.filter((c) => c.trim()),
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create product")
      }

      const result = await response.json()
      console.log("[v0] Product created:", result.product.id)

      toast({
        title: publish ? "Product published" : "Draft saved",
        description: `${title} has been ${publish ? "published" : "saved as draft"} successfully!`,
      })

      onSubmitted?.()
    } catch (error) {
      console.error("[v0] Error creating product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      className="grid gap-8 p-4 md:p-6"
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(true)
      }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 sm:mb-6 grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 h-auto p-1">
          <TabsTrigger value="basic" className="text-sm sm:text-base py-2 sm:py-3">Basic Info</TabsTrigger>
          <TabsTrigger value="media" className="text-sm sm:text-base py-2 sm:py-3">Media</TabsTrigger>
          <TabsTrigger value="review" className="text-sm sm:text-base py-2 sm:py-3">Review</TabsTrigger>
          <TabsTrigger value="publish" className="text-sm sm:text-base py-2 sm:py-3">Publish</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="grid gap-6 mt-6">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="title" className="text-base font-semibold">Product Name *</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                maxLength={255}
                className="text-base h-12 px-4"
                placeholder="Enter product name"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label className="text-base font-semibold">Product Category *</Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={loadingData}>
                  <SelectTrigger className="text-base h-12 px-4">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {localCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-base py-3">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-3">
                <Label className="text-base font-semibold">Brand (optional)</Label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="text-base h-12 px-4"
                  placeholder="Enter brand name"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="price" className="text-base font-semibold">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="text-base h-12 px-4"
                  placeholder="0.00"
                />
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="originalPrice" className="text-base font-semibold">Original Price (₹)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="Optional - for showing discount"
                  className="text-base h-12 px-4"
                />
              </div>
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="shortDescription" className="text-base font-semibold">Short Description</Label>
              <Textarea
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value.slice(0, 200))}
                placeholder="Brief product description (max 200 characters)"
                className="text-base min-h-[100px] p-4"
              />
              <p className="text-sm text-muted-foreground">{shortDescription.length}/200 characters</p>
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="description" className="text-base font-semibold">Full Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed product description"
                className="text-base min-h-[160px] p-4"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              type="button" 
              onClick={goToNextTab}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] text-sm sm:text-base px-6"
            >
              Next
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="media" className="grid gap-6 mt-6">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label className="text-base font-semibold">Product Images</Label>
              <p className="text-sm text-muted-foreground mb-2">Upload up to 8 images. First image will be the main image. (Optional)</p>
              <ImageUpload images={images} onChange={setImages} maxImages={8} />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="yt" className="text-base font-semibold">YouTube Video URL</Label>
              <Input
                id="yt"
                placeholder="https://www.youtube.com/watch?v=..."
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                className="text-base h-12 px-4"
              />
              {ytId ? (
                <Card className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                    alt="YouTube thumbnail"
                    className="w-full md:w-32 h-auto md:h-20 object-cover rounded"
                  />
                  <div className="text-sm text-muted-foreground">
                    Auto-detected ID: <Badge variant="secondary" className="text-sm">{ytId}</Badge>
                  </div>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">Paste a valid video URL to preview.</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              type="button" 
              onClick={goToNextTab}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] text-sm sm:text-base px-6"
            >
              Next
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="review" className="grid gap-6 mt-6">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label className="text-base font-semibold">Overall Rating *</Label>
              <p className="text-sm text-muted-foreground mb-2">Click on a star to set your rating</p>
              <StarRating value={rating} onChange={setRating} />
            </div>
          </div>

          <Separator className="my-2" />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-3">
              <Label className="text-base font-semibold">What I Liked (Pros)</Label>
              <div className="grid gap-3">
                {pros.map((p, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      value={p}
                      maxLength={100}
                      onChange={(e) => {
                        const next = [...pros]
                        next[i] = e.target.value
                        setPros(next)
                      }}
                      placeholder="Add a positive point"
                      className="text-base h-12 px-4 flex-1"
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="lg"
                        onClick={() => addRow(pros, setPros, "")}
                        className="flex-1 sm:flex-none min-h-[44px] text-base"
                      >
                        Add More
                      </Button>
                      {pros.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="lg"
                          onClick={() => removeRow(pros, setPros, i)}
                          aria-label="Remove"
                          className="flex-1 sm:flex-none min-h-[44px] text-base"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid gap-3">
              <Label className="text-base font-semibold">What Could Be Better (Cons)</Label>
              <div className="grid gap-3">
                {cons.map((c, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      value={c}
                      maxLength={100}
                      onChange={(e) => {
                        const next = [...cons]
                        next[i] = e.target.value
                        setCons(next)
                      }}
                      placeholder="Add a potential downside"
                      className="text-base h-12 px-4 flex-1"
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="lg"
                        onClick={() => addRow(cons, setCons, "")}
                        className="flex-1 sm:flex-none min-h-[44px] text-base"
                      >
                        Add More
                      </Button>
                      {cons.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="lg"
                          onClick={() => removeRow(cons, setCons, i)}
                          aria-label="Remove"
                          className="flex-1 sm:flex-none min-h-[44px] text-base"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <Label className="text-base font-semibold">Key Specifications</Label>
            <div className="grid gap-3">
              {specs.map((row, i) => (
                <div key={i} className="grid gap-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Specification name (e.g., Battery)"
                      value={row.key}
                      onChange={(e) => {
                        const next = [...specs]
                        next[i] = { ...next[i], key: e.target.value }
                        setSpecs(next)
                      }}
                      className="text-base h-12 px-4"
                    />
                    <Input
                      placeholder="Value (e.g., 5000mAh)"
                      value={row.value}
                      onChange={(e) => {
                        const next = [...specs]
                        next[i] = { ...next[i], value: e.target.value }
                        setSpecs(next)
                      }}
                      className="text-base h-12 px-4"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => addRow(specs, setSpecs, { key: "", value: "" })}
                      className="flex-1 min-h-[44px] text-base"
                    >
                      Add More Specification
                    </Button>
                    {specs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={() => removeRow(specs, setSpecs, i)}
                        aria-label="Remove"
                        className="min-h-[44px] text-base"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              type="button" 
              onClick={goToNextTab}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] text-sm sm:text-base px-6"
            >
              Next
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="publish" className="grid gap-6 mt-6">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="affiliateUrl" className="text-base font-semibold">Affiliate URL *</Label>
              <Input
                id="affiliateUrl"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                className="text-base h-12 px-4"
                placeholder="https://example.com/affiliate-link"
                required
              />
              <p className="text-sm text-muted-foreground">This link is required for the product and must be a valid URL.</p>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Checkbox 
                id="inStock" 
                checked={inStock} 
                onCheckedChange={(v) => setInStock(Boolean(v))}
                className="mt-1 h-6 w-6"
              />
              <div className="grid gap-1">
                <Label htmlFor="inStock" className="text-base font-semibold cursor-pointer">In Stock</Label>
                <p className="text-sm text-muted-foreground">Check this if the product is currently available</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Checkbox 
                id="featured" 
                checked={featured} 
                onCheckedChange={(v) => setFeatured(Boolean(v))}
                className="mt-1 h-6 w-6"
              />
              <div className="grid gap-1">
                <Label htmlFor="featured" className="text-base font-semibold cursor-pointer">Featured Product</Label>
                <p className="text-sm text-muted-foreground">Featured products appear prominently on your site</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => handleSubmit(false)} 
              disabled={submitting}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] text-sm sm:text-base px-4 sm:px-6"
            >
              {submitting ? "Saving..." : "Save Draft"}
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] text-sm sm:text-base px-4 sm:px-6"
            >
              {submitting ? "Publishing..." : "Publish Product"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  )
}
