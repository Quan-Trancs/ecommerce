# Version History

## v1.3.98 — 2026-07-26

Seller shop announcements with in-app notices to followers.

### Backend
- Flyway `V49__shop_announcements.sql`
- In-app type `SHOP_ANNOUNCEMENT` (no email for v1); reuses `notify_shop_follows`

### Frontend
- Seller dashboard form to post/delete announcements (max 5/day)
- Public shop “Announcements” section (latest 5)
- Account prefs copy updated for announcements

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.98` |
| Store API | `store-backend/` | `1.3.98` (`store-api`) |

---

## v1.3.97 — 2026-07-26

Seller shop logo and name links on the compare page.

### Frontend
- Compare loads shops via `getSellerShopsForProducts`
- Product headers and a Shop comparison row link to `/shop/{slug}`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.97` |
| Store API | `store-backend/` | `1.3.97` (`store-api`) |

---

## v1.3.96 — 2026-07-26

Seller shop logo and name links on the wishlist page.

### Frontend
- Wishlist items include `sellerAccountId`; batch shop lookup via `getSellerShopsForProducts`
- Each saved product shows an optional shop logo + link to `/shop/{slug}`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.96` |
| Store API | `store-backend/` | `1.3.96` (`store-api`) |

---

## v1.3.95 — 2026-07-26

Shop logo and name links on the browsing-history carousel.

### Frontend
- `/api/products/browsing-history` returns `{ products, shopsBySellerId }`
- Recently viewed / related strips pass shops into `ProductSlider`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.95` |
| Store API | `store-backend/` | `1.3.95` (`store-api`) |

---

## v1.3.94 — 2026-07-26

Seller shop logo and name link on product cards.

### Frontend
- Batch `getSellerShopsForProducts` for search, home, and related grids
- Product cards show optional logo + shop name linking to `/shop/{slug}`
- Public shop grids reuse the parent shop (no extra query)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.94` |
| Store API | `store-backend/` | `1.3.94` (`store-api`) |

---

## v1.3.93 — 2026-07-26

Follow shop from the product detail page buy box.

### Frontend
- Reuses `ShopFollowButton` + `getShopFollowStatus` when the listing has a seller shop
- Sign-in redirect preserves the product URL

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.93` |
| Store API | `store-backend/` | `1.3.93` (`store-api`) |

---

## v1.3.92 — 2026-07-26

Product detail page shows a compact seller shop policies snippet.

### Frontend
- PDP “Shop policies” brick under About when the seller set shipping/returns text
- Link to full policies on `/shop/{slug}#shop-policies`
- Shop page policies section gets `id="shop-policies"` for deep links

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.92` |
| Store API | `store-backend/` | `1.3.92` (`store-api`) |

---

## v1.3.91 — 2026-07-26

Seller shop shipping and returns policies on public shop pages.

### Backend
- Flyway `V48__seller_shop_policies.sql` — `shipping_policy` / `returns_policy`
- JPA fields on `SellerProfileEntity`

### Frontend
- Seller profile form textareas for shipping and returns (up to 2000 chars)
- Public shop “Shop policies” section below the catalog

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.91` |
| Store API | `store-backend/` | `1.3.91` (`store-api`) |

---

## v1.3.90 — 2026-07-26

Seller shop social links (website, Instagram, X) on public shop pages.

### Backend
- Flyway `V47__seller_shop_social_links.sql` — website / Instagram / X URL columns
- JPA fields on `SellerProfileEntity`; https + host validation on save

### Frontend
- Seller profile form fields for website, Instagram, and X (@handle or URL)
- Public shop header shows outbound links when set

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.90` |
| Store API | `store-backend/` | `1.3.90` (`store-api`) |

---

## v1.3.89 — 2026-07-26

Seller shop logo/avatar beside the shop name.

### Backend
- Flyway `V46__seller_shop_logo.sql` — `seller_profiles.shop_logo_url`
- JPA `SellerProfileEntity.shopLogoUrl`

### Frontend
- Seller dashboard upload/replace/remove logo
- Public shop header and Following list show the logo

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.89` |
| Store API | `store-backend/` | `1.3.89` (`store-api`) |

---

## v1.3.88 — 2026-07-26

Seller shop cover/banner images on public shop pages.

### Backend
- Flyway `V45__seller_shop_banner.sql` — `seller_profiles.shop_banner_url`
- JPA `SellerProfileEntity.shopBannerUrl`

### Frontend
- Seller dashboard upload/replace/remove banner (reuses product image storage)
- Public `/shop/{slug}` full-bleed banner above shop header

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.88` |
| Store API | `store-backend/` | `1.3.88` (`store-api`) |

---

## v1.3.87 — 2026-07-26

Seller follower count and batched new-listing email digests.

### Backend
- Flyway `V44__shop_listing_digest_queue.sql` — per-follower listing digest queue
- Cron `/api/cron/shop-follow-digests` every 6h; in-app alerts stay immediate

### Frontend
- Seller dashboard shows shop follower count
- Follow emails batched into digests instead of one-per-listing

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.87` |
| Store API | `store-backend/` | `1.3.87` (`store-api`) |

