# TECHWISER Dashboard Migration Guide

## Overview
This dashboard has been updated to work with the **NEW Techwiser_shop database schema** (collections-based ecommerce schema).

## What Changed

### 1. Supabase Connection Updated
- **Old:** `kevybyyqlmtuqayryech.supabase.co` (outdated instance)
- **New:** `nnggbyiicacjzwhftbgh.supabase.co` (current production database)

### 2. Database Schema Changes

#### Collections (formerly Categories)
- Table renamed from `categories` to `collections`
- Fields updated:
  - `name` → `title`
  - Added: `image_url`, `image_alt_text`

#### Products Table
Major schema changes:
- `slug` → `handle`
- `category_id` → `collection_id`
- `main_image_url` → `featured_image_url`
- `additional_images` (JSONB array) → Separate `product_images` table
- Removed: `short_description`, `rating`, `review_count`, `youtube_video_id`, `in_stock`, `featured`, `is_published`, `affiliate_url`, `brand_name`, `pros`, `cons`, `currency`, `original_price`
- Added: `description_html`, `product_type`, `featured_image_alt_text`, `featured_image_thumbhash`, `min_price`, `max_price`
- `specifications` now supports any JSONB structure (not just string key-value pairs)

#### New Tables
- **product_images** - Multiple images per product with display ordering
- **product_options** - Product attributes (Size, Color, etc.)
- **product_option_values** - Values for each option
- **variants** - Product variants with individual pricing and SKUs
- **variant_selected_options** - Links variants to their option values
- **carts** & **cart_items** - Shopping cart functionality

### 3. API Routes Updated

All API routes have been updated to work with the new schema:

#### `/api/categories`
- Now queries `collections` table
- Returns data with `title` field mapped to `name` for backward compatibility

#### `/api/brands`
- Deprecated (no brands table in new schema)
- Now returns collections as brands for backward compatibility

#### `/api/products`
- Updated to query `collections`, `product_images`, and `variants` tables
- Supports both `category` and `collection` query parameters
- Returns full product details with related data

#### `/api/products/[id]`
- Updated GET to include collections, images, and variants
- Updated PUT to handle images and variants separately
- DELETE now cascades to related tables

### 4. Type Definitions Updated

`types/database.ts` now includes:
- `Collection` interface (replaces Category)
- `Product` interface (updated fields)
- `ProductImage` interface (new)
- `ProductOption` & `ProductOptionValue` interfaces (new)
- `Variant` interface (new)
- `ProductWithDetails` interface (includes all related data)

## Current Database Schema

The database now contains **11 tech products** across **5 collections**:

### Collections
1. **Smartphones** - iPhone 15 Pro, Samsung Galaxy S24 Ultra
2. **Laptops** - MacBook Pro 16" M3 Max, Dell XPS 15 OLED
3. **Smart Gadgets** - Smart Desk Lamp, Wireless Charging Pad, Smart Backpack
4. **Audio** - AirPods Pro 2, Sony WH-1000XM5
5. **Accessories** - MX Master 3S Mouse, Mechanical Keyboard RGB

### Product Features
- Detailed specifications stored in JSONB format
- Multiple product images with display ordering
- Product variants for storage options (iPhone, MacBook)
- Proper SKU codes and pricing per variant

## Migration Steps Completed

✅ Updated `.env.local` with correct Supabase credentials
✅ Updated `types/database.ts` with new schema types
✅ Updated `/api/categories` to query collections table
✅ Updated `/api/brands` with backward compatibility
✅ Updated `/api/products` for new schema
✅ Updated `/api/products/[id]` for new schema

## What Still Needs Work

### Frontend Components
The following components may need updates to work with the new schema:

1. **Product Forms** (`components/products/add-product-form.tsx`)
   - Update to use `collection_id` instead of `category_id`
   - Update to handle `product_images` table instead of `additional_images` array
   - Add support for variants
   - Remove fields: `affiliate_url`, `brand_name`, `pros`, `cons`, `rating`, `in_stock`, `featured`

2. **Product Display Components**
   - Update to use `handle` instead of `slug`
   - Update to use `featured_image_url` instead of `main_image_url`
   - Update to fetch images from `product_images` table
   - Update to display variants

3. **Import/Export Features**
   - Update CSV import to match new schema
   - Update bulk operations to handle new table structure

### Testing Checklist

After updating frontend components, test:
- [ ] View products list
- [ ] View single product details
- [ ] Create new product
- [ ] Edit existing product
- [ ] Delete product
- [ ] Filter by collection
- [ ] Search products
- [ ] Upload product images
- [ ] Manage product variants

## Database Access

To view the current database:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `nnggbyiicacjzwhftbgh`
3. Navigate to Table Editor
4. View tables: `collections`, `products`, `product_images`, `variants`

## SQL Scripts Location

The complete schema and seed data are available in:
```
Techwiser_shop/scripts/
├── 01-schema.sql              # Core schema
├── 02-seed.sql                # Original furniture products
├── 03-add-specifications.sql  # JSONB specifications
├── 04-add-multiple-product-images.sql  # Multiple images
└── 05-tech-products-seed.sql  # Current tech products (LATEST)
```

## Support

For questions or issues:
1. Check `DATABASE_SUMMARY.md` for schema reference
2. Check `Techwiser_shop/DATABASE_SETUP.md` for setup guide
3. Check `Techwiser_shop/TECH-PRODUCTS-MIGRATION.md` for product details

## Next Steps

1. Update frontend components to match new schema
2. Test all CRUD operations
3. Update import/export functionality
4. Add support for product variants in UI
5. Add support for multiple product images in UI
