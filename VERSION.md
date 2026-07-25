# Version History

## v1.0.2 — 2026-07-24

Storefront UI refresh: marketplace-style search filters and a shared modular “brick” design system across major pages.

### Highlights
- **Search / filters** — collapsible facet rail, color swatches, size tickets, price bars, active chips, sort control, mobile refine drawer (`SearchLayout`)
- **Brick design system** — shared CSS modules (`.brick`, `.brick-cta`, `.brick-buybox`, `.product-tile`, `.store-section`) for consistent clipped blocks, labels, and CTAs
- **Page polish** — home, PDP, cart, header search, and footer aligned to the same visual language
- **Home overlap fix** — removed hero/content negative-margin overlap; stud spacing and carousel stacking cleaned up

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.0.2` |
| Store API | `store-backend/` | `1.0.0` (`store-api`) |

### Notable paths
- `next-ecommerce/components/shared/search/search-filters.tsx`
- `next-ecommerce/lib/search/filter-utils.ts`
- `next-ecommerce/app/globals.css` (brick + filter tokens)

---

## v1.0.1 — 2026-07-24

Patch release fixing storefront layout and category image bugs found after v1.0.0.

### Fixes
- **Product price alignment** — restored `forListing` conditional (`justify-center` on listings, `justify-start` on PDP/buy box). The previous ternary always applied `justify-start`.
- **Home category images** — load a representative image via `searchCatalog({ category: slug })` (or `category.imageUrl`) instead of fragile substring matching / modulo fallback that could assign the wrong product image to a category.

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.0.1` |
| Store API | `store-backend/` | `1.0.0` (`store-api`) |

---

## v1.0.0 — 2026-07-24

First commercial-store release of the ecommerce monorepo.

### Highlights
- **General catalog API** (`store-backend/`) — products, category tree, brands, filterable attributes
- **Faceted search** — Amazon-style filters with counts (`GET /api/v1/products`)
- **Next.js storefront** connected to the catalog API (fallback catalog when API is offline)
- **Retail UI refresh** — commerce chrome, full-bleed hero, product tiles, filter chips, multi-column footer
- Renamed `bookstore-backend` → `store-backend`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.0.0` |
| Store API | `store-backend/` | `1.0.0` (`store-api`) |

### Breaking / migration notes
- Catalog endpoints are `/api/v1/products` and `/api/v1/categories` (not book-only)
- Env: use `CATALOG_API_URL` or `STORE_API_URL` (replaces `BOOKSTORE_API_URL`)
- Local DB defaults: database `store`, user `store_user`

### Quick start
```bash
# API
cd store-backend
docker compose up -d postgres redis
./gradlew bootRun

# Storefront
cd next-ecommerce
cp env.example .env
npm install
npm run dev
```

---

## Earlier history
- Pre-1.0 work lived as a Next.js ecommerce app plus a separate bookstore Spring Boot API, later combined in this monorepo.