---

## v1.3.86 — 2026-07-26

Follow seller shops and get new-listing alerts.

### Backend
- Flyway `V43__shop_follows.sql` — `shop_follows` + `notify_shop_follows`
- Notify followers when a seller creates or publishes a listing

### Frontend
- Follow / Following on `/shop/{slug}`
- `/account/following` list; account setting to opt out of alerts
- Email + in-app `SHOP_NEW_LISTING`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.86` |
| Store API | `store-backend/` | `1.3.86` (`store-api`) |

---

## v1.3.85 — 2026-07-26

Search, sort, and in-stock filter on public seller shops.

### Frontend
- `/shop/{slug}?q=&sort=&stock=1` — name/description search, newest / price / name sort, in-stock toggle
- Empty-state when filters match nothing

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.85` |
| Store API | `store-backend/` | `1.3.85` (`store-api`) |

---

## v1.3.84 — 2026-07-26

Pretty seller shop URLs.

### Backend
- Flyway `V42__seller_shop_slug.sql` — unique `shop_slug` on `seller_profiles` (backfilled)
- Spring `SellerProfileEntity.shopSlug` required on profile create

### Frontend
- Canonical `/shop/{slug}`; legacy `/shop/{accountId}` redirects
- Sellers can edit URL slug on the dashboard
- PDP “Sold by” links use the pretty slug

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.84` |
| Store API | `store-backend/` | `1.3.84` (`store-api`) |

---

## v1.3.83 — 2026-07-26

Wishlist price-drop alerts.

### Backend
- Flyway `V41__wishlist_price_drops.sql` — `watched_price` + alert state; `notify_price_drops`
- Event-driven notify when seller/admin lowers a product price

### Frontend
- Email + in-app `PRICE_DROP` vs wishlist baseline
- Wishlist shows “Down from …” when cheaper than saved price
- Account setting to opt out

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.83` |
| Store API | `store-backend/` | `1.3.83` (`store-api`) |

---

## v1.3.82 — 2026-07-26

Public seller shop pages.

### Frontend
- `/shop/[id]` storefront listing published products for a seller
- PDP “Sold by {shop}” link when the listing has a seller profile
- Seller dashboard: edit shop name/bio + view public shop

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.82` |
| Store API | `store-backend/` | `1.3.82` (`store-api`) |

---

## v1.3.81 — 2026-07-26

Post-delivery product review request emails.

### Backend
- Flyway `V40__review_request_emails.sql` — `notify_review_requests` + per-order dedupe
- Cron `/api/cron/review-requests` daily 15:00 UTC; delay via `REVIEW_REQUEST_DAYS` (default 7)

### Frontend
- One email per fully shipped order listing unreviewed products
- Account setting to opt out

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.81` |
| Store API | `store-backend/` | `1.3.81` (`store-api`) |

---

## v1.3.80 — 2026-07-26

Buyer back-in-stock alerts for out-of-stock products.

### Backend
- Flyway `V39__stock_alert_subscriptions.sql` — subscriptions + `accounts.notify_back_in_stock`
- Event-driven notify on seller/admin stock updates, cancel restock, and partial refund restock

### Frontend
- PDP “Notify me when available” when out of stock
- Email + in-app `BACK_IN_STOCK`; account setting to opt out
- One-shot: subscription cleared after notify

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.80` |
| Store API | `store-backend/` | `1.3.80` (`store-api`) |

---

## v1.3.79 — 2026-07-26

Shipment carrier + tracking on seller mark-shipped.

### Backend
- Flyway `V38__order_item_tracking.sql` — `shipping_carrier`, `tracking_number` on `store_order_items`
- `PATCH /v1/seller/orders/{id}/status` accepts optional `carrier` + `trackingNumber`

### Frontend
- Seller ship form collects optional carrier and tracking
- Buyer/staff order details show tracking with carrier deep-links when known
- Shipped email lists tracking when present

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.79` |
| Store API | `store-backend/` | `1.3.79` (`store-api`) |

---

## v1.3.78 — 2026-07-26

Pinned-only filter on unanswered Q&A inboxes.

### Frontend
- `?pinned=1` All / Pinned tabs on admin, support, and seller question inboxes
- Combines with age, scope, and search; counts reflect the current age slice

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.78` |
| Store API | `store-backend/` | `1.3.78` (`store-api`) |

---

## v1.3.77 — 2026-07-26

Pin important unanswered product Q&A in seller and staff inboxes.

### Backend
- Flyway `V37__product_qa_pinned.sql` — `pinned_at` on `product_questions`
- Answering a question clears its pin

### Frontend
- Pin / Unpin on seller, admin, and support unanswered inboxes
- Pinned rows sort first; badge on pinned items
- Staff pin/unpin writes `PRODUCT_QA_PIN` / `PRODUCT_QA_UNPIN` audit

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.77` |
| Store API | `store-backend/` | `1.3.77` (`store-api`) |

