# Commercial Catalog Schema

Amazon-style browse + filter model used by the store API.

```mermaid
erDiagram
  categories ||--o{ categories : parent
  brands ||--o{ products : sells
  products ||--o{ product_categories : in
  categories ||--o{ product_categories : contains
  products ||--o{ product_attribute_values : has
  attribute_definitions ||--o{ product_attribute_values : defines
  products ||--o{ product_images : has
  products ||--o{ product_tags : tagged

  categories {
    string id PK
    string name
    string slug UK
    string parent_id FK
  }
  brands {
    long id PK
    string name
    string slug UK
  }
  products {
    string id PK
    string name
    string slug UK
    decimal price
    int stock_quantity
    long brand_id FK
  }
  attribute_definitions {
    long id PK
    string code UK
    string name
    string data_type
    boolean is_filterable
  }
  product_attribute_values {
    long id PK
    string product_id FK
    long attribute_id FK
    string value_string
  }
```

## Faceted search flow

1. Client sends filters: `q`, `category`, `brand`, `price`, plus dynamic attrs (`color`, `size`, …)
2. API filters the published catalog
3. API returns matching products **and** facet buckets with counts
4. UI renders filters dynamically from the response (not hardcoded per niche)
