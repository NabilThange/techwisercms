-- =============================================================================
-- AFFILIATE PRODUCT REVIEW SITE - DATABASE SCHEMA
-- =============================================================================
-- Purpose: Store product reviews with YouTube videos and affiliate links
-- Tables: categories, products
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CATEGORIES TABLE
-- -----------------------------------------------------------------------------
-- Stores product categories (e.g., Smartphones, Laptops, Headphones)
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
  -- Primary key: Unique identifier for each category (UUID format)
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Category name (e.g., "Smartphones") - must be unique across all categories
  name VARCHAR(100) NOT NULL UNIQUE,
  
  -- URL-friendly version of name (e.g., "smartphones") - used in website URLs
  -- Must be unique and lowercase with hyphens instead of spaces
  slug VARCHAR(100) NOT NULL UNIQUE,
  
  -- Optional description explaining what products belong in this category
  description TEXT,
  
  -- Timestamp when this category was first created
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Timestamp when this category was last modified (auto-updated by trigger)
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- PRODUCTS TABLE
-- -----------------------------------------------------------------------------
-- Main table storing all product information including reviews and affiliate links
-- -----------------------------------------------------------------------------
CREATE TABLE products (
  -- Primary key: Unique identifier for each product (UUID format)
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- URL-friendly product identifier (e.g., "iphone-15-pro-max")
  -- Used in website URLs like: yoursite.com/products/iphone-15-pro-max
  -- Must be unique across all products
  slug VARCHAR(255) NOT NULL UNIQUE,
  
  -- Full product name as it appears on the website
  title VARCHAR(255) NOT NULL,
  
  -- Brief 1-2 sentence summary shown in product cards/listings
  short_description TEXT,
  
  -- Full detailed review content (can include HTML formatting)
  -- This is your main review text that appears on the product page
  description TEXT,
  
  -- -------------------------
  -- PRICING INFORMATION
  -- -------------------------
  
  -- Current selling price (required field)
  -- Format: NUMERIC(10, 2) means up to 99,999,999.99
  price NUMERIC(10, 2) NOT NULL,
  
  -- Original price before discount (optional)
  -- Used to show "Was ₹50,000, Now ₹45,000" type pricing
  original_price NUMERIC(10, 2),
  
  -- Currency code (defaults to Indian Rupees)
  -- Use ISO 4217 codes: INR, USD, EUR, etc.
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  
  -- -------------------------
  -- IMAGES
  -- -------------------------
  
  -- Primary product image URL (required)
  -- This is the main image shown in listings and at top of product page
  main_image_url TEXT NOT NULL,
  
  -- Additional product images stored as JSON array (optional)
  -- Example: ["https://cdn.example.com/img1.jpg", "https://cdn.example.com/img2.jpg"]
  -- JSONB format allows flexible number of images per product
  additional_images JSONB,
  
  -- -------------------------
  -- AFFILIATE INFORMATION
  -- -------------------------
  
  -- Your affiliate tracking URL (required)
  -- Example: "https://amzn.to/abc123" or "https://flipkart.com/product?affid=yourID"
  -- This is where users are redirected when they click "Buy Now"
  affiliate_url TEXT NOT NULL,
  
  -- Brand name stored as simple text (e.g., "Apple", "Samsung", "Sony")
  -- No separate brands table needed - just store the name here
  brand_name VARCHAR(100),
  
  -- -------------------------
  -- RATINGS & REVIEWS
  -- -------------------------
  
  -- Product rating out of 5.0 (e.g., 4.5, 3.8)
  -- Format: NUMERIC(2, 1) means one digit before and after decimal (0.0 to 9.9)
  rating NUMERIC(2, 1) DEFAULT 0.0,
  
  -- Number of reviews this rating is based on
  -- Helps show credibility (e.g., "4.5★ based on 250 reviews")
  review_count INTEGER DEFAULT 0,
  
  -- -------------------------
  -- YOUTUBE INTEGRATION
  -- -------------------------
  
  -- YouTube video ID for embedded review video (optional)
  -- Example: If video URL is "youtube.com/watch?v=dQw4w9WgXcQ", store "dQw4w9WgXcQ"
  -- Frontend can construct embed URL: "youtube.com/embed/dQw4w9WgXcQ"
  youtube_video_id VARCHAR(50),
  
  -- -------------------------
  -- PRODUCT DETAILS (FLEXIBLE JSONB)
  -- -------------------------
  
  -- Technical specifications stored as JSON object
  -- Example: {"Display": "6.1-inch OLED", "Processor": "A17 Pro", "RAM": "8GB"}
  -- JSONB allows different specs for different product types
  specifications JSONB,
  
  -- List of positive points stored as JSON array
  -- Example: ["Great camera quality", "Long battery life", "Fast performance"]
  pros JSONB,
  
  -- List of negative points stored as JSON array
  -- Example: ["Expensive", "Heavy", "No charger included"]
  cons JSONB,
  
  -- -------------------------
  -- PRODUCT STATUS FLAGS
  -- -------------------------
  
  -- Whether product is currently available for purchase
  -- Set to false if product is discontinued or out of stock everywhere
  in_stock BOOLEAN DEFAULT true,
  
  -- Whether this product should appear in "Featured Products" section
  -- Use this for products you want to highlight on homepage
  featured BOOLEAN DEFAULT false,
  
  -- Whether product page is visible to public
  -- Set to false for draft products not ready to publish
  -- Allows you to prepare product pages before making them live
  is_published BOOLEAN DEFAULT true,
  
  -- -------------------------
  -- RELATIONSHIPS
  -- -------------------------
  
  -- Foreign key linking to categories table
  -- If category is deleted, this field becomes NULL (not deleted)
  -- This allows products to exist without a category temporarily
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- -------------------------
  -- TIMESTAMPS
  -- -------------------------
  
  -- When this product was first added to database
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- When this product was last modified (auto-updated by trigger)
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------
-- Indexes speed up database queries by creating quick lookup tables
-- Add indexes on columns that are frequently used in WHERE, ORDER BY, or JOIN
-- -----------------------------------------------------------------------------

-- Speed up queries filtering by category
-- Example: SELECT * FROM products WHERE category_id = '...'
CREATE INDEX idx_products_category ON products(category_id);

-- Speed up slug lookups (used in every product page load)
-- Example: SELECT * FROM products WHERE slug = 'iphone-15-pro-max'
CREATE INDEX idx_products_slug ON products(slug);

-- Partial index for featured products (only indexes rows where featured = true)
-- Saves space by not indexing non-featured products
-- Example: SELECT * FROM products WHERE featured = true
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = true;

-- Partial index for published products
-- Example: SELECT * FROM products WHERE is_published = true
CREATE INDEX idx_products_published ON products(is_published) WHERE is_published = true;

-- Speed up queries sorting by newest products first
-- DESC means descending order (newest first)
-- Example: SELECT * FROM products ORDER BY created_at DESC
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Speed up queries sorting by highest rated products
-- Example: SELECT * FROM products ORDER BY rating DESC
CREATE INDEX idx_products_rating ON products(rating DESC);

-- -----------------------------------------------------------------------------
-- AUTO-UPDATE TRIGGER FOR updated_at COLUMN
-- -----------------------------------------------------------------------------
-- This ensures updated_at is automatically set to current time on every UPDATE
-- -----------------------------------------------------------------------------

-- Function that sets updated_at to current timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the updated_at field of the modified row to current time
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Run update_updated_at_column() before any UPDATE on products table
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Run update_updated_at_column() before any UPDATE on categories table
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- JSONB FIELD EXAMPLES
-- =============================================================================
-- These show the exact format to use when inserting data into JSONB columns
-- =============================================================================

-- SPECIFICATIONS EXAMPLE:
-- {
--   "Display": "6.7-inch Super Retina XDR",
--   "Processor": "A17 Pro chip",
--   "Camera": "48MP Main + 12MP Ultra Wide",
--   "Battery": "Up to 29 hours video playback",
--   "Storage": "256GB",
--   "Weight": "221 grams"
-- }

-- PROS EXAMPLE (array of strings):
-- ["Excellent camera quality", "Long battery life", "Fast performance", "Premium build"]

-- CONS EXAMPLE (array of strings):
-- ["Very expensive", "No charger included", "Heavy weight"]

-- ADDITIONAL_IMAGES EXAMPLE (array of URLs):
-- ["https://cdn.example.com/product-back.jpg", "https://cdn.example.com/product-side.jpg"]

-- =============================================================================
-- USAGE NOTES FOR DEVELOPER
-- =============================================================================
-- 1. Always use parameterized queries to prevent SQL injection
-- 2. Validate affiliate_url format before inserting (must be valid URL)
-- 3. Ensure slug is URL-safe (lowercase, hyphens, no special chars)
-- 4. Set is_published=false for draft products during creation
-- 5. Use transactions when updating related data (category + products)
-- 6. JSONB fields can be queried: WHERE specifications->>'RAM' = '8GB'
-- 7. Consider adding full-text search on title and description fields later
-- =============================================================================