---

## v1.3.76 — 2026-07-26

Filter unanswered Q&A inboxes by aging SLA.

### Frontend
- `?age=overdue|aging|ontrack` tabs on admin, support, and seller question inboxes
- Age filter preserved with scope/search; empty list when no matches

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.76` |
| Store API | `store-backend/` | `1.3.76` (`store-api`) |

---

## v1.3.75 — 2026-07-26

Aging / SLA badges on unanswered Q&A inboxes.

### Frontend
- On track (&lt;24h), Aging (24–72h), Overdue (72h+) badges on staff + seller inboxes
- Header counts for overdue/aging in the current list

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.75` |
| Store API | `store-backend/` | `1.3.75` (`store-api`) |

---

## v1.3.74 — 2026-07-26

Seller email digests for unanswered product Q&A.

### Backend
- Flyway `V36__seller_qa_digest.sql` — opt-out pref + digest cooldown state
- Cron `/api/cron/product-qa-digests` every 6h; interval via `PRODUCT_QA_DIGEST_HOURS` (default 24)

### Frontend
- Digest email listing open questions; notification settings toggle

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.74` |
| Store API | `store-backend/` | `1.3.74` (`store-api`) |

---

## v1.3.73 — 2026-07-26

Auto-hide product Q&A after enough open buyer reports.

### Backend
- Flyway `V35__product_qa_hidden.sql` — soft-hide columns
- Threshold via `PRODUCT_QA_AUTO_HIDE_REPORTS` (default 3, min 2)

### Frontend
- Hitting the threshold hides the question from PDP/seller/staff unanswered inboxes
- Dismissing reports restores auto-hidden questions; reports queue shows auto-hidden badge

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.73` |
| Store API | `store-backend/` | `1.3.73` (`store-api`) |

---

## v1.3.72 — 2026-07-26

Buyer report/flag for abusive product Q&A.

### Backend
- Flyway `V34__product_qa_reports.sql` — one report per asker/question, staff resolve

### Frontend
- PDP Report form (reason + optional note); staff queue at `/admin|support/questions/reports`
- In-app notify staff; dismiss or remove; audit on dismiss

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.72` |
| Store API | `store-backend/` | `1.3.72` (`store-api`) |

---

## v1.3.71 — 2026-07-26

Unanswered-only filter on the PDP Q&A panel.

### Frontend
- Toggle “Unanswered only” when open questions exist
- Header shows unanswered count; empty state when filter has no matches

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.71` |
| Store API | `store-backend/` | `1.3.71` (`store-api`) |

---

## v1.3.70 — 2026-07-26

PDP Q&A sort tabs: Most helpful / Newest.

### Frontend
- Client sort on the product Q&A panel (default Most helpful)
- Answered questions rank by helpful count; Newest is chronological

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.70` |
| Store API | `store-backend/` | `1.3.70` (`store-api`) |

---

## v1.3.69 — 2026-07-26

Helpful votes on answered product Q&A.

### Backend
- Flyway `V33__product_qa_helpful.sql` — per-account votes on questions

### Frontend
- Signed-in users can toggle Helpful on answers (not their own)
- PDP sorts answered by helpful count; shows counts for guests

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.69` |
| Store API | `store-backend/` | `1.3.69` (`store-api`) |

---

## v1.3.68 — 2026-07-26

Search/filter unanswered Q&A on seller and staff inboxes.

### Frontend
- `?q=` filters by product name, question body, asker (staff also seller label)
- Shared `QaInboxSearchForm`; scope tabs preserve the query
- Match count shown when filtered

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.68` |
| Store API | `store-backend/` | `1.3.68` (`store-api`) |

---

## v1.3.67 — 2026-07-26

Sellers can hide unanswered Q&A on their own listings.

### Frontend
- `sellerHideProductQuestion` — unanswered only, product ownership enforced
- Hide control on `/seller/questions` and PDP (`canSellerHide`)
- Staff moderation still covers answered questions

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.67` |
| Store API | `store-backend/` | `1.3.67` (`store-api`) |

---

## v1.3.66 — 2026-07-26

Staff moderation: SUPPORT/ADMIN can delete abusive product Q&A.

