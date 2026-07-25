# Ecommerce Commercial Platform

**Version:** [v1.0.0](./VERSION.md) — see release notes and migration details there.

Monorepo combining a Next.js storefront with a Spring Boot **commercial catalog** API.

| Package | Path | Stack | Role |
|---------|------|--------|------|
| **Storefront** | [`next-ecommerce/`](./next-ecommerce) | Next.js | Shop UI with category tree + faceted filters |
| **Store API** | [`store-backend/`](./store-backend) | Spring Boot, PostgreSQL | Products, categories, brands, attributes, faceted search |

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
npm install
npm run dev
```

Open `http://localhost:3000`. If the API is down, the storefront uses a built-in fallback catalog.
