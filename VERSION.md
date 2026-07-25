# Version History

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
