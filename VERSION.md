# Version History

## v1.2.2 — 2026-07-24

Seller order queue: list orders that include the seller’s products (line items filtered to owned SKUs).

### Backend
- `GET /v1/seller/orders` joins order items × `products.seller_account_id`

### Frontend
- `/seller/orders` shows seller-scoped line items and subtotal

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.2.2` |
| Store API | `store-backend/` | `1.2.2` (`store-api`) |

---

## v1.2.1 — 2026-07-24

Seller product loop: create/list/publish owned listings end-to-end.

### Backend
- `POST /v1/seller/products`, `PATCH /v1/seller/products/{id}` with `seller_account_id` ownership (`SellerProductService`)

### Frontend
- `/seller/products` list + publish toggle
- `/seller/products/new` create form (`lib/actions/seller.actions.ts`)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.2.1` |
| Store API | `store-backend/` | `1.2.1` (`store-api`) |

---

## v1.2.0 — 2026-07-24

Role-based marketplace structure: **BUYER / SELLER / ADMIN** across storefront and store API.

### Structure
- See [ROLES.md](./ROLES.md) for role matrix, **architecture diagrams** (overview, auth sequence, order flow, ER), and auth bridge
- **FE** — `lib/auth/roles`, guarded `/account`, `/seller/*`, `/admin/*`; signup role choice; demo seeds
- **BE** — `accounts` + `seller_profiles`, JWT role claim, `/v1/accounts`, `/v1/seller/*`, `products.seller_account_id` (Flyway V4)
- **Orders** — Bearer JWT required; `GET /v1/orders/me`; FE mints tokens via `lib/auth/store-token.ts`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.2.0` |
| Store API | `store-backend/` | `1.2.0` (`store-api`) |

---

## v1.1.1 — 2026-07-24

Dead-code cleanup: remove unused bookstore leftovers, stub pages/links, and unused catalog seed/model paths.

### Removed / slimmed
- **Backend** — bookstore Java stack already gone; exception handlers, book cache names, and Flyway V2 book indexes retired (V2 is a no-op; run `flyway repair` if checksum fails)
- **Frontend** — Mongo `Product` model + product seed data; dead CSRF helpers/docs; unused `getAllCategories` / `sortProducts` / flat-category client; browsing-history POST; broken `/page/*` and `/admin` links
- **Added** — `/account` and `/account/orders` list pages (Mongo orders)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.1.1` |
| Store API | `store-backend/` | `1.1.1` (`store-api`) |

---

## v1.1.0 — 2026-07-24

Architecture upgrade: unify catalog types, harden checkout against live stock/price, add Spring orders/variants/admin, and retire bookstore controllers by default.

### Backend (`store-backend`)
- **Sort + batch** — `GET /v1/products?sort=…`, `GET /v1/products/batch?ids=`
- **Orders API** — `POST/GET /v1/orders`, `POST /v1/orders/{id}/pay` with stock/price validation and stock decrement (variant-aware)
- **Variants** — `product_variants` SKUs (color/size/stock/price); seeded with catalog demo data
- **Admin writes** — `POST/PATCH /v1/admin/products` (header `X-Admin-Key`)
- **Auth helper** — `POST /v1/auth/token` + JWT support for BFF
- **Flyway** — `V3__commercial_orders_variants.sql`

### Frontend (`next-ecommerce`)
- **StoreProduct** — canonical catalog-mapped type (Mongoose Product model no longer drives UI)
- **Removed** dead `lib/bookstore/`
- **Search sort** sent to API (not client-only)
- **Batch IDs** for browsing history / cart validation
- **Checkout** revalidates catalog price/stock; prefers Spring orders, Mongo fallback
- **Catalog status banner** when API is offline (prod can refuse silent fallback)
- **PDP variants** show SKU stock from variant rows when present

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.1.0` |
| Store API | `store-backend/` | `1.1.0` (`store-api`) |

### Ops notes
- Admin key: `ADMIN_API_KEY` / `app.admin.api-key` (default `dev-admin-key`)
- Prod catalog fallback: set `ALLOW_CATALOG_FALLBACK=true` only if intentional
- Re-seed local DB (or wipe products) to pick up demo variants

---

## v1.0.2 — 2026-07-24

Storefront UI refresh: marketplace-style search filters and a shared modular “brick” design system across major pages.

### Highlights
- **Search / filters** — collapsible facet rail, color swatches, size tickets, price bars, active chips, sort control, mobile refine drawer (`SearchLayout`)
- **Brick design system** — shared CSS modules for clipped blocks, labels, and CTAs
- **Page polish** — home, PDP, cart, header search, and footer aligned
- **Home overlap fix** — removed hero/content negative-margin overlap

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.0.2` |
| Store API | `store-backend/` | `1.0.0` (`store-api`) |

---

## v1.0.1 — 2026-07-24

Patch: product price alignment + home category image loading.

---

## v1.0.0 — 2026-07-24

First commercial-store release (catalog API + Next storefront + rename to `store-backend`).

### Breaking / migration notes
- Catalog endpoints are `/api/v1/products` and `/api/v1/categories`
- Env: `CATALOG_API_URL` or `STORE_API_URL`
- Local DB defaults: database `store`, user `store_user`
