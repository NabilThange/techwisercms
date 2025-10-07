# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview and architecture

- Framework: Next.js 14 (App Router) with TypeScript and Tailwind CSS 4.
- UI: Radix UI-based components (shadcn-style) under components/ui and feature-specific components under components/products and components/dashboard.
- API layer: Route Handlers in app/api/* interacting with Supabase Postgres and Storage.
  - Products: app/api/products (CRUD-ish + bulk ops + CSV import).
  - Taxonomy: app/api/categories (create/list, used during imports). No brands table — use product.brand_name.
  - Uploads: app/api/upload (streams to Supabase Storage bucket product-images and returns a public URL).
  - Dashboard: app/api/dashboard/{analytics,logs,metrics} (require x-dashboard-password header; some endpoints call the Vercel API).
- Data and services:
  - Supabase SSR/browser clients in lib/supabase/{server.ts,client.ts} using NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
  - CSV/XLSX import pipeline in lib/*: file-parsers.ts → import-validator.ts → import-processor.ts → app/api/products/import.
  - General utilities: lib/db-utils.ts (slugging, price formatting, URL/YouTube parsing), lib/upload.ts (Storage helpers).
- Types and config:
  - Type aliases live in types/*.ts (e.g., types/database.ts referenced in import-validator).
  - TS paths alias @/* → project root (see tsconfig.json).
  - next.config.ts enables images.unoptimized and ignores build TypeScript/ESLint errors.
  - ESLint flat config extends next/core-web-vitals and next/typescript via eslint.config.mjs.
- Database schema and setup:
  - SUPABASE_INTEGRATION.md documents tables and indexes for categories and products, plus JSONB fields and triggers. Products store additional_images (array), specifications (object), pros/cons (arrays), brand_name (text), and require affiliate_url.
  - SQL scripts in scripts/ (setup-database.sql, seed-default-data.sql, create-storage-bucket.sql) to initialize a Supabase project.

Commands you’ll commonly run

Package manager: pnpm-lock.yaml is present; prefer pnpm. npm also works (package-lock.json is present). Replace pnpm with npm run where needed.

- Install dependencies
  - pnpm install
  - npm install

- Start dev server
  - pnpm dev
  - npm run dev
  - Default: http://localhost:3000

- Build for production
  - pnpm build
  - npm run build

- Start production server (after build)
  - pnpm start
  - npm run start

- Lint
  - pnpm lint
  - npm run lint
  - Auto-fix (when appropriate): npx next lint --fix

- Type-check (tsconfig sets noEmit; next.config ignores build errors, so run this manually when you need strict TS checks)
  - npx tsc --noEmit

- Tests
  - There is no test framework or test script configured in package.json. Add one (e.g., Vitest/Jest) if you need tests; running a single test is not applicable until that exists.

Environment configuration

Create a .env.local file at the repo root before running locally. Required variables observed in code:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- DASHBOARD_PASSWORD (for dashboard APIs)
- VERCEL_API_TOKEN, VERCEL_PROJECT_ID (required by dashboard/logs and dashboard/metrics)
- VERCEL_TEAM_ID (optional; used to scope Vercel API calls)
- NEXT_PUBLIC_SITE1_URL (optional; used by dashboard/metrics HEAD request)

Supabase notes

- Storage bucket: product-images is used by the upload route and lib/upload.ts.
- Initialize your database and bucket using the SQL scripts under scripts/ via the Supabase SQL Editor or psql.
- The schema in SUPABASE_INTEGRATION.md includes products with JSONB fields (specifications, pros, cons) and categories, plus helpful indexes and updated_at triggers.

CSV/XLSX product import

- UI flow: Products page → Import CSV dialog/wizard (components/products/import-steps/*, import-wizard.tsx) → client-side parse/validate → server import API.
- Client pipeline:
  - lib/file-parsers.ts: parseCSV and parseXLSX produce { headers, rows, totalRows }.
  - lib/import-validator.ts: validates required fields (title, affiliate_url, price > 0, rating 1–5, category present), parses arrays/booleans, collects new categories.
  - lib/import-processor.ts: creates missing categories, then batches POSTs to /api/products/import.
- Server import: app/api/products/import/route.ts writes the product (including JSONB fields and brand_name/affiliate_url) and ensures a unique slug. main_image_url defaults to the first image or /diverse-products-still-life.png.
- Reference docs with field mapping and aliases: docs/CSV_IMPORT_FIELD_MAPPING.md and README_CSV_IMPORT.md.

API usage notes (local dev)

- Protected dashboard endpoints require a header x-dashboard-password that matches DASHBOARD_PASSWORD.
- Example (replace placeholders before use):

  curl example

  curl -sS -H "x-dashboard-password: {{DASHBOARD_PASSWORD}}" http://localhost:3000/api/dashboard/metrics

  PowerShell example

  $headers = @{ 'x-dashboard-password' = $env:DASHBOARD_PASSWORD }
  Invoke-RestMethod -Headers $headers -Uri "http://localhost:3000/api/dashboard/metrics" -Method GET

- Import a single product (server will create related rows as needed). Replace placeholders and keep types consistent:

  curl JSON example

  curl -sS -X POST \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Sample Product",
      "category_id": "<existing-category-uuid>",
      "brand_name": "Sony",
      "affiliate_url": "https://amzn.to/your-affiliate",
      "price": 9999,
      "original_price": 12999,
      "rating": 4.5,
      "short_description": "Brief summary",
      "description": "Long description",
      "images": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
      "pros": ["Great sound", "Comfortable"],
      "cons": ["Expensive"],
      "specs": [{"key":"Battery","value":"30h"},{"key":"Weight","value":"250g"}],
      "in_stock": true,
      "featured": false,
      "youtube_video_id": null
    }' \
    http://localhost:3000/api/products/import

Conventions and gotchas

- TS alias: Use @/ to import from the project root (set in tsconfig.json).
- Build ignores ESLint/TS errors via next.config; run npx tsc --noEmit and pnpm lint when you need stricter checks.
- Duplicate next.config files exist (next.config.ts and next.config.mjs) with the same settings; Next.js will use the TypeScript file. Keep them in sync if you edit.
- Both pnpm-lock.yaml and package-lock.json are present; prefer pnpm to avoid drift.
- No brands table exists; use product.brand_name and product.affiliate_url (required) per SUPABASE_INTEGRATION.md.
