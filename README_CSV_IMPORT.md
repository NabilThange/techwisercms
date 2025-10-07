# CSV Product Import Guide

## Overview

The CSV import feature allows you to bulk import products into your TechWiser shop. The import process validates all data, provides detailed error reporting, and inserts products into Supabase exactly like the Add Product modal.

## Quick Start

1. Click "Import CSV" button on the Products page
2. Download the CSV template
3. Fill in your product data
4. Upload the CSV file
5. Review the preview and validation errors
6. Click "Import Products" to complete the import

## CSV Format

### Required Columns

- **title** - Product name (max 255 characters)
- **category_id** - Category UUID or category name
- **affiliate_url** - Affiliate tracking URL (must be a valid URL)
- **price** - Product price in INR (positive number)
- **rating** - Product rating (1-5)

### Optional Columns

- **brand_name** - Brand name (free text)
- **original_price** - Original price for showing discounts
- **short_description** - Brief description (max 200 characters)
- **description** - Full product description
- **images** - Comma-separated image URLs
- **pros** - Pipe-separated positive points (e.g., "Great sound|Long battery")
- **cons** - Pipe-separated negative points (e.g., "Expensive|Heavy")
- **specs** - Pipe-separated key:value pairs (e.g., "Battery:30h|Weight:250g")
- **in_stock** - true/false or 1/0 (default: true)
- **featured** - true/false or 1/0 (default: false)
- **youtube_video_id** - YouTube video ID or full URL

### Column Aliases

You can use alternative column names:

- **title**: name, product_name
- **price**: cost, selling_price
- **original_price**: mrp, list_price, was_price
- **short_description**: summary, tagline
- **description**: details, full_description
- **images**: image_urls, img_urls, photos
- **category_id**: category, category_name
- **brand_name**: brand, brand_name
- **affiliate_url**: affiliate, affiliate_link, link
- **in_stock**: stock, available, availability
- **youtube_video_id**: youtube_url, video_url, yt_url

## Example CSV

```csv
title,category_id,brand_name,affiliate_url,price,original_price,rating,short_description,description,images,pros,cons,specs,in_stock,featured,youtube_video_id
"Awesome Wireless Headphones","Audio","Sony","https://amzn.to/your-affiliate",9999.00,12999.00,4.5,"Premium wireless headphones","These headphones deliver exceptional audio quality.","https://example.com/img1.jpg,https://example.com/img2.jpg","Great sound|Comfortable fit|Long battery","Expensive|Heavy","Battery:30h|Weight:250g|Bluetooth:5.0",true,false,"dQw4w9WgXcQ"
```

## Important Notes

1. **Empty fields are allowed** - Only title, category_id, affiliate_url, price, and rating are required
2. **Category lookup** - You can use either UUID or name for categories
3. **Automatic slug generation** - Slugs are auto-generated from titles and made unique
4. **Batch processing** - Large CSVs are processed in batches of 10 to avoid timeouts
5. **Error handling** - Invalid rows are skipped and reported; valid rows are still imported
6. **Download failed rows** - After import, you can download a CSV of failed rows with error messages

### Validation Rules

- Title: Required, max 255 characters
- Affiliate URL: Required, must be a valid URL
- Price: Required, must be positive number
- Rating: Required, must be 1-5
- Category: Required, must exist in database
- Images: Must be valid URLs
- Booleans: Accept true/false, 1/0, yes/no
- YouTube: Accepts video ID or full URL (ID will be extracted)

## Troubleshooting

**"Category not found"** - Make sure the category name or ID exists in your database

**"Invalid image URLs"** - Check that all image URLs are properly formatted with http:// or https://

**"Price must be a positive number"** - Ensure price values are numeric and greater than 0

**"Rating must be between 1 and 5"** - Rating values must be integers from 1 to 5

## Support

For issues or questions, check the validation errors in the import dialog or download the failed rows CSV for detailed error messages.
