# Role-based marketplace structure

Roles used across **storefront** (`next-ecommerce`) and **store API** (`store-backend`):

| Role | Who | Default home | Capabilities |
|------|-----|--------------|--------------|
| **BUYER** | Shoppers | `/account` | Browse, cart, checkout, own orders |
| **SELLER** | Merchants | `/seller` | Buyer capabilities + seller workspace + seller APIs |
| **ADMIN** | Platform ops | `/admin` | All of the above + user/role admin + catalog override |

Legacy strings `User` / `Admin` are normalized to `BUYER` / `ADMIN` on login.

---

## System overview

```mermaid
flowchart TB
  subgraph Clients
    Browser[Browser]
  end

  subgraph FE["next-ecommerce (BFF)"]
    NextAuth[NextAuth session]
    Routes["Routes by role"]
    Actions[Server actions]
    Mint["mintStoreAccessToken"]
  end

  subgraph BE["store-backend"]
    AuthAPI["POST /v1/auth/token"]
    Orders["/v1/orders*"]
    Seller["/v1/seller*"]
    Accounts["/v1/accounts*"]
    Catalog["/v1/products* public"]
  end

  subgraph Data
    Mongo[(Mongo users)]
    PG[(Postgres catalog / orders / accounts)]
  end

  Browser --> NextAuth
  NextAuth --> Mongo
  NextAuth --> Routes
  Routes --> Actions
  Actions --> Mint
  Mint -->|"X-Admin-Key"| AuthAPI
  AuthAPI --> PG
  Actions -->|"Bearer JWT"| Orders
  Actions -->|"Bearer JWT"| Seller
  Actions -->|"Bearer JWT"| Accounts
  Actions --> Catalog
  Orders --> PG
  Seller --> PG
  Catalog --> PG
```

---

## Role access model

```mermaid
flowchart LR
  BUYER --> Browse
  BUYER --> Cart
  BUYER --> Checkout
  BUYER --> OwnOrders["Own orders"]

  SELLER --> BUYER
  SELLER --> SellerDash["/seller"]
  SELLER --> SellerAPI["/v1/seller/*"]
  SELLER --> OwnListings["Own products"]

  ADMIN --> SELLER
  ADMIN --> AdminUI["/admin"]
  ADMIN --> AccountsAPI["/v1/accounts"]
  ADMIN --> AdminProducts["/v1/admin/products"]
  ADMIN --> AnyOrder["Any order"]
```

```mermaid
flowchart TD
  Req{Authenticated?}
  Req -->|no| Public["/, /search, /product, /sign-in"]
  Req -->|yes| Role{Role?}

  Role -->|BUYER| BuyerHome["/account · /checkout"]
  Role -->|SELLER| SellerHome["/seller + buyer routes"]
  Role -->|ADMIN| AdminHome["/admin + seller + buyer"]

  BuyerHome -.->|blocked| SellerBlock["/seller → redirect /account"]
  BuyerHome -.->|blocked| AdminBlock["/admin → redirect /account"]
  SellerHome -.->|blocked| AdminBlock
```

---

## Auth bridge (token mint)

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Next.js server action
  participant NA as NextAuth / Mongo
  participant API as store-backend
  participant DB as Postgres accounts

  U->>FE: Sign in / place order
  FE->>NA: auth() session (id, role)
  FE->>API: POST /v1/auth/token<br/>X-Admin-Key + {userId, role}
  API->>DB: upsert Account (+ SellerProfile if SELLER/ADMIN)
  API-->>FE: Bearer JWT (sub=userId, role=claim)
  FE->>API: Business call + Authorization Bearer
  API-->>FE: 200 / 401 / 403
```

---

## Order flow (buyer)

```mermaid
sequenceDiagram
  participant B as Buyer browser
  participant FE as Next server action
  participant API as /v1/orders
  participant DB as Postgres

  B->>FE: createOrder(cart)
  FE->>FE: mintStoreAccessToken(BUYER)
  FE->>API: POST /v1/orders + Bearer
  API->>API: resolve userId from JWT
  API->>DB: validate stock/price, insert order
  API-->>FE: order id
  FE-->>B: /checkout/{id}

  B->>FE: getMyOrders()
  FE->>API: GET /v1/orders/me + Bearer
  API->>DB: findByUserId
  API-->>FE: order list
