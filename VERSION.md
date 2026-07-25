# Version History

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
