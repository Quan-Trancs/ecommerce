# Version History

## v1.3.13 — 2026-07-25

Webhook backup for payment confirmation (Stripe + PayPal).

### Backend
- `POST /v1/orders/{id}/pay` accepts `X-Admin-Key` for system/webhook mark-paid (idempotent)

### Frontend
- `/api/webhooks/stripe` — `payment_intent.succeeded` (signature via `STRIPE_WEBHOOK_SECRET`)
- `/api/webhooks/paypal` — `PAYMENT.CAPTURE.COMPLETED` (verify via `PAYPAL_WEBHOOK_ID`)
- PayPal create order sets `custom_id` / `invoice_id` to store order id

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.13` |
| Store API | `store-backend/` | `1.3.13` (`store-api`) |

---

## v1.3.12 — 2026-07-25

Seller dashboard analytics: sales revenue and unshipped fulfillment counts.

### Backend
- `GET /v1/seller/analytics` — products, paid sales (seller lines only), needs-ship orders, unshipped units, last-30-day sales

### Frontend
- Seller overview shows sales / needs-shipping / product / order snapshot

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.12` |
| Store API | `store-backend/` | `1.3.12` (`store-api`) |

---

## v1.3.11 — 2026-07-25

Enable Stripe Payment Element checkout and PaymentIntent refunds on cancel.

### Frontend
- Checkout creates a Stripe PaymentIntent when method is Stripe (keys required)
- Payment Element form + `approveStripeOrder` marks order paid
- Support/admin paid cancel refunds via Stripe when `pi_…` is stored
- `env.example` documents `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.11` |
| Store API | `store-backend/` | `1.3.11` (`store-api`) |

---

## v1.3.10 — 2026-07-25

Buyer order list filters by status and date range.

### Backend
- `GET /v1/orders/me?status=&from=&to=` — optional filters; lists detailed line items

### Frontend
- `/account/orders` status chips, date presets (30/90/365), custom from/to dates
- Order rows show status alongside paid/unpaid

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.10` |
| Store API | `store-backend/` | `1.3.10` (`store-api`) |

---

## v1.3.9 — 2026-07-25

Admin platform order overview with email and status filters.

### Frontend
- `/admin/orders` — recent orders (limit 100), buyer email search, status chips
- Shared `AssistOrderLookup` used by support and admin
- Admin home + nav link to Orders

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.9` |
| Store API | `store-backend/` | `1.3.9` (`store-api`) |

---

## v1.3.8 — 2026-07-25

PayPal refund on support/admin paid cancel; capture id stored at pay time.

### Backend
- Pay payload stores `capture_id` / `price_paid` in `payment_result_json`
- `POST /v1/orders/{id}/cancel` accepts optional refund metadata (`refundId`, `refundSkipped`, …)

### Frontend
- `paypal.refundCapture` + resolve capture from stored JSON or PayPal order lookup
- Elevated paid cancel refunds PayPal before cancel; Stripe skipped (checkout not enabled)
- Support UI: Cancel & refund for PayPal

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.8` |
| Store API | `store-backend/` | `1.3.8` (`store-api`) |

---

## v1.3.7 — 2026-07-25

Support desk: find orders by buyer account email.

### Backend
- `GET /v1/orders/assist/by-email?email=` (SUPPORT/ADMIN) — resolve `accounts` by email, list that user's orders

### Frontend
- `/support` email search (`?email=`) alongside order-id lookup and recent list

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.7` |
| Store API | `store-backend/` | `1.3.7` (`store-api`) |

---

## v1.3.6 — 2026-07-25

Buyer (and support) order cancel with inventory restock. No payment-processor refund.

### Backend
- `POST /v1/orders/{id}/cancel` — buyer: unpaid `PENDING` only; SUPPORT/ADMIN: unpaid or paid, not shipped
- Blocks cancel when any line is already shipped; restores variant/product stock

