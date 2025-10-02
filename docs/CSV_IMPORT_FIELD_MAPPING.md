# Product CSV Import - Field Mapping Documentation

## Step 1: Add Product Modal Field Analysis

This document lists all fields from the Add Product Modal and their requirements for CSV import.

### Required Fields

| Field Name | Type | Database Column | Validation | Notes |
|------------|------|-----------------|------------|-------|
| **title** | string | `title` | Required, max 255 chars | Product name |
| **category_id** | UUID | `category_id` | Required, must exist in categories table | Foreign key to categories |
| **price** | number | `price` | Required, must be > 0 | Decimal(10,2) in INR |
| **rating** | number | `rating` | Required, 1-5 | Overall product rating |

### Optional Fields with Defaults

| Field Name | Type | Database Column | Default | Validation | Notes |
|------------|------|-----------------|---------|------------|-------|
| **slug** | string | `slug` | Auto-generated from title | Unique, max 255 chars | URL-friendly identifier |
| **brand_id** | UUID | `brand_id` | null | Must exist in brands table if provided | Foreign key to brands |
| **short_description** | string | `short_description` | null | Max 200 chars | Brief product summary |
| **description** | string | `description` | null | No limit | Full product description |
| **original_price** | number | `original_price` | null | Must be > 0 if provided | For showing discounts |
| **in_stock** | boolean | `in_stock` | true | true/false/1/0 | Availability status |
| **featured** | boolean | `featured` | false | true/false/1/0 | Featured product flag |
| **youtube_video_id** | string | `youtube_video_id` | null | Valid YouTube ID | Extracted from URL |
| **main_image_url** | string | `main_image_url` | "/diverse-products-still-life.png" | Valid URL | First image or default |

### Array/Nested Fields

| Field Name | Type | Related Table | Format | Notes |
|------------|------|---------------|--------|-------|
| **images** | array | `product_images` | Comma-separated URLs | Multiple product images |
| **pros** | array | `product_pros_cons` (type='pro') | Pipe-separated strings | What I Liked points |
| **cons** | array | `product_pros_cons` (type='con') | Pipe-separated strings | What Could Be Better points |
| **specs** | array | `product_specs` | key:value pairs | Format: "Battery:5000mAh\|Screen:6.5 inch" |

### Auto-Generated Fields

| Field Name | Type | Set By | Notes |
|------------|------|--------|-------|
| **id** | UUID | Database | Primary key |
| **created_at** | timestamp | Database | Auto-set on insert |
| **updated_at** | timestamp | Database | Auto-updated on change |
| **currency** | string | Application | Always "INR" |
| **review_count** | integer | Application | Default 0 |

### Transformations Applied by Modal

1. **Slug Generation**: If not provided, auto-generate from title (lowercase, replace spaces with hyphens, remove special chars)
2. **Price Parsing**: Convert string to decimal, validate > 0
3. **Rating Validation**: Must be integer 1-5
4. **Boolean Parsing**: Accept "true"/"false"/"1"/"0" and convert to boolean
5. **Array Filtering**: Remove empty strings from pros/cons/specs arrays
6. **Image Handling**: First image becomes main_image_url, rest go to product_images table
7. **YouTube ID Extraction**: Extract video ID from full YouTube URL if provided

### CSV Column Aliases (Accepted Alternatives)

| Standard Field | Accepted Aliases |
|----------------|------------------|
| title | name, product_name |
| price | cost, selling_price |
| original_price | mrp, list_price, was_price |
| short_description | summary, tagline |
| description | details, full_description |
| images | image_urls, img_urls, photos |
| category_id | category, category_name |
| brand_id | brand, brand_name |
| in_stock | stock, available, availability |
| youtube_video_id | youtube_url, video_url, yt_url |

### Example CSV Row

\`\`\`csv
title,category_id,brand_id,price,original_price,rating,short_description,description,images,pros,cons,specs,in_stock,featured,youtube_video_id
"Awesome Headphones","uuid-here","uuid-here",9999.00,12999.00,4,"Great sound quality","These headphones deliver exceptional audio quality with deep bass and clear highs.","https://example.com/img1.jpg,https://example.com/img2.jpg","Great sound quality|Comfortable fit|Long battery life","Expensive|Heavy","Battery:30 hours|Weight:250g|Bluetooth:5.0",true,false,"dQw4w9WgXcQ"
\`\`\`

### Validation Rules Summary

1. **Required field check**: title, category_id, price, rating must be present and non-empty
2. **Type validation**: Numeric fields must parse as numbers, booleans as true/false
3. **Range validation**: price > 0, rating between 1-5
4. **Foreign key validation**: category_id and brand_id must exist in respective tables
5. **URL validation**: Image URLs must be valid HTTP/HTTPS URLs
6. **Length validation**: title max 255, short_description max 200
7. **Unique constraint**: slug must be unique (auto-generate with suffix if duplicate)
