"use client"

import * as React from "react"
import type { Category, ProductWithCategory } from "@/types/database"
import { formatPrice } from "@/lib/db-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"
import AddProductForm from "@/components/products/add-product-form"
import EditProductDialog from "@/components/products/edit-product-dialog"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

// Product Action Menu Component - Uses Radix DropdownMenu for reliability
function ProductActionMenu({ 
  productId, 
  onAction,
  buttonText = "Actions",
  buttonVariant = "default" as const,
  buttonClassName = "bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
}: { 
  productId: string
  onAction: (id: string, action: "edit" | "duplicate" | "delete" | "view" | "toggle") => void
  buttonText?: string
  buttonVariant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link"
  buttonClassName?: string
}) {
  const handleAction = React.useCallback((action: "edit" | "duplicate" | "delete" | "view" | "toggle") => {
    onAction(productId, action)
  }, [productId, onAction])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={buttonVariant}
          size="sm" 
          className={buttonClassName}
          aria-label={`${buttonText} for product ${productId}`}
        >
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={5}>
        <DropdownMenuItem 
          onClick={() => handleAction("edit")}
          className="cursor-pointer"
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleAction("duplicate")}
          className="cursor-pointer"
        >
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleAction("delete")}
          className="cursor-pointer text-destructive focus:text-destructive"
          variant="destructive"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function toCSV(rows: Record<string, any>[]) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))]
  return lines.join("\n")
}

function ProductsToolbar(props: {
  view: "list" | "grid"
  setView: (v: "list" | "grid") => void
  search: string
  setSearch: (v: string) => void
  category: string
  setCategory: (v: string) => void
  status: string
  setStatus: (v: string) => void
  rating: string
  setRating: (v: string) => void
  featuredOnly: boolean
  setFeaturedOnly: (v: boolean) => void
  sort: string
  setSort: (v: string) => void
  onExport: () => void
  onBulkPublish: () => void
  onBulkUnpublish: () => void
  onBulkDelete: () => void
  selectionCount: number
  categories: Category[]
  onRefresh: () => void
  onAddSuccess: () => void
}) {
  const {
    view,
    setView,
    search,
    setSearch,
    category,
    setCategory,
    status,
    setStatus,
    rating,
    setRating,
    featuredOnly,
    setFeaturedOnly,
    sort,
    setSort,
    onExport,
    onBulkPublish,
    onBulkUnpublish,
    onBulkDelete,
    selectionCount,
    categories,
    onRefresh,
    onAddSuccess,
  } = props

  return (
    <div className="flex flex-col gap-4 w-full overflow-x-hidden">
      {/* First Row - Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-start gap-3 sm:gap-4">
        <Input
          placeholder="Search products, brands, categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3 w-full min-w-0">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 stars</SelectItem>
              <SelectItem value="4">4+ stars</SelectItem>
              <SelectItem value="3">3+ stars</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 px-0 sm:px-2 w-full sm:w-auto">
            <Checkbox id="featured-only" checked={featuredOnly} onCheckedChange={(v) => setFeaturedOnly(Boolean(v))} />
            <Label htmlFor="featured-only" className="text-sm cursor-pointer whitespace-nowrap">
              Featured
            </Label>
          </div>
        </div>
      </div>

      {/* Second Row - Actions */}
      <div className="flex flex-col lg:flex-row justify-between gap-3 w-full">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={selectionCount === 0} className="w-full sm:w-auto">
                Bulk Actions ({selectionCount})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onBulkPublish}>Publish</DropdownMenuItem>
              <DropdownMenuItem onClick={onBulkUnpublish}>Unpublish</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onBulkDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-new">Date added (newest)</SelectItem>
              <SelectItem value="date-old">Date added (oldest)</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="rating-high">Rating (high to low)</SelectItem>
              <SelectItem value="rating-low">Rating (low to high)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex rounded-md overflow-hidden border w-full sm:w-auto">
            <Button
              variant={view === "list" ? "default" : "ghost"}
              onClick={() => setView("list")}
              className="rounded-none flex-1 sm:flex-none"
            >
              List
            </Button>
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              onClick={() => setView("grid")}
              className="rounded-none flex-1 sm:flex-none"
            >
              Grid
            </Button>
          </div>

          <Button variant="outline" onClick={onRefresh} className="w-full sm:w-auto">
            Refresh
          </Button>
          <AddProductDialog onSuccess={onAddSuccess}>
            <Button className="w-full sm:w-auto">Add Product</Button>
          </AddProductDialog>
          <Button variant="outline" onClick={onExport} className="w-full sm:w-auto">
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  )
}

