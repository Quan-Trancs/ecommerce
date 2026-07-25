# Ecommerce Commercial Platform

**Version:** [v1.3.59](./VERSION.md) — product Q&A. See [ROLES.md](./ROLES.md).

Monorepo combining a Next.js storefront with a Spring Boot **commercial catalog** API.

| Package | Path | Stack | Role |
|---------|------|--------|------|
| **Storefront** | [`next-ecommerce/`](./next-ecommerce) | Next.js | Shop UI + buyer/seller/admin workspaces |
| **Store API** | [`store-backend/`](./store-backend) | Spring Boot, PostgreSQL | Catalog, orders, accounts & seller APIs |

**Database:** one Postgres instance (`store`) for users/auth, catalog, and orders. Redis is optional cache only.

## Catalog strategy (big-store style)

1. **Category tree** — hierarchical browse taxonomy (`GET /api/v1/categories`)
2. **Products** — generic SKUs with brand, categories, tags, images, inventory
3. **Attribute definitions** — filterable criteria (`color`, `size`, `material`, …)
4. **Faceted search** — `GET /api/v1/products?...` returns products **and** facet buckets with counts

Example:
```
GET /api/v1/products?q=shoe&category=shoes&brand=nike&color=Black&size=10&price=25-100
```

## Quick start

### Backend
```bash
cd store-backend
docker compose up -d postgres redis
./gradlew bootRun
```

### Frontend
```bash
cd next-ecommerce
cp env.example .env
# Set DATABASE_URL to the same Postgres as store-backend
npm install
npm run seed   # demo buyer/seller/admin into accounts
npm run dev
```

Open `http://localhost:3000`. If the API is down, the storefront uses a built-in fallback catalog.

### Smoke tests (Playwright)
```bash
cd next-ecommerce
npx playwright install chromium   # first time
npm run test:e2e                  # public + auth (needs seed users / DB)
E2E_SKIP_AUTH=1 npm run test:e2e  # public routes only
```
Auth cases use seeded `buyer@` / `support@` passwords; admin needs `ADMIN_PASSWORD` or `E2E_ADMIN_PASSWORD`. Set `PLAYWRIGHT_SKIP_WEBSERVER=1` if `next` is already running.