### Frontend
- Cancel on order detail for buyers (unpaid pending) and support/admin (no refund warning when paid)
- Order `status` / `hasShippedLines` on client order model

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.6` |
| Store API | `store-backend/` | `1.3.6` (`store-api`) |

---

## v1.3.5 — 2026-07-25

Per-seller line fulfillment: sellers ship only their order lines; order becomes SHIPPED when all lines are shipped.

### Backend
- Flyway `V7__order_item_shipped.sql` — `is_shipped` / `shipped_at` on `store_order_items`
- `PATCH /v1/seller/orders/{id}/status` marks seller-owned lines shipped (not whole-order alone)

### Frontend
- Seller orders show Shipped/Unshipped per line
- Buyer delivered when all lines shipped or order status is SHIPPED

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.5` |
| Store API | `store-backend/` | `1.3.5` (`store-api`) |

---

## v1.3.4 — 2026-07-25

SUPPORT role for customer service: view any order without full admin.

### Backend
- `Role.SUPPORT` with `canAssist()`
- `GET /v1/orders/assist/recent` (SUPPORT/ADMIN)
- Order get elevates for SUPPORT (pay remains owner/ADMIN)

### Frontend
- `/support` order lookup + recent list
- Admin can assign SUPPORT; seed `support@example.com` / `SupportPass123!`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.4` |
| Store API | `store-backend/` | `1.3.4` (`store-api`) |

---

## v1.3.3 — 2026-07-25

Seller can mark paid orders as shipped.

### Backend
- `OrderEntity.Status` adds `SHIPPED`
- `PATCH /v1/seller/orders/{id}/status` with `{ "status": "SHIPPED" }` (Bearer, paid only)

### Frontend
- `/seller/orders` — **Mark shipped** on paid orders
- Buyer order view treats `SHIPPED` as delivered

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.3` |
| Store API | `store-backend/` | `1.3.3` (`store-api`) |

---

## v1.3.2 — 2026-07-25

Cart polish: debounce server PUTs and revalidate line price/stock against the live catalog on hydrate.

### Frontend
- `schedulePersist` debounces cart upserts (~450ms, latest snapshot wins)
- `revalidateCartItems` / `refreshCartFromCatalog` drop OOS/unpublished SKUs and refresh price/stock
- Guests get catalog refresh on load; signed-in users still merge + persist

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.2` |
| Store API | `store-backend/` | `1.3.2` (`store-api`) |

---

## v1.3.1 — 2026-07-25

Persistent cart for signed-in users in Postgres (guests stay on localStorage).

### Backend
- Flyway `V6__persistent_carts.sql` — `carts` + `cart_items`
- `GET/PUT/DELETE /v1/cart` (Bearer)

### Frontend
- Cart mutations sync via `persistCartSnapshot`
- `CartHydrator` merges local + server cart on load
- Checkout `clearCart` also clears the server cart

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.1` |
| Store API | `store-backend/` | `1.3.1` (`store-api`) |

---

## v1.3.0 — 2026-07-24

Single database: Postgres only. NextAuth users and store accounts share `accounts`; MongoDB removed.

### Backend
- Flyway `V5__accounts_auth_credentials.sql` — `password_hash`, `email_verified`, `image` on `accounts`

### Frontend
- Auth/register/admin/seed use `pg` against the store Postgres DB
- Removed Mongo adapter, mongoose models, and Mongo order fallback
- Orders are store API / Postgres only

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.0` |
| Store API | `store-backend/` | `1.3.0` (`store-api`) |

---

## v1.2.5 — 2026-07-24

Admin catalog moderation: list/create/update platform products via `/v1/admin/products`.

### Backend
- `GET /v1/admin/products` (X-Admin-Key)
- Product DTO includes `sellerAccountId`

### Frontend
- `/admin/catalog` — create form, publish toggle, price/stock edit

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.2.5` |
| Store API | `store-backend/` | `1.2.5` (`store-api`) |

---

## v1.2.4 — 2026-07-24

Seller product inline price/stock editing on `/seller/products`.

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.2.4` |
| Store API | `store-backend/` | `1.2.4` (`store-api`) |

---

## v1.2.3 — 2026-07-24

Admin users & roles: list Mongo users, change BUYER/SELLER/ADMIN, sync store account via token mint.

### Frontend
- `/admin/users` table with role select
- Updates Mongo `User.role` and upserts store account (`mintStoreAccessToken`)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.2.3` |
| Store API | `store-backend/` | `1.2.3` (`store-api`) |

---

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
