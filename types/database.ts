// Updated to match Techwiser_shop schema (collections-based)
export interface Collection {
  id: string
  title: string
  handle: string
  description?: string
  image_url?: string
  image_alt_text?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  collection_id?: string
  title: string
  handle: string
  description?: string
  description_html?: string
  product_type?: string
  featured_image_url?: string
  featured_image_alt_text?: string
  featured_image_thumbhash?: string
  min_price: number
  max_price: number
  specifications?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  alt_text?: string
  thumbhash?: string
  display_order: number
  created_at: string
}

export interface ProductOption {
  id: string
  product_id: string
  name: string
  position?: number
  created_at: string
}

export interface ProductOptionValue {
  id: string
  option_id: string
  value: string
  created_at: string
}

export interface Variant {
  id: string
  product_id: string
  title: string
  sku?: string
  price: number
  compare_at_price?: number
  available_for_sale: boolean
  position?: number
  created_at: string
  updated_at: string
}

export interface ProductWithDetails extends Product {
  collections?: Collection
  product_images?: ProductImage[]
  variants?: Variant[]
}

// Legacy compatibility type (maps old schema to new)
export interface Category extends Collection {}

export interface ProductFormData {
  title: string
  handle?: string
  description?: string
  description_html?: string
  product_type?: string
  collection_id?: string
  featured_image_url?: string
  featured_image_alt_text?: string
  min_price: string
  max_price: string
  specifications?: Record<string, any>
  images?: Array<{
    url: string
    alt_text?: string
    display_order: number
  }>
  variants?: Array<{
    title: string
    sku?: string
    price: string
    available_for_sale: boolean
  }>
}