### Frontend
- `moderateDeleteProductQuestion` (answered or not) + staff audit `PRODUCT_QA_DELETE`
- Remove control on staff Q&A inbox and PDP (`canModerate`)
- Asker self-remove unchanged for unanswered questions

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.66` |
| Store API | `store-backend/` | `1.3.66` (`store-api`) |

---

## v1.3.65 — 2026-07-26

Staff notify when a buyer asks on a platform-owned product (no seller).

### Frontend
- In-app + email to all active SUPPORT/ADMIN; inbox CTA by role
- Optional `SUPPORT_PRODUCT_QA_EMAIL` (falls back to `SUPPORT_ORDER_NOTES_EMAIL`)
- `ProductQaAskedEmail` accepts staff vs seller inbox path

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.65` |
| Store API | `store-backend/` | `1.3.65` (`store-api`) |

---

## v1.3.64 — 2026-07-26

Email the seller when a buyer asks a product question (in-app already existed).

### Frontend
- `ProductQaAskedEmail` via Resend; links to `/seller/questions`
- Shared `notifyProductQuestionAsked` (in-app body includes product name)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.64` |
| Store API | `store-backend/` | `1.3.64` (`store-api`) |

---

## v1.3.63 — 2026-07-26

Email the asker when their product question is answered (in-app already existed).

### Frontend
- `ProductQaAnswerEmail` via Resend when staff/seller posts an answer
- In-app body includes product name; shared `notifyProductQuestionAnswered`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.63` |
| Store API | `store-backend/` | `1.3.63` (`store-api`) |

---

## v1.3.62 — 2026-07-26

Support-role product Q&A assist (same inbox as admin).

### Frontend
- SUPPORT (and ADMIN) can answer on PDP; staff inbox at `/support/questions`
- Shared `StaffQuestionsInboxClient`; `getStaffQaInbox` for admin/support
- Support nav + overview link with platform open count

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.62` |
| Store API | `store-backend/` | `1.3.62` (`store-api`) |

---

## v1.3.61 — 2026-07-26

Admin unanswered product Q&A inbox (platform + all open).

### Frontend
- `/admin/questions` — platform-only (default) or all unanswered
- Inline admin answers; badges for platform vs seller listings
- Admin nav + overview link with platform open count

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.61` |
| Store API | `store-backend/` | `1.3.61` (`store-api`) |

---

## v1.3.60 — 2026-07-26

Seller unanswered product Q&A inbox.

### Frontend
- `/seller/questions` — unanswered questions on owned listings with inline answer
- Seller nav + overview count card
- New-question in-app notify links to the inbox
- Answer revalidates inbox and PDP

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.60` |
| Store API | `store-backend/` | `1.3.60` (`store-api`) |

---

## v1.3.59 — 2026-07-25

Product Q&A on the PDP.

### Backend
- Flyway `V32__product_qa.sql` — questions with one seller/admin answer

### Frontend
- PDP Q&A panel under reviews
- Signed-in buyers ask; product seller or admin answers
- Asker can remove unanswered questions
- In-app notify seller on ask / asker on answer

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.59` |
| Store API | `store-backend/` | `1.3.59` (`store-api`) |

---

## v1.3.58 — 2026-07-25

Abandoned-cart email reminders for signed-in carts.

### Backend
- Flyway `V31__abandoned_cart_reminders.sql` — `carts.last_abandoned_email_at`, `accounts.notify_abandoned_cart` (default on)

### Frontend
- Hourly cron `GET /api/cron/abandoned-carts` (CRON_SECRET; `ABANDONED_CART_HOURS` default 24)
- Resend template with cart lines + link to `/cart`
- Account settings toggle to opt out
- Guests remain localStorage-only (no reminders)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.58` |
| Store API | `store-backend/` | `1.3.58` (`store-api`) |

---

## v1.3.57 — 2026-07-25

Newsletter / marketing email signup.

### Backend
- Flyway `V30__newsletter_subscribers.sql` — email list with active flag + unsubscribe token

### Frontend
- Footer subscribe form
- `/newsletter/unsubscribe?token=…`
- `/admin/newsletter` list + CSV export

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.57` |
| Store API | `store-backend/` | `1.3.57` (`store-api`) |

---

## v1.3.56 — 2026-07-25

Seller payout CSV export.

### Frontend
- Admin `/api/admin/payouts/export` — all recent payouts with seller identity
- Seller `/api/seller/payouts/export` — own payout history
- Export CSV buttons on `/admin/payouts` and `/seller/earnings`
- Export limit raised to 5000 rows (UI lists unchanged)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.56` |
| Store API | `store-backend/` | `1.3.56` (`store-api`) |

---

## v1.3.55 — 2026-07-25

Recently viewed products carousel polish.

### Frontend
- “Recently viewed” carousel with full product cards + Clear
- Safer Zustand history (immutable updates, max 12)
- Hydration-safe mount; exclude current PDP product
- Shown on home, PDP, cart, and search
- Related-to-viewed strip kept (optional per page)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.55` |
| Store API | `store-backend/` | `1.3.55` (`store-api`) |

---

## v1.3.54 — 2026-07-25

