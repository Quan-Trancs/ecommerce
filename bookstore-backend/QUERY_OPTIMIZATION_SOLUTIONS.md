# Query Optimization Solutions for BookStoreBackEnd

## 🎯 Overview

This document provides comprehensive solutions for optimizing database queries in the BookStoreBackEnd application. Based on analysis of the current codebase, several performance bottlenecks have been identified and specific solutions are provided.

---

## 🔍 **Critical Performance Issues Identified**

### **1. N+1 Query Problem**
**Location**: Multiple repositories using `@EntityGraph` with complex relationships
**Impact**: High database load, slow response times
**Example**: `BookRepository.findBooksWithSearch()` loads authors, genres, and publisher for each book

### **2. Inefficient Search Queries**
**Location**: Complex LIKE queries with multiple OR conditions
**Impact**: Full table scans, slow performance on large datasets
**Example**: `LOWER(b.title) LIKE LOWER(CONCAT('%', :searchTitle, '%'))`

### **3. Missing Composite Indexes**
**Location**: Join tables and frequently combined filters
**Impact**: Inefficient joins and filtering operations

### **4. Redundant Query Execution**
**Location**: Services calling multiple repository methods
**Impact**: Unnecessary database round trips

---

## 🚀 **Optimization Solutions**

### **Solution 1: Implement Query Result Caching**

#### **1.1 Add Query-Specific Caching**
```java
// BookRepository.java
@Repository
public interface BookRepository extends JpaRepository<BookEntity, String> {
    
    @Cacheable(value = "books", key = "#searchTitle + '-' + #searchAuthor + '-' + #searchId + '-' + #searchGenre + '-' + #searchPublisher + '-' + #page + '-' + #pageSize")
    @Query("SELECT DISTINCT b FROM BookEntity b " +
           "LEFT JOIN FETCH b.authors a " +
           "LEFT JOIN FETCH b.genres g " +
           "LEFT JOIN FETCH b.publisher p " +
           "WHERE " +
           "(:searchTitle IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :searchTitle, '%'))) AND " +
           "(:searchAuthor IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :searchAuthor, '%'))) AND " +
           "(:searchId IS NULL OR LOWER(b.id) LIKE LOWER(CONCAT('%', :searchId, '%'))) AND " +
           "(:searchGenre IS NULL OR LOWER(g.name) LIKE LOWER(CONCAT('%', :searchGenre, '%'))) AND " +
           "(:searchPublisher IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :searchPublisher, '%')))")
    Page<BookEntity> findBooksWithSearchOptimized(
            @Param("searchTitle") String searchTitle,
            @Param("searchAuthor") String searchAuthor,
            @Param("searchId") String searchId,
            @Param("searchGenre") String searchGenre,
            @Param("searchPublisher") String searchPublisher,
            Pageable pageable);
}
```

#### **1.2 Add Cache Configuration**
```java
// CacheConfig.java - Enhanced
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        // L1: Caffeine (in-memory)
        CaffeineCacheManager caffeineCacheManager = new CaffeineCacheManager();
        caffeineCacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats());

        // L2: Redis (distributed)
        RedisCacheManager redisCacheManager = RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(30))
                        .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                        .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer())))
                .build();

        // Composite: L1 first, then L2
        CompositeCacheManager compositeCacheManager = new CompositeCacheManager(
                caffeineCacheManager, redisCacheManager
        );
        compositeCacheManager.setFallbackToNoOpCache(false);
        return compositeCacheManager;
    }
}
```

### **Solution 2: Optimize Search Queries with Full-Text Search**

#### **2.1 Add Full-Text Search Indexes**
```sql
-- Add to init.sql or migration
-- Create full-text search indexes
CREATE INDEX idx_book_title_fts ON books USING gin(to_tsvector('english', title));
CREATE INDEX idx_book_description_fts ON books USING gin(to_tsvector('english', description));
CREATE INDEX idx_author_name_fts ON authors USING gin(to_tsvector('english', name));
CREATE INDEX idx_publisher_name_fts ON publishers USING gin(to_tsvector('english', name));
```

