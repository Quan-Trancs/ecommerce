# Ecommerce Commercial Platform

**Version:** [v1.3.38](./VERSION.md) — partial line-item refunds. See [ROLES.md](./ROLES.md).

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
