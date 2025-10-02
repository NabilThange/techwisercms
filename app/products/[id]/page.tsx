import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/db-utils"
import Link from "next/link"

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params

  // Fetch real product data from API
  let product = null
  let error = null
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/products/${id}`, { cache: 'no-store' })
    if (response.ok) {
      const data = await response.json()
      product = data.product
    } else {
      error = "Product not found"
    }
  } catch (e) {
    error = "Failed to load product"
  }
  
  // Fallback for when API is not available or fails
  if (!product) {
    product = {
      id,
      title: "Sample Product",
      sku: `SKU-${id}`,
      in_stock: true,
      price: 149.00,
      currency: "USD",
      rating: 4.5,
      description: error || "This is a placeholder description. Replace with real product details once wired to your data source.",
      main_image_url: "/product-hero.png",
      specs: [
        { key: "Color", value: "Black" },
        { key: "Weight", value: "1.2 lb" },
        { key: "Dimensions", value: "6 x 3 x 2 in" },
      ],
    }
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-pretty">{product.title}</h1>
          <p className="text-sm text-muted-foreground">
            ID: {product.id} · {product.sku || `SKU-${product.id.slice(0, 8)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={product.in_stock ? "default" : "secondary"}>
            {product.in_stock ? "In Stock" : "Out of Stock"}
          </Badge>
          <Button asChild variant="outline">
            <Link href="/products">Back to Products</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Primary product information</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <img src={product.main_image_url || "/placeholder.svg"} alt={product.title} className="w-full rounded-md border" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium">{formatPrice(product.price, product.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="font-medium">{product.rating} / 5</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-pretty text-foreground">{product.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Key product attributes</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(product.specs || []).map((s, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.key}</span>
                <span className="text-sm font-medium">{s.value}</span>
              </div>
            ))}
            <div className="pt-2">
              <Button className="w-full">Edit Product</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