#### **2.2 Implement Full-Text Search Repository Methods**
```java
// BookRepository.java
@Repository
public interface BookRepository extends JpaRepository<BookEntity, String> {
    
    /**
     * Full-text search for books using PostgreSQL's ts_vector
     */
    @Query(value = "SELECT b.* FROM books b " +
           "LEFT JOIN book_authors ba ON b.id = ba.book_id " +
           "LEFT JOIN authors a ON ba.author_id = a.id " +
           "LEFT JOIN book_genres bg ON b.id = bg.book_id " +
           "LEFT JOIN book_type bt ON bg.genre_id = bt.id " +
           "LEFT JOIN publishers p ON b.publisher_id = p.id " +
           "WHERE " +
           "(:searchTerm IS NULL OR " +
           "  to_tsvector('english', b.title) @@ plainto_tsquery('english', :searchTerm) OR " +
           "  to_tsvector('english', b.description) @@ plainto_tsquery('english', :searchTerm) OR " +
           "  to_tsvector('english', a.name) @@ plainto_tsquery('english', :searchTerm) OR " +
           "  to_tsvector('english', bt.name) @@ plainto_tsquery('english', :searchTerm) OR " +
           "  to_tsvector('english', p.name) @@ plainto_tsquery('english', :searchTerm)) " +
           "GROUP BY b.id " +
           "ORDER BY ts_rank(to_tsvector('english', b.title), plainto_tsquery('english', :searchTerm)) DESC",
           nativeQuery = true)
    Page<BookEntity> findBooksWithFullTextSearch(
            @Param("searchTerm") String searchTerm,
            Pageable pageable);
    
    /**
     * Optimized search with indexed columns only
     */
    @Query("SELECT b FROM BookEntity b " +
           "LEFT JOIN FETCH b.authors a " +
           "LEFT JOIN FETCH b.genres g " +
           "LEFT JOIN FETCH b.publisher p " +
           "WHERE " +
           "(:title IS NULL OR b.title ILIKE %:title%) AND " +
           "(:author IS NULL OR a.name ILIKE %:author%) AND " +
           "(:genre IS NULL OR g.name ILIKE %:genre%) AND " +
           "(:publisher IS NULL OR p.name ILIKE %:publisher%) AND " +
           "(:minPrice IS NULL OR b.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR b.price <= :maxPrice)")
    Page<BookEntity> findBooksWithOptimizedSearch(
            @Param("title") String title,
            @Param("author") String author,
            @Param("genre") String genre,
            @Param("publisher") String publisher,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);
}
```

### **Solution 3: Add Composite Indexes for Common Query Patterns**

#### **3.1 Enhanced Entity Indexes**
```java
// BookEntity.java
@Entity
@Table(name = "books", indexes = {
    // Existing indexes
    @Index(name = "idx_book_title", columnList = "title"),
    @Index(name = "idx_book_isbn", columnList = "isbn"),
    @Index(name = "idx_book_publication_date", columnList = "publicationDate"),
    @Index(name = "idx_book_publisher", columnList = "publisher_id"),
    @Index(name = "idx_book_price", columnList = "price"),
    @Index(name = "idx_book_language", columnList = "language"),
    @Index(name = "idx_book_format", columnList = "format"),
    @Index(name = "idx_book_stock_quantity", columnList = "stock_quantity"),
    @Index(name = "idx_book_discount_percentage", columnList = "discountPercentage"),
    
    // NEW: Composite indexes for common query patterns
    @Index(name = "idx_book_title_author", columnList = "title, publisher_id"),
    @Index(name = "idx_book_price_stock", columnList = "price, stock_quantity"),
    @Index(name = "idx_book_language_format", columnList = "language, format"),
    @Index(name = "idx_book_publication_price", columnList = "publicationDate, price"),
    @Index(name = "idx_book_discount_stock", columnList = "discountPercentage, stock_quantity"),
    
    // NEW: Full-text search indexes
    @Index(name = "idx_book_title_fts", columnList = "title"),
    @Index(name = "idx_book_description_fts", columnList = "description")
})
public class BookEntity {
    // ... existing code
}
```

