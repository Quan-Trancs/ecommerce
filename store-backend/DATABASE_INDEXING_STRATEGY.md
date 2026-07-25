# Database Indexing Strategy for BookStoreBackEnd

## 1. Overview
This document outlines the indexing strategy for the BookStoreBackEnd project, balancing query performance with storage and write efficiency.

---

## 2. Principles
- **Index for frequent SELECTs**: Prioritize columns used in WHERE, JOIN, and ORDER BY for read-heavy queries.
- **Minimize for writes**: Avoid over-indexing on write-heavy tables to keep INSERT/UPDATE/DELETE fast.
- **Composite indexes**: Use for queries filtering on multiple columns together.
- **Monitor and iterate**: Regularly review index usage and adjust as query patterns evolve.

---

## 3. Current Indexes and Changes

### BookEntity
- Indexed: `title`, `isbn`, `publicationDate`, `publisher_id` (existing)
- **Added:**
  - `price` (for price range queries)
  - `language` (for language filter)
  - `format` (for format filter)
  - `stock_quantity` (for stock queries)
  - `discountPercentage` (for discount queries)
- **Recommendation:** Ensure join tables (e.g., `book_authors`, `book_genres`) have composite indexes on both columns for efficient joins.

### Author
- Indexed: `name`, `country` (existing)
- **Added:**
  - `birth_date` (for birth year range queries)
  - `death_date` (for living/deceased queries)

### Publisher
- Indexed: `name`, `country` (existing)
- **Added:**
  - `city` (for city filter)
  - `founded_year` (for founded year queries)

### BookType
- Indexed: `name`, `parentId` (existing)

### BookInventory
- Indexed: `bookId`, `quantity` (existing)

### AsyncTaskEntity
- Indexed: `userId`, `status`, `createdAt` (existing)

---

## 4. Future Index Removals Based on Real Deployed Data

After deploying these indexes to production, monitor actual query usage and consider removing indexes that are:
- **Rarely used** in WHERE, JOIN, or ORDER BY clauses.
- **Not part of frequent or performance-critical queries**.

### Potential Candidates for Removal:
- **BookEntity**: `stock_quantity`, `discountPercentage`, `format`, `language`, `price` (if not used in frequent queries).
- **Author**: `birth_date`, `death_date` (if not used in birth/death year or living status queries).
- **Publisher**: `city`, `founded_year` (if not used in city or founded year queries).

### Removal Process:
1. **Monitor index usage** using database tools (e.g., PostgreSQL’s `pg_stat_user_indexes`, MySQL’s `SHOW INDEX`).
2. **Check slow query logs** to ensure no queries depend on indexes being removed.
3. **Remove indexes** from both entity classes and database schema.
4. **Test performance** after removal to ensure no negative impact.
5. **Update this document** to reflect removals and rationale.

---

## 5. Ongoing Monitoring & Review
- **Profile queries** using database logs and `EXPLAIN` to identify slow queries.
- **Monitor index usage** and drop unused indexes.
- **Benchmark** SELECT and write performance after index changes.
- **Document** all index changes and rationale.
- **Review** indexes before major releases or schema changes.

---

## 6. Migration & Automation
- Use migration tools (e.g., Flyway, Liquibase) to manage index changes in a versioned, controlled way.

---

## 7. Summary Table
| Table/Entity      | Indexed Columns (new in **bold**)                |
|-------------------|--------------------------------------------------|
| BookEntity        | title, isbn, publicationDate, publisher_id, **price**, **language**, **format**, **stock_quantity**, **discountPercentage** |
| Author            | name, country, **birth_date**, **death_date**    |
| Publisher         | name, country, **city**, **founded_year**        |
| BookType          | name, parentId                                   |
| BookInventory     | bookId, quantity                                 |
| AsyncTaskEntity   | userId, status, createdAt                        |

---

## 8. Indexing Best Practices
- Add indexes for frequent, slow SELECTs.
- Remove indexes that are rarely used or redundant.
- Avoid over-indexing to keep storage and write costs low.
- Use composite indexes for multi-column filters.
- Regularly review and update this strategy as the application evolves. 