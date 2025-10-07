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
  additional_images?: string[]
  rating: number
  review_count: number
  youtube_video_id?: string
  in_stock: boolean
  featured: boolean
  is_published: boolean
  affiliate_url: string
  brand_name?: string
  specifications?: Record<string, string>
  pros?: string[]
  cons?: string[]
  category_id: string
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

export interface ProductWithCategory extends Product {
  categories?: Category
}

export interface ProductFormData {
  title: string
  short_description?: string
  description?: string
  price: string
  original_price?: string
  currency: string
  category_id: string
  youtube_video_id?: string
  in_stock: boolean
  featured: boolean
  rating: number
  main_image_url: string
  images: string[]
  specs: Array<{
    key: string
    value: string
  }>
  pros: string[]
  cons: string[]
  brand_name?: string
  affiliate_url: string
}
