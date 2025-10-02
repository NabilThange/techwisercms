export interface Product {
  id: string
  slug: string
  title: string
  short_description?: string
  description?: string
  price: number
  original_price?: number
  currency: string
  main_image_url: string
  rating: number
  review_count: number
  youtube_video_id?: string
  in_stock: boolean
  featured: boolean
  category_id: string
  brand_id: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo_url?: string
  website_url?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  alt_text?: string
  display_order: number
  created_at: string
}

export interface ProductSpec {
  id: string
  product_id: string
  spec_key: string
  spec_value: string
  display_order: number
  created_at: string
}

export interface ProductProCon {
  id: string
  product_id: string
  content: string
  type: "pro" | "con"
  display_order: number
  created_at: string
}

export interface ProductWithRelations extends Product {
  categories?: Category
  brands?: Brand
  product_images?: ProductImage[]
  product_specs?: ProductSpec[]
  product_pros_cons?: ProductProCon[]
}

export interface ProductFormData {
  title: string
  short_description?: string
  description?: string
  price: string
  original_price?: string
  currency: string
  category_id: string
  brand_id: string
  youtube_video_id?: string
  in_stock: boolean
  featured: boolean
  rating: number
  main_image_url: string
  images: Array<{
    url: string
    alt_text?: string
  }>
  specs: Array<{
    key: string
    value: string
  }>
  pros: string[]
  cons: string[]
}