Order invoice PDF download.

### Frontend
- `GET /api/orders/[id]/invoice` — PDF via pdfkit (owner / seller / support / admin via existing order auth)
- Download button on order detail Order Summary
- Includes lines, promo/gift card, tax, shipping, payment status

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.54` |
| Store API | `store-backend/` | `1.3.54` (`store-api`) |

---

## v1.3.53 — 2026-07-25

Seller product CSV import.

### Frontend
- `/seller/products` Import CSV: template, dry-run, commit (max 100 rows)
- Columns: name, price, listPrice, stock, category, description, imageUrl, tags, published
- Category resolved by id / slug / name via catalog API
- Reuses `POST /v1/seller/products` (extended create payload: listPrice, categoryIds, tags)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.53` |
| Store API | `store-backend/` | `1.3.53` (`store-api`) |

---

## v1.3.52 — 2026-07-25

Buyer product compare (side-by-side, max 4).

### Frontend
- Zustand + localStorage compare list (no sign-in)
- Compare toggle on product cards and PDP
- Floating compare bar → `/compare` attribute table
- Catalog mapper keeps product `attributes` for spec rows

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.52` |
| Store API | `store-backend/` | `1.3.52` (`store-api`) |

---

## v1.3.51 — 2026-07-25

Atomic inventory reservations at checkout with unpaid TTL.

### Backend
- Atomic `UPDATE … WHERE stock_quantity >= qty` for product and variant stock on order create
- Atomic restock on cancel / partial refund
- Scheduled job cancels unpaid `PENDING` orders after 30 minutes and releases stock
- Flyway `V29__inventory_reservation_index.sql` — partial index for expiry scans
- Config: `app.orders.unpaid-reservation-minutes` (default 30)

### Frontend
- Checkout note that unpaid orders release reserved stock after 30 minutes

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.51` |
| Store API | `store-backend/` | `1.3.51` (`store-api`) |

---

## v1.3.50 — 2026-07-25

Saved shipping addresses for buyers.

### Backend
- Flyway `V28__saved_addresses.sql` — per-account address book with default flag

### Frontend
- `/account/addresses` manage saved addresses
- Checkout: pick a saved address or save a new one on submit
- Account hub link to Addresses

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.50` |
| Store API | `store-backend/` | `1.3.50` (`store-api`) |

---

## v1.3.49 — 2026-07-25

Checkout gift cards / store credit.

### Backend
- Flyway `V27__gift_cards.sql` — gift cards + redemptions; seed `GIFT25` ($25)

### Frontend
- Checkout: apply gift card after tax & shipping (stacks with promo)
- Fully covered orders auto-mark paid via gift card
- `/admin/gift-cards` create / activate; order details show gift card line

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.49` |
| Store API | `store-backend/` | `1.3.49` (`store-api`) |

---

## v1.3.48 — 2026-07-25

Email + in-app notifications for return requests.

### Frontend
- Buyer email on return submitted / approved / rejected (`RESEND_API_KEY`)
- Matching in-app inbox rows on the order

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.48` |
| Store API | `store-backend/` | `1.3.48` (`store-api`) |

---

## v1.3.47 — 2026-07-25

Wishlist hearts on product cards.

### Frontend
- Compact heart overlay on product tiles (search, home sliders, related)
- Batch wishlist status lookup for listing pages
- Browsing-history cards self-hydrate wishlist state

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.47` |
| Store API | `store-backend/` | `1.3.47` (`store-api`) |

---

## v1.3.46 — 2026-07-25

Auto-refund when a return request is approved.

### Backend
- Partial refund API: `allowShipped` for RMA lines
- Flyway `V26__return_refund_meta.sql` — refund fields on return requests

### Frontend
- Approve return → PayPal/Stripe refund + restock by default (checkbox to skip)
- Failed refund leaves the request open; approved returns show refund amount

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.46` |
| Store API | `store-backend/` | `1.3.46` (`store-api`) |

---

## v1.3.45 — 2026-07-25

Buyer return / RMA requests with staff review.

### Backend
- Flyway `V25__order_returns.sql` — `order_return_requests` + line items

### Frontend
- Order details: request return on shipped units; buyer cancel; staff approve/reject
- `/support/returns` queue of open requests
- Approval posts an internal order note and staff audit entry (refunds still via existing tools)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.45` |
| Store API | `store-backend/` | `1.3.45` (`store-api`) |

---

## v1.3.44 — 2026-07-25

Buyer wishlist / save for later.

### Backend
- Flyway `V24__wishlist.sql` — `wishlist_items` per account + product

