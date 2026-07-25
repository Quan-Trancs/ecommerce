package quantran.api.repository;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import quantran.api.entity.BookEntity;
import quantran.api.dto.BookSummaryDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Optimized BookRepository with performance improvements:
 * - Query result caching
 * - Full-text search capabilities
 * - Batch operations
 * - Projection queries
 * - Cursor-based pagination
 */
@Repository
public interface BookRepositoryOptimized extends JpaRepository<BookEntity, String> {
    
    // ============================================================================
    // OPTIMIZED SEARCH QUERIES WITH CACHING
    // ============================================================================
    
    /**
     * Optimized search with caching and JOIN FETCH to avoid N+1 queries
     */
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
    
    /**
     * Full-text search using PostgreSQL's ts_vector for better performance
     */
    @Cacheable(value = "books_fts", key = "#searchTerm + '-' + #page + '-' + #pageSize")
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
     * Optimized search using indexed columns only for better performance
     */
    @Cacheable(value = "books_indexed", key = "#title + '-' + #author + '-' + #genre + '-' + #publisher + '-' + #minPrice + '-' + #maxPrice + '-' + #page + '-' + #pageSize")
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
    
    // ============================================================================
    // QUERY PROJECTIONS FOR BETTER PERFORMANCE
    // ============================================================================
    
    /**
     * Use projection to fetch only required fields - reduces data transfer
     */
    @Cacheable(value = "book_summaries", key = "#searchTerm + '-' + #page + '-' + #pageSize")
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
    @Cacheable(value = "book_counts", key = "#searchTerm")
    @Query("SELECT COUNT(DISTINCT b.id) FROM BookEntity b " +
           "LEFT JOIN b.authors a " +
           "LEFT JOIN b.genres g " +
           "LEFT JOIN b.publisher p " +
           "WHERE (:searchTerm IS NULL OR b.title ILIKE %:searchTerm%)")
    long countBooksOptimized(@Param("searchTerm") String searchTerm);
    
    // ============================================================================
    // BATCH OPERATIONS FOR BETTER PERFORMANCE
    // ============================================================================
    
    /**
     * Batch insert/update for better performance
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
    
    /**
     * Batch update prices
     */
    @Modifying
    @Query("UPDATE BookEntity b SET b.price = b.price * (1 + :percentageChange / 100.0) " +
           "WHERE b.id IN :bookIds")
    void batchUpdatePrices(@Param("bookIds") List<String> bookIds, @Param("percentageChange") BigDecimal percentageChange);
    
    // ============================================================================
    // CURSOR-BASED PAGINATION FOR LARGE DATASETS
    // ============================================================================
    
    /**
     * Cursor-based pagination for better performance on large datasets
     */
    @Query("SELECT b FROM BookEntity b " +
           "WHERE b.id > :cursor " +
           "ORDER BY b.id " +
           "LIMIT :limit")
    List<BookEntity> findBooksWithCursor(
            @Param("cursor") String cursor,
            @Param("limit") int limit);
    
    /**
     * Keyset pagination for large datasets with date ordering
     */
    @Query("SELECT b FROM BookEntity b " +
           "WHERE (b.publicationDate, b.id) < (:date, :id) " +
           "ORDER BY b.publicationDate DESC, b.id DESC " +
           "LIMIT :limit")
    List<BookEntity> findBooksWithKeysetPagination(
            @Param("date") LocalDate date,
            @Param("id") String id,
            @Param("limit") int limit);
    
    // ============================================================================
    // OPTIMIZED SPECIALIZED QUERIES
    // ============================================================================
    
    /**
     * Find books by genre with optimized join
     */
    @EntityGraph(attributePaths = {"authors", "genres", "publisher"})
    @Query("SELECT b FROM BookEntity b JOIN b.genres g WHERE g.id = :genreId")
    List<BookEntity> findByGenreId(@Param("genreId") String genreId);
    