function ListView(props: {
  products: ProductWithCategory[]
  selected: Set<string>
  toggleSelect: (id: string) => void
  selectAllOnPage: (ids: string[]) => void
  pageIds: string[]
  onAction: (id: string, action: "edit" | "duplicate" | "delete" | "view" | "toggle") => void
}) {
  const { products, selected, toggleSelect, selectAllOnPage, pageIds, onAction } = props
  const allSelected = pageIds.every((id) => selected.has(id))

  return (
    <div className="rounded-lg border bg-card overflow-x-auto overflow-y-visible">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => selectAllOnPage(pageIds)}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="min-w-[200px]">Product</TableHead>
            <TableHead className="min-w-[100px]">Price</TableHead>
            <TableHead className="min-w-[160px]">Details</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Checkbox
                  checked={selected.has(p.id)}
                  onCheckedChange={() => toggleSelect(p.id)}
                  aria-label={`Select ${p.title}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img
                    src={p.main_image_url || "/placeholder.svg?height=50&width=50&query=product-thumbnail"}
                    alt={p.title}
                    className="w-12 h-12 rounded-md object-cover flex-shrink-0 border"
                  />
                  <span className="font-medium break-words line-clamp-2">{p.title}</span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap font-semibold">{formatPrice(p.price, p.currency)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
<span className="text-sm break-words">{p.brand_name || "N/A"}</span>
                  <span className="text-xs text-muted-foreground break-words">{p.categories?.name || "N/A"}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <ProductActionMenu productId={p.id} onAction={onAction} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function GridView(props: {
  products: ProductWithCategory[]
  onAction: (id: string, action: "edit" | "duplicate" | "delete" | "view" | "toggle") => void
}) {
  const { products, onAction } = props
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
      {products.map((p) => (
        <Card key={p.id} className="flex flex-col hover:shadow-lg transition-shadow relative">
          <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
            <img
              src={p.main_image_url || "/placeholder.svg?height=240&width=360"}
              alt={p.title}
              className="w-full h-full object-cover"
            />
            {p.featured && <Badge className="absolute top-2 right-2">Featured</Badge>}
          </div>
          <CardContent className="p-4 flex-1 flex flex-col gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-base line-clamp-2 mb-2">{p.title}</h3>
              <div className="text-sm text-muted-foreground mb-2">
<span>{p.brand_name || "N/A"}</span>
                <span className="mx-1">•</span>
                <span>{p.categories?.name || "N/A"}</span>
              </div>
              <p className="text-lg font-bold">{formatPrice(p.price, p.currency)}</p>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <RatingStars value={p.rating} />
              <ProductStatusBadge inStock={p.in_stock} />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => onAction(p.id, "edit")} 
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
              >
                Edit
              </Button>
              <ProductActionMenu 
                productId={p.id} 
                onAction={onAction} 
                buttonText="More"
                buttonVariant="outline"
                buttonClassName="hover:bg-gray-50"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AddProductDialog({ onSuccess, children }: { onSuccess: () => void; children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>Add Product</Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-[92vw] sm:w-auto sm:max-w-xl lg:max-w-2xl xl:max-w-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Fill in the details and publish or save as draft.</DialogDescription>
        </DialogHeader>
        <AddProductForm
          onSubmitted={() => {
            setOpen(false)
            onSuccess()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function ProductStatusBadge({ inStock }: { inStock: boolean }) {
  return (
    <Badge variant={inStock ? "default" : "secondary"} className="text-xs whitespace-nowrap">
      {inStock ? "In Stock" : "Out of Stock"}
    </Badge>
  )
}

function RatingStars({ value }: { value: number }) {
  const fullStars = Math.floor(value)
  return (
    <div aria-label={`Rating ${value} out of 5`} className="flex items-center gap-1 text-base">
      <span className="text-yellow-500">{"★".repeat(fullStars)}</span>
      <span className="text-gray-300">{"★".repeat(5 - fullStars)}</span>
      <span className="text-sm text-muted-foreground ml-1">({value})</span>
    </div>
  )
}

export default function ProductsPage() {
const [products, setProducts] = React.useState<ProductWithCategory[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [view, setView] = React.useState<"list" | "grid">("grid")
  const [search, setSearch] = React.useState("")
  const [category, setCategory] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [rating, setRating] = React.useState("all")
  const [featuredOnly, setFeaturedOnly] = React.useState(false)
  const [sort, setSort] = React.useState("date-new")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [page, setPage] = React.useState(1)
  const pageSize = 20

  const [editingProductId, setEditingProductId] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchCategories()
  }, [])

  React.useEffect(() => {
    fetchProducts()
  }, [search, category, status, rating, featuredOnly, page])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      setCategories(data.categories)
    } catch (err) {
      console.error("Error fetching categories:", err)
    }
  }


  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      })

      if (search) params.append("search", search)
      if (category !== "all") params.append("category", category)
      if (status === "in_stock") params.append("in_stock", "true")
      if (status === "out_of_stock") params.append("in_stock", "false")
      if (featuredOnly) params.append("featured", "true")

      const response = await fetch(`/api/products?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setProducts(data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      console.error("Error fetching products:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = React.useMemo(() => {
    let rows = products.slice()

    if (rating !== "all") {
      const min = Number(rating)
      rows = rows.filter((r) => r.rating >= min)
    }

    switch (sort) {
      case "date-new":
        rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        break
      case "date-old":
        rows.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
        break
      case "name-asc":
        rows.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "name-desc":
        rows.sort((a, b) => b.title.localeCompare(a.title))
        break
      case "rating-high":
        rows.sort((a, b) => b.rating - a.rating)
        break
      case "rating-low":
        rows.sort((a, b) => a.rating - b.rating)
        break
    }
    return rows
  }, [products, rating, sort])

  const pagedIds = filtered.map((p) => p.id)

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function selectAllOnPage(ids: string[]) {
    setSelected((prev) => {
      const s = new Set(prev)
      const allSelected = ids.every((id) => s.has(id))
      if (allSelected) ids.forEach((id) => s.delete(id))
      else ids.forEach((id) => s.add(id))
      return s
    })
  }

  function handleExport() {
    const exportData = filtered.map((p) => ({
      id: p.id,
      title: p.title,
brand: p.brand_name || "",
      category: p.categories?.name || "",
      price: p.price,
      rating: p.rating,
      in_stock: p.in_stock,
    }))
    const csv = toCSV(exportData)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "products.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function bulkPublish() {
    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          productIds: Array.from(selected),
        }),
      })

      if (!response.ok) throw new Error("Failed to publish")

      alert("Products published!")
      setSelected(new Set())
      fetchProducts()
    } catch (error) {
      alert("Failed to publish products")
    }
  }

  async function bulkUnpublish() {
    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unpublish",
          productIds: Array.from(selected),
        }),
      })

      if (!response.ok) throw new Error("Failed to unpublish")

      alert("Products unpublished!")
      setSelected(new Set())
      fetchProducts()
    } catch (error) {
      alert("Failed to unpublish products")
    }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} products? This cannot be undone.`)) return

    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          productIds: Array.from(selected),
        }),
      })

      if (!response.ok) throw new Error("Failed to delete")

      alert("Products deleted!")
      setSelected(new Set())
      fetchProducts()
    } catch (error) {
      alert("Failed to delete products")
    }
  }

  async function onItemAction(id: string, action: "edit" | "duplicate" | "delete" | "view" | "toggle") {
    if (action === "delete") {
      if (!confirm("Delete this product? This cannot be undone.")) return

      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error("Failed to delete")

        alert("Product deleted!")
        fetchProducts()
      } catch (error) {
        alert("Failed to delete product")
      }
    } else if (action === "edit") {
      setEditingProductId(id)
    } else if (action === "duplicate") {
      alert("Duplicate feature coming soon!")
    }
  }

  if (loading && products.length === 0) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader size="lg" />
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error && products.length === 0) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600">Error: {error}</p>
              <Button onClick={() => fetchProducts()} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold">Products</h1>
          <p className="text-base text-muted-foreground">
            Manage your product catalog with advanced filtering and bulk operations
          </p>
        </div>

        <ProductsToolbar
          view={view}
          setView={setView}
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          status={status}
          setStatus={setStatus}
          rating={rating}
          setRating={setRating}
          featuredOnly={featuredOnly}
          setFeaturedOnly={setFeaturedOnly}
          sort={sort}
          setSort={setSort}
          onExport={handleExport}
          onBulkPublish={bulkPublish}
          onBulkUnpublish={bulkUnpublish}
          onBulkDelete={bulkDelete}
          selectionCount={selected.size}
          categories={categories}
          onRefresh={fetchProducts}
          onAddSuccess={fetchProducts}
        />

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <p className="text-lg text-muted-foreground">No products found matching your filters</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search criteria or add a new product</p>
          </div>
        ) : view === "list" ? (
          <ListView
            products={filtered}
            selected={selected}
            toggleSelect={toggleSelect}
            selectAllOnPage={selectAllOnPage}
            pageIds={pagedIds}
            onAction={onItemAction}
          />
        ) : (
          <GridView products={filtered} onAction={onItemAction} />
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">Page {page}</p>
          <Button variant="outline" onClick={() => setPage(page + 1)} disabled={filtered.length < pageSize}>
            Next
          </Button>
        </div>

        {editingProductId && (
          <EditProductDialog
            productId={editingProductId}
            open={Boolean(editingProductId)}
            onOpenChange={(o) => {
              if (!o) setEditingProductId(null)
            }}
            onSuccess={() => {
              setEditingProductId(null)
              fetchProducts()
            }}
          />
        )}
      </div>
    </main>
  )
}