### Frontend
- PDP buy box: Save for later / Saved toggle
- `/account/wishlist` — saved products with remove
- Account hub link

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.44` |
| Store API | `store-backend/` | `1.3.44` (`store-api`) |

---

## v1.3.43 — 2026-07-25

Playwright E2E smoke tests for the storefront.

### Frontend
- `e2e/smoke.spec.ts` — public routes + optional buyer/support/admin auth checks
- `npm run test:e2e` (Chromium); reuses a running `next` server when present
- Fixed `useCSRF` React hooks so the sign-in form can load

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.43` |
| Store API | `store-backend/` | `1.3.43` (`store-api`) |

---

## v1.3.42 — 2026-07-25

Admin KPI dashboard on `/admin`.

### Frontend
- Platform overview: 7d/all-time paid revenue, order volume & status, refunds, coupons
- Support queue counts (awaiting / unassigned), catalog published & low-stock, accounts by role

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.42` |
| Store API | `store-backend/` | `1.3.42` (`store-api`) |

---

## v1.3.41 — 2026-07-25

Support ticket assignment (claim / release / reassign).

### Backend
- Flyway `V23__support_ticket_assignments.sql` — per-order assignee

### Frontend
- `/support/tickets` — Mine / Unassigned filters; Claim, Take over, Release, staff dropdown
- Assign / unassign written to staff audit log

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.41` |
| Store API | `store-backend/` | `1.3.41` (`store-api`) |

---

## v1.3.40 — 2026-07-25

Staff audit log for support/admin actions.

### Backend
- Flyway `V22__staff_audit_log.sql` — append-only `staff_audit_log`

### Frontend
- `/admin/audit` — filterable recent staff actions
- Logs cancels (staff), partial refunds, order notes, role changes, coupons, payouts, catalog create/update

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.40` |
| Store API | `store-backend/` | `1.3.40` (`store-api`) |

---

## v1.3.39 — 2026-07-25

Support ticket queue for public order-note threads.

### Frontend
- `/support/tickets` — filter by awaiting staff, urgent, order status
- Shared queue (no assignee); rows open `/account/orders/{id}` for the thread
- Derived from `store_order_notes` (Next + Postgres)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.39` |
| Store API | `store-backend/` | `1.3.39` (`store-api`) |

---

## v1.3.38 — 2026-07-25

Partial line-item refunds for support/admin.

### Backend
- Flyway `V21__partial_refunds.sql` — `refunded_quantity`, `order_refunds`, `order_refund_items`
- Spring `POST /v1/orders/{id}/partial-refund` — restock selected unshipped units, update totals

### Frontend
- Order details: partial refund panel (qty per unshipped line)
- PayPal/Stripe amount refunds + ledger rows; multiple partials allowed
- Seller earnings exclude refunded units

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.38` |
| Store API | `store-backend/` | `1.3.38` (`store-api`) |

---

## v1.3.37 — 2026-07-25

Low-stock alerts for sellers.

### Backend
- Flyway `V20__low_stock_alerts.sql` — `notify_low_stock`, `low_stock_threshold`, alert dedupe state

### Frontend
- In-app `LOW_STOCK` notifications after checkout stock decrement or stock edits
- Seller products banner + highlight for listings at/below threshold
- Account settings: enable alerts + set threshold (default 5)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.37` |
| Store API | `store-backend/` | `1.3.37` (`store-api`) |

---

## v1.3.36 — 2026-07-25

Seller payouts and earnings history.

### Backend
- Flyway `V19__seller_payouts.sql` — payout ledger per seller account

### Frontend
- `/seller/earnings` — available / gross / paid out, payout history, recent paid lines
- `/admin/payouts` — record settlements against available balance
- Available = paid line revenue − recorded payouts

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.36` |
| Store API | `store-backend/` | `1.3.36` (`store-api`) |

---

## v1.3.35 — 2026-07-25

Checkout promo codes / coupons.

### Backend
- Flyway `V18__coupons.sql` — `coupons`, `coupon_redemptions`; seeds `WELCOME10` (10% off)

### Frontend
- Checkout Order Summary: apply / remove promo (discount before tax)
- Admin `/admin/coupons` create + enable/disable
- Order details shows redeemed promo line
- Place-order revalidates coupon and records redemption

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.35` |
| Store API | `store-backend/` | `1.3.35` (`store-api`) |

---

## v1.3.34 — 2026-07-25

Product reviews & ratings for verified paid buyers.

### Backend
- Flyway `V17__product_reviews.sql` — one review per account/product; updates `products.avg_rating` / `num_reviews`

### Frontend
- `/product/[slug]` customer reviews panel (distribution, list, write/update/remove)
- Purchase check against paid non-cancelled orders
- Catalog mapper no longer fakes a 4.5 default rating

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.34` |
| Store API | `store-backend/` | `1.3.34` (`store-api`) |

---

## v1.3.33 — 2026-07-25

Redis pub/sub fanout for live in-app notification SSE.

### Frontend
- Optional Redis bridge (`REDIS_URL` or `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`)
- Publish wakes SSE clients across storefront instances; in-process bus remains the default
- Poll fallback unchanged when Redis is unset or unavailable

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.33` |
| Store API | `store-backend/` | `1.3.33` (`store-api`) |