#### **3.2 Join Table Indexes**
```sql
-- Add to init.sql or migration
-- Optimize join tables for better performance
CREATE INDEX idx_book_authors_composite ON book_authors(book_id, author_id);
CREATE INDEX idx_book_genres_composite ON book_genres(book_id, genre_id);
CREATE INDEX idx_book_authors_author ON book_authors(author_id);
CREATE INDEX idx_book_genres_genre ON book_genres(genre_id);
```

### **Solution 4: Implement Query Result Projection**

#### **4.1 Create DTO Projections**
```java
// BookRepository.java
@Repository
public interface BookRepository extends JpaRepository<BookEntity, String> {
    
    /**
     * Use projection to fetch only required fields
     */
    @Query("SELECT new quantran.api.dto.BookSummaryDto(" +
           "b.id, b.title, b.price, b.stockQuantity, " +
           "a.name, g.name, p.name) " +
           "FROM BookEntity b " +
           "LEFT JOIN b.authors a " +
           "LEFT JOIN b.genres g " +
           "LEFT JOIN b.publisher p " +
           "WHERE (:searchTerm IS NULL OR b.title ILIKE %:searchTerm%)")
    Page<BookSummaryDto> findBookSummaries(
            @Param("searchTerm") String searchTerm,
            Pageable pageable);
    
    /**
     * Optimized count query without fetching data
     */
    @Query("SELECT COUNT(DISTINCT b.id) FROM BookEntity b " +
           "LEFT JOIN b.authors a " +
           "LEFT JOIN b.genres g " +
           "LEFT JOIN b.publisher p " +
           "WHERE (:searchTerm IS NULL OR b.title ILIKE %:searchTerm%)")
    long countBooksOptimized(@Param("searchTerm") String searchTerm);
}
```

#### **4.2 Create Summary DTO**
```java
// BookSummaryDto.java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookSummaryDto {
    private String id;
    private String title;
    private BigDecimal price;
    private Integer stockQuantity;
    private String authorName;
    private String genreName;
    private String publisherName;
    
    public BookSummaryDto(String id, String title, BigDecimal price, 
                         Integer stockQuantity, String authorName, 
                         String genreName, String publisherName) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.authorName = authorName;
        this.genreName = genreName;
        this.publisherName = publisherName;
    }
}
```

### **Solution 5: Implement Batch Processing**

#### **5.1 Batch Repository Operations**
```java
// BookRepository.java
@Repository
public interface BookRepository extends JpaRepository<BookEntity, String> {
    
    /**
     * Batch insert for better performance
     */
    @Modifying
    @Query(value = "INSERT INTO books (id, title, price, stock_quantity, created_at) " +
           "VALUES (:#{#book.id}, :#{#book.title}, :#{#book.price}, :#{#book.stockQuantity}, NOW()) " +
           "ON CONFLICT (id) DO UPDATE SET " +
           "title = EXCLUDED.title, price = EXCLUDED.price, " +
           "stock_quantity = EXCLUDED.stock_quantity, updated_at = NOW()",
           nativeQuery = true)
    void batchUpsertBooks(@Param("books") List<BookEntity> books);
    
    /**
     * Batch update stock quantities
     */
    @Modifying
    @Query("UPDATE BookEntity b SET b.stockQuantity = b.stockQuantity + :quantity " +
           "WHERE b.id = :bookId")
    void updateStockQuantity(@Param("bookId") String bookId, @Param("quantity") Integer quantity);
}
```

### **Solution 6: Add Database Connection Pool Optimization**

