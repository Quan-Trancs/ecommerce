# Ecommerce + Bookstore Platform

Monorepo combining a Next.js storefront with a Spring Boot bookstore API.

| Package | Path | Stack | Role |
|---------|------|--------|------|
| **Storefront** | [`next-ecommerce/`](./next-ecommerce) | Next.js, TypeScript | Amazon-inspired shop UI ([live demo](https://next-ecommerce-nine-indol.vercel.app)) |
| **Bookstore API** | [`bookstore-backend/`](./bookstore-backend) | Java, Spring Boot, PostgreSQL | Books, authors, inventory, auth, async jobs |

Previously these lived in separate repos (`ecommerce` + `BookStoreBackEnd`). They are kept together here so the full commerce story is one project.

## Quick start

### Frontend
```bash
cd next-ecommerce
cp env.example .env   # if needed
npm install
npm run dev
```

### Backend
```bash
cd bookstore-backend
# Configure DB + .env (see bookstore-backend/README.md)
./gradlew bootRun
```

API defaults to `http://localhost:8082/api`.

## Related repos

- Historical backend-only mirror: [BookStoreBackEnd](https://github.com/Quan-Trancs/BookStoreBackEnd) (kept for history; prefer this monorepo)