---

## v1.3.32 — 2026-07-25

In-app notifications for order lifecycle events.

### Frontend
- Inbox rows on **paid** (checkout + webhooks), **fully shipped**, and **cancelled**
- Same global in-app pref + per-order mutes as order notes
- Canceller / shipping seller excluded from their own event fanout

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.32` |
| Store API | `store-backend/` | `1.3.32` (`store-api`) |

---

## v1.3.31 — 2026-07-25

In-app mute preferences for order-note notifications.

### Backend
- Flyway `V16__in_app_mute_prefs.sql` — `accounts.notify_in_app_order_notes` + `order_in_app_mutes`

### Frontend
- Settings: toggle in-app inbox globally; mute live toasts per browser
- Order support thread: mute / unmute in-app alerts for that order
- Inbox creation skips muted accounts (email / SMS / push unchanged)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.31` |
| Store API | `store-backend/` | `1.3.31` (`store-api`) |

---

## v1.3.30 — 2026-07-25

Desktop OS notifications when the signed-in tab is backgrounded.

### Frontend
- Account settings: per-browser “Alert me while browsing” + permission request / test
- On SSE publish, show `Notification` when tab is hidden; toast when visible
- Preference stored in `localStorage` (`notify_desktop_alerts`)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.30` |
| Store API | `store-backend/` | `1.3.30` (`store-api`) |

---

## v1.3.29 — 2026-07-25

Real-time notification refresh via Server-Sent Events.

### Frontend
- `GET /api/notifications/stream` — SSE summary stream (pub/sub + 12s poll fallback)
- Header bell badge/list updates live; toast on new publish
- `/account/notifications` refreshes on live publish
- In-process notification bus wakes SSE when inbox rows change

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.29` |
| Store API | `store-backend/` | `1.3.29` (`store-api`) |

---

## v1.3.28 — 2026-07-25

In-app notification center for order notes.

### Backend
- Flyway `V15__in_app_notifications.sql` — `in_app_notifications` inbox table

### Frontend
- Header bell with unread badge + recent dropdown
- `/account/notifications` full inbox (mark read / mark all)
- Public order notes create in-app rows for buyer + product-scoped sellers

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.28` |
| Store API | `store-backend/` | `1.3.28` (`store-api`) |

---

## v1.3.27 — 2026-07-25

SMS / push channel for urgent order notes.

### Backend
- Flyway `V14__urgent_notes_sms_push.sql` — `urgent` on notes; phone/SMS/push prefs; `push_subscriptions`

### Frontend
- Public notes can be marked **Urgent (SMS / push)**
- Account settings: SMS number + browser push opt-in
- Twilio SMS + Web Push (VAPID) when configured
- Service worker `public/sw.js`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.27` |
| Store API | `store-backend/` | `1.3.27` (`store-api`) |

---

## v1.3.26 — 2026-07-25

Quiet hours for order-note emails.

### Backend
- Flyway `V13__account_quiet_hours.sql` — enabled, start/end hour, timezone

### Frontend
- Account settings: pause emails overnight (IANA timezone)
- During quiet hours, IMMEDIATE notes enqueue; digests do not flush
- Cron/flush skips recipients still in quiet hours

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.26` |
| Store API | `store-backend/` | `1.3.26` (`store-api`) |

---

## v1.3.25 — 2026-07-25

Per-user immediate vs digest preference for order-note emails.

### Backend
- Flyway `V12__account_order_note_email_mode.sql` — `order_note_email_mode` (`DIGEST` | `IMMEDIATE`)

### Frontend
- Account settings: enable notes + Digest / Immediate delivery
- Notify path respects per-recipient mode (global `ORDER_NOTE_DIGEST_MINUTES=0` still forces immediate)
- Switching to Immediate flushes that user’s queued digests

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.25` |
| Store API | `store-backend/` | `1.3.25` (`store-api`) |

---

## v1.3.24 — 2026-07-25

Digest / batch order-note emails instead of per-message.

### Backend
- Flyway `V11__order_note_email_queue.sql` — pending note email queue

### Frontend
- Public notes enqueue per recipient; digests flush by age/batch or cron
- `GET/POST /api/cron/order-note-digests` (CRON_SECRET) + `vercel.json` */15
- `ORDER_NOTE_DIGEST_MINUTES=0` restores immediate emails
- Digest React email template

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.24` |
| Store API | `store-backend/` | `1.3.24` (`store-api`) |

---

## v1.3.23 — 2026-07-25

Buyer/seller email preferences for order-note notifications.

### Backend
- Flyway `V10__account_notify_order_notes.sql` — `accounts.notify_order_notes` (default true)

### Frontend
- `/account/settings` toggle for order-note emails
- `notifyPublicOrderNote` skips accounts that opted out
- Optional support inbox still receives notes when configured

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.23` |
| Store API | `store-backend/` | `1.3.23` (`store-api`) |