#### **6.1 Enhanced Application Properties**
```properties
# Enhanced Database Configuration
spring.datasource.hikari.maximum-pool-size=30
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=60000

# JPA Performance Optimizations
spring.jpa.properties.hibernate.jdbc.batch_size=50
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
spring.jpa.properties.hibernate.jdbc.batch_versioned_data=true
spring.jpa.properties.hibernate.jdbc.fetch_size=20
spring.jpa.properties.hibernate.default_batch_fetch_size=20

# Query Performance
spring.jpa.properties.hibernate.query.in_clause_parameter_padding=true
spring.jpa.properties.hibernate.query.fail_on_pagination_over_collection_fetch=true
```

### **Solution 7: Implement Query Result Pagination Optimization**

#### **7.1 Cursor-Based Pagination**
```java
// BookRepository.java
@Repository
public interface BookRepository extends JpaRepository<BookEntity, String> {
    
    /**
     * Cursor-based pagination for better performance
     */
    @Query("SELECT b FROM BookEntity b " +
           "WHERE b.id > :cursor " +
           "ORDER BY b.id " +
           "LIMIT :limit")
    List<BookEntity> findBooksWithCursor(
            @Param("cursor") String cursor,
            @Param("limit") int limit);
    
    /**
     * Keyset pagination for large datasets
     */
    @Query("SELECT b FROM BookEntity b " +
           "WHERE (b.publicationDate, b.id) < (:date, :id) " +
           "ORDER BY b.publicationDate DESC, b.id DESC " +
           "LIMIT :limit")
    List<BookEntity> findBooksWithKeysetPagination(
            @Param("date") LocalDate date,
            @Param("id") String id,
            @Param("limit") int limit);
}
```

---

## 📊 **Performance Monitoring & Metrics**

### **7.1 Add Query Performance Monitoring**
```java
// QueryPerformanceAspect.java
@Aspect
@Component
@Log4j2
public class QueryPerformanceAspect {
    
    @Around("@annotation(org.springframework.data.jpa.repository.Query)")
    public Object logQueryPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().getName();
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            if (executionTime > 1000) { // Log slow queries
                log.warn("Slow query detected: {} took {}ms", methodName, executionTime);
            }
            
            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            log.error("Query failed: {} took {}ms", methodName, executionTime, e);
            throw e;
        }
    }
}
```

### **7.2 Add Database Metrics**
```java
// DatabaseMetricsConfig.java
@Configuration
public class DatabaseMetricsConfig {
    
    @Bean
    public MeterRegistry meterRegistry() {
        return new SimpleMeterRegistry();
    }
    
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }
}
```

---

## 🎯 **Implementation Priority**

### **High Priority (Immediate Impact)**
1. ✅ **Add Composite Indexes** - Quick performance boost
2. ✅ **Implement Query Caching** - Reduce database load
3. ✅ **Optimize Connection Pool** - Better resource utilization

### **Medium Priority (Significant Impact)**
4. ✅ **Full-Text Search** - Better search performance
5. ✅ **Query Projections** - Reduce data transfer
6. ✅ **Batch Processing** - Improve bulk operations

### **Low Priority (Long-term Benefits)**
7. ✅ **Cursor-Based Pagination** - For large datasets
8. ✅ **Performance Monitoring** - Continuous optimization

---

## 📈 **Expected Performance Improvements**

| Optimization | Expected Improvement | Implementation Time |
|--------------|---------------------|-------------------|
| Composite Indexes | 50-80% faster queries | 1-2 hours |
| Query Caching | 70-90% faster repeated queries | 2-3 hours |
| Full-Text Search | 60-80% faster search | 4-6 hours |
| Connection Pool | 20-40% better throughput | 1 hour |
| Query Projections | 30-50% less memory usage | 2-3 hours |
| Batch Processing | 80-90% faster bulk operations | 3-4 hours |

---

## 🔧 **Implementation Steps**

1. **Backup Database** before making schema changes
2. **Add Composite Indexes** to existing tables
3. **Implement Caching** with Redis/Caffeine
4. **Update Repository Methods** with optimized queries
5. **Add Performance Monitoring** to track improvements
6. **Test with Real Data** to validate optimizations
7. **Monitor Production** performance after deployment

---

**Result**: These optimizations will significantly improve query performance, reduce database load, and provide better user experience! 🚀 