    /**
     * Find books by price range using indexed column
     */
    @Cacheable(value = "books_price_range", key = "#minPrice + '-' + #maxPrice")
    List<BookEntity> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);
    
    /**
     * Find books by author with optimized join
     */
    @EntityGraph(attributePaths = {"authors", "genres", "publisher"})
    @Query("SELECT b FROM BookEntity b JOIN b.authors a WHERE LOWER(a.name) LIKE LOWER(CONCAT('%', :authorName, '%'))")
    List<BookEntity> findByAuthorName(@Param("authorName") String authorName);
    
    /**
     * Find books by author ID with optimized join
     */
    @EntityGraph(attributePaths = {"authors", "genres", "publisher"})
    @Query("SELECT b FROM BookEntity b JOIN b.authors a WHERE a.id = :authorId")
    List<BookEntity> findByAuthorId(@Param("authorId") Long authorId);
    
    /**
     * Check if book exists by title and ISBN using indexed columns
     */
    boolean existsByTitleAndIsbn(String title, String isbn);
    
    /**
     * Check if book exists by title and author with optimized query
     */
    @Query("SELECT COUNT(b) > 0 FROM BookEntity b JOIN b.authors a WHERE b.title = :title AND a.name = :authorName")
    boolean existsByTitleAndAuthor(@Param("title") String title, @Param("authorName") String authorName);
    
    /**
     * Find book by title and ISBN using indexed columns
     */
    Optional<BookEntity> findByTitleAndIsbn(String title, String isbn);
    
    /**
     * Find books by ISBN using indexed column
     */
    Optional<BookEntity> findByIsbn(String isbn);
    
    /**
     * Find books by ISBN13 using indexed column
     */
    Optional<BookEntity> findByIsbn13(String isbn13);
    
    /**
     * Find books by publisher with optimized join
     */
    @EntityGraph(attributePaths = {"authors", "genres", "publisher"})
    @Query("SELECT b FROM BookEntity b WHERE b.publisher.id = :publisherId")
    List<BookEntity> findByPublisherId(@Param("publisherId") Long publisherId);
    
    /**
     * Find books by publication year using indexed column
     */
    @Query("SELECT b FROM BookEntity b WHERE YEAR(b.publicationDate) = :year")
    List<BookEntity> findByPublicationYear(@Param("year") int year);
    
    /**
     * Find books by language using indexed column
     */
    List<BookEntity> findByLanguage(String language);
    
    /**
     * Find books by format using indexed column
     */
    List<BookEntity> findByFormat(String format);
    
    /**
     * Find books with low stock using indexed column
     */
    @Query("SELECT b FROM BookEntity b WHERE b.stockQuantity <= b.reorderPoint")
    List<BookEntity> findBooksWithLowStock();
    
    /**
     * Find out of stock books using indexed column
     */
    @Query("SELECT b FROM BookEntity b WHERE b.stockQuantity = 0")
    List<BookEntity> findOutOfStockBooks();
    
    /**
     * Find books with discount using indexed column
     */
    @Query("SELECT b FROM BookEntity b WHERE b.discountPercentage > 0")
    List<BookEntity> findBooksWithDiscount();
    
    /**
     * Find books created after a specific date
     */
    List<BookEntity> findByCreatedAtAfter(LocalDateTime date);
    
    /**
     * Get total count of books using optimized query
     */
    @Query("SELECT COUNT(b) FROM BookEntity b")
    long getTotalBookCount();
    
    /**
     * Get average book price using optimized query
     */
    @Query("SELECT AVG(b.price) FROM BookEntity b")
    BigDecimal getAverageBookPrice();
    
    /**
     * Get books by multiple IDs efficiently
     */
    @Query("SELECT b FROM BookEntity b WHERE b.id IN :ids")
    List<BookEntity> findByIds(@Param("ids") List<String> ids);
    
    /**
     * Get books with highest discount
     */
    @Query("SELECT b FROM BookEntity b WHERE b.discountPercentage > 0 ORDER BY b.discountPercentage DESC")
    List<BookEntity> findBooksWithHighestDiscount(Pageable pageable);
    
    /**
     * Get recently published books
     */
    @Query("SELECT b FROM BookEntity b WHERE b.publicationDate >= :startDate ORDER BY b.publicationDate DESC")
    List<BookEntity> findRecentlyPublishedBooks(@Param("startDate") LocalDate startDate, Pageable pageable);
} 