---

## v1.3.22 — 2026-07-25

Email parties when a public order note is posted.

### Frontend
- Resend email to buyer + product-scoped sellers (author excluded)
- Optional `SUPPORT_ORDER_NOTES_EMAIL` CC inbox
- INTERNAL notes never send email
- Template: `emails/order-note.tsx`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.22` |
| Store API | `store-backend/` | `1.3.22` (`store-api`) |

---

## v1.3.21 — 2026-07-25

Product image delete / replace cleanup in object storage.

### Frontend
- Replace image deletes the previous managed local/S3 object after a successful patch
- Failed replace rolls back the newly uploaded object
- Remove image clears listing images and deletes managed storage when applicable
- External URLs are never deleted

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.21` |
| Store API | `store-backend/` | `1.3.21` (`store-api`) |

---

## v1.3.20 — 2026-07-25

Seller participation in order notes (product-scoped).

### Backend
- `GET /v1/orders/{id}` allows sellers when the order includes their products (items filtered to theirs)
- `GET/POST /v1/orders/{id}/notes` same product-scoped access; sellers see/post **PUBLIC** only (not INTERNAL)

### Frontend
- Seller orders list links to order detail + support thread
- Seller breadcrumb when viewing a buyer’s order they fulfill

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.20` |
| Store API | `store-backend/` | `1.3.20` (`store-api`) |

---

## v1.3.19 — 2026-07-25

Private staff-only order notes (internal visibility).

### Backend
- Flyway `V9__order_note_visibility.sql` — `visibility` (`PUBLIC` | `INTERNAL`)
- List filters INTERNAL notes from buyers; SUPPORT/ADMIN see all
- `POST` accepts `visibility`; INTERNAL requires assist role

### Frontend
- Support/admin checkbox: “Internal (staff only)”
- Internal notes styled with badge; buyers never receive them from API

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.19` |
| Store API | `store-backend/` | `1.3.19` (`store-api`) |

---

## v1.3.18 — 2026-07-25

S3-compatible cloud storage for seller product images.

### Frontend
- Upload path uses AWS SDK when `S3_BUCKET` + credentials are set (S3, R2, MinIO, …)
- Falls back to local `public/uploads/products/` when unset
- `S3_PUBLIC_BASE_URL` for public object URLs + `next/image` remotePatterns
- Documented in `env.example`

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.18` |
| Store API | `store-backend/` | `1.3.18` (`store-api`) |

---

## v1.3.17 — 2026-07-25

Order notes / support ticket thread on order detail.

### Backend
- Flyway `V8__order_notes.sql` → `store_order_notes`
- `GET/POST /v1/orders/{id}/notes` — buyer (owner) or SUPPORT/ADMIN

### Frontend
- Support thread on `/account/orders/[id]` (buyer + support/admin via assist links)
- List messages + composer (≤2000 chars)

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.17` |
| Store API | `store-backend/` | `1.3.17` (`store-api`) |

---

## v1.3.16 — 2026-07-25

Seller product image upload for listings.

### Backend
- `PATCH` product update accepts `images` (seller + admin)

### Frontend
- Upload JPEG/PNG/WebP/GIF (≤5MB) to `/uploads/products/*`
- Create listing form: file upload + URL fallback + preview
- Seller products list: change image in place

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.16` |
| Store API | `store-backend/` | `1.3.16` (`store-api`) |

---

## v1.3.15 — 2026-07-25

Harden public catalog search against scraping / abuse.

### Backend
- Rate limiter: per-IP buckets; stricter **search** bucket for `/v1/products` list, batch, and `/v1/categories`
- Fixed `@Value` injection (was broken on static fields); scheduled counter cleanup; JSON 429 body
- Cap search `q` (120 chars), `page` (≤100), `size` (≤48), batch ids (≤50)

### Frontend
- Mirror search caps in catalog client; clearer 429 errors

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.15` |
| Store API | `store-backend/` | `1.3.15` (`store-api`) |

---

## v1.3.14 — 2026-07-25

Email receipts on paid and fully shipped orders (Resend).

### Backend
- `GET /v1/orders/{id}` accepts `X-Admin-Key` for system order lookup (email / webhooks)

### Frontend
- Purchase receipt after PayPal/Stripe pay (client + webhook) when newly paid
- Shipped email when order status becomes `SHIPPED` after seller fulfill
- Skips quietly when `RESEND_API_KEY` or buyer email is missing

### Packages
| Package | Path | Version |
|---------|------|---------|
| Storefront | `next-ecommerce/` | `1.3.14` |
| Store API | `store-backend/` | `1.3.14` (`store-api`) |

---

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
