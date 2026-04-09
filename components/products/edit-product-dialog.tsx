"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { extractYouTubeVideoId } from "@/lib/db-utils"
import { Loader } from "@/components/ui/loader"
import type { Category, ProductWithCategory } from "@/types/database"
import { ImageUpload } from "./image-upload"

type Props = {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Overall rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-checked={value === n}
          role="radio"
          className={cn(
            "px-1 text-xl leading-none transition-colors",
            value >= n ? "text-yellow-500" : "text-muted-foreground",
          )}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function EditProductDialog({ productId, open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Form state
  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [brandName, setBrandName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [originalPrice, setOriginalPrice] = useState("")
  const [mainImageUrl, setMainImageUrl] = useState("")
  const [ytUrl, setYtUrl] = useState("")
  const [affiliateUrl, setAffiliateUrl] = useState("")
  const [rating, setRating] = useState(0)
  const [pros, setPros] = useState<string[]>([""])
  const [cons, setCons] = useState<string[]>([""])
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }])
  const [inStock, setInStock] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [images, setImages] = useState<string[]>([])

  const ytId = useMemo(() => extractYouTubeVideoId(ytUrl), [ytUrl])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && productId) {
      fetchProductData()
      fetchMetadata()
    }
  }, [open, productId])

  async function fetchMetadata() {
    try {
      const categoriesRes = await fetch("/api/categories")
      const categoriesData = await categoriesRes.json()
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error("[v0] Error fetching metadata:", error)
    }
  }

  async function fetchProductData() {
    try {
      setLoading(true)
      console.log("[v0] Fetching product:", productId)

      const response = await fetch(`/api/products/${productId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch product")
      }

      const data = await response.json()
      const product = data.product

      console.log("[v0] Product loaded:", product)

      // Map new schema fields to form state
      setTitle(product.title || "")
      setCategoryId(product.collection_id || "")
      setBrandName(product.product_type || "")
      setShortDescription(product.description || "")
      setDescription(product.description_html || product.description || "")
      setPrice(product.min_price?.toString() || "0")
      setOriginalPrice(product.max_price?.toString() || "")
      setMainImageUrl(product.featured_image_url || "")
      setYtUrl("") // Not in new schema
      setRating(0) // Not in new schema
      setInStock(true) // Not in new schema
      setFeatured(false) // Not in new schema
      setAffiliateUrl("") // Not in new schema

      // Handle specifications
      const specsArray = product.specifications
        ? Object.entries(product.specifications).map(([key, value]) => ({ 
            key, 
            value: typeof value === 'object' ? JSON.stringify(value) : String(value) 
          }))
        : [{ key: "", value: "" }]
      setSpecs(specsArray)

      // Handle images from product_images table
      const imageUrls = product.product_images
        ? product.product_images
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((img: any) => img.image_url)
        : []
      setImages(imageUrls)

      // Pros/cons not in new schema
      setPros([""])
      setCons([""])
    } catch (error) {
      console.error("[v0] Error fetching product:", error)
      toast({
        title: "Error",
        description: "Failed to load product data",
        variant: "destructive",
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
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
    if (!categoryId) return "Please select a collection/category."
    if (!price || Number.parseFloat(price) <= 0) return "Valid price is required."
    if (!mainImageUrl && images.length === 0) return "At least one product image is required."
    return null
  }

  async function handleSubmit() {
    const error = validate()
    if (error) {
      toast({ title: "Validation error", description: error, variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      console.log("[v0] Updating product:", productId)

      // Convert specs to object
      const specifications: Record<string, any> = {}
      specs.filter(s => s.key && s.value).forEach(s => {
        specifications[s.key] = s.value
      })

      const productData = {
        title,
        handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        description: shortDescription || description || null,
        description_html: description || null,
        product_type: brandName || null,
        collection_id: categoryId,
        featured_image_url: mainImageUrl || (images.length > 0 ? images[0] : null),
        featured_image_alt_text: title,
        min_price: price,
        max_price: originalPrice || price,
        specifications: Object.keys(specifications).length > 0 ? specifications : null,
        images: images.map((url, index) => ({
          url,
          alt_text: title,
          display_order: index
        }))
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update product")
      }

      const result = await response.json()
      console.log("[v0] Product updated:", result.product.id)

      toast({
        title: "Product updated",
        description: `${title} has been updated successfully!`,
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error updating product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader size="md" />
              <p className="mt-4 text-gray-600">Loading product...</p>
            </div>
          </div>
        ) : (
          <form
            className="grid gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
          >
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
                <TabsTrigger value="publish">Publish</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="title">Product Name</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <Label>Product Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title || c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Product Type (optional)</Label>
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g., Smartphone, Laptop, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="originalPrice">Max Price (₹)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="Optional - for price range"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="shortDescription">Short Description</Label>
                    <Textarea
                      id="shortDescription"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value.slice(0, 200))}
                      placeholder="Brief product description (max 200 characters)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{shortDescription.length}/200</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed product description"
                      className="h-32"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="grid gap-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Product Images</Label>
                    <ImageUpload images={images} onChange={setImages} maxImages={8} />
                    {images.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Main image: {images[0] === mainImageUrl ? "First image" : "Set separately"}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="yt">YouTube Video URL</Label>
                    <Input
                      id="yt"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                    />
                    {ytId && (
                      <Card className="p-2 flex items-center gap-3">
                        <img
                          src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                          alt="YouTube thumbnail"
                          className="w-28 h-16 object-cover rounded"
                        />
                        <div className="text-xs text-muted-foreground">
                          Auto-detected ID: <Badge variant="secondary">{ytId}</Badge>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="review" className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Overall Rating</Label>
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                </div>

                <Separator className="my-1" />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>What I Liked (Pros)</Label>
                    <div className="grid gap-2">
                      {pros.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={p}
                            maxLength={100}
                            onChange={(e) => {
                              const next = [...pros]
                              next[i] = e.target.value
                              setPros(next)
                            }}
                            placeholder="Add a positive point"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={() => addRow(pros, setPros, "")}>
                            +
                          </Button>
                          {pros.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(pros, setPros, i)}
                              aria-label="Remove"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>What Could Be Better (Cons)</Label>
                    <div className="grid gap-2">
                      {cons.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={c}
                            maxLength={100}
                            onChange={(e) => {
                              const next = [...cons]
                              next[i] = e.target.value
                              setCons(next)
                            }}
                            placeholder="Add a potential downside"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={() => addRow(cons, setCons, "")}>
                            +
                          </Button>
                          {cons.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(cons, setCons, i)}
                              aria-label="Remove"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Key Specifications</Label>
                  <div className="grid gap-2">
                    {specs.map((row, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Key (e.g., Battery)"
                          value={row.key}
                          onChange={(e) => {
                            const next = [...specs]
                            next[i] = { ...next[i], key: e.target.value }
                            setSpecs(next)
                          }}
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Value"
                            value={row.value}
                            onChange={(e) => {
                              const next = [...specs]
                              next[i] = { ...next[i], value: e.target.value }
                              setSpecs(next)
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addRow(specs, setSpecs, { key: "", value: "" })}
                          >
                            +
                          </Button>
                          {specs.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(specs, setSpecs, i)}
                              aria-label="Remove"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="publish" className="grid gap-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="affiliateUrl">Affiliate URL</Label>
                    <Input
                      id="affiliateUrl"
                      value={affiliateUrl}
                      onChange={(e) => setAffiliateUrl(e.target.value)}
                      placeholder="https://example.com/affiliate-link"
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox id="inStock" checked={inStock} onCheckedChange={(v) => setInStock(Boolean(v))} />
                      <Label htmlFor="inStock">In Stock</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="featured" checked={featured} onCheckedChange={(v) => setFeatured(Boolean(v))} />
                      <Label htmlFor="featured">Featured Product</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