```

---

## Data model (roles)

```mermaid
erDiagram
  ACCOUNT ||--o| SELLER_PROFILE : has
  ACCOUNT ||--o{ PRODUCT : owns
  ACCOUNT ||--o{ STORE_ORDER : places

  ACCOUNT {
    string id PK
    string email
    string role "BUYER|SELLER|ADMIN"
    boolean active
  }

  SELLER_PROFILE {
    string account_id PK_FK
    string shop_name
    boolean verified
  }

  PRODUCT {
    string id PK
    string seller_account_id FK "nullable = platform"
    string slug
    boolean is_published
  }

  STORE_ORDER {
    string id PK
    string user_id FK
    string status
    boolean is_paid
  }
```

---

## Package & route map

```mermaid
flowchart TB
  subgraph FE_pkg["next-ecommerce/"]
    roles["lib/auth/roles.ts"]
    require["lib/auth/require-role.ts"]
    token["lib/auth/store-token.ts"]
    account["app/(root)/account/"]
    seller["app/(seller)/seller/"]
    admin["app/(admin)/admin/"]
  end

  subgraph BE_pkg["store-backend/…/quantran/api/"]
    acct["account/*"]
    authC["AuthController"]
    ordC["OrderController"]
    sellC["SellerController"]
    acctC["AccountController"]
  end

  roles --> require
  require --> account
  require --> seller
  require --> admin
  token --> authC
  account --> ordC
  seller --> sellC
  admin --> acctC
  authC --> acct
  sellC --> acct
  acctC --> acct
```

---

## Frontend layout

```
next-ecommerce/
  lib/auth/
    roles.ts              # ROLES, normalizeRole, access helpers
    require-role.ts       # requireSession / requireSeller / requireAdmin
    store-token.ts        # BFF JWT mint (server-only)
  app/(root)/account/     # Buyer hub + orders
  app/(seller)/seller/    # Seller overview, products, orders (shell)
  app/(admin)/admin/      # Admin overview, users, catalog (shell)
  auth.config.ts          # Route guards for /account /seller /admin
```

Signup lets users choose **Buyer** or **Seller**. Admin is seeded only (`admin@example.com`).

Demo seeds (after `npm run seed`):

- `buyer@example.com` / `BuyerPass123!`
- `seller@example.com` / `SellerPass123!`
- `admin@example.com` / env `ADMIN_PASSWORD`

## Backend layout

```
store-backend/src/main/java/quantran/api/
  account/
    Role.java
    AccountEntity.java
    SellerProfileEntity.java
    AccountRepository.java
    SellerProfileRepository.java
    AccountService.java
  controller/
    AuthController.java      # mints JWT + upserts account (role claim)
    AccountController.java   # /v1/accounts/me, list, PATCH role (admin)
    SellerController.java    # /v1/seller/me|products|orders (GET/POST/PATCH products)
    OrderController.java     # Bearer + owner checks; GET /me
    ProductAdminController   # platform catalog writes (X-Admin-Key)
  entity/ProductEntity.java  # seller_account_id ownership
```

Flyway: `V4__accounts_roles_seller.sql`

### Auth bridge (summary)

1. NextAuth owns login (Mongo users + `role`).
2. Server actions mint API JWT via `mintStoreAccessToken` → `POST /v1/auth/token` with `X-Admin-Key` (never from the browser).
3. Order + seller/admin APIs require `Authorization: Bearer …`; order get/pay also enforce owner (or ADMIN).
4. `GET /v1/orders/me` backs the buyer order list when the store API is up.

## Next build steps

- ~~Connect storefront seller UI to `/v1/seller/products` create/update~~ (v1.2.1)
- ~~Seller order fulfillment join (order items × seller products)~~ (v1.2.2)
- Sync NextAuth role changes → `PATCH /v1/accounts/{id}/role`
- Optional SUPPORT role if you need customer-service without full admin
