package quantran.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import quantran.api.entity.BookEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<BookEntity, String> {
    
    /**
     * Find books with search criteria and pagination
     */
    @EntityGraph(attributePaths = {"authors", "genres", "publisher"})
    @Query("SELECT DISTINCT b FROM BookEntity b " +
           "LEFT JOIN b.authors a " +
           "LEFT JOIN b.genres g " +
           "WHERE " +
           "(:searchTitle IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :searchTitle, '%'))) AND " +
           "(:searchAuthor IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :searchAuthor, '%'))) AND " +
           "(:searchId IS NULL OR LOWER(b.id) LIKE LOWER(CONCAT('%', :searchId, '%'))) AND " +
           "(:searchGenre IS NULL OR LOWER(g.name) LIKE LOWER(CONCAT('%', :searchGenre, '%'))) AND " +
           "(:searchPublisher IS NULL OR LOWER(b.publisher.name) LIKE LOWER(CONCAT('%', :searchPublisher, '%')))")
    Page<BookEntity> findBooksWithSearch(
            @Param("searchTitle") String searchTitle,
            @Param("searchAuthor") String searchAuthor,
            @Param("searchId") String searchId,
            @Param("searchGenre") String searchGenre,
            @Param("searchPublisher") String searchPublisher,
            Pageable pageable);
    
    /**
     * Count books with search criteria
     */
    @Query("SELECT COUNT(DISTINCT b) FROM BookEntity b " +
           "LEFT JOIN b.authors a " +
           "LEFT JOIN b.genres g " +
           "WHERE " +
           "(:searchTitle IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :searchTitle, '%'))) AND " +
           "(:searchAuthor IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :searchAuthor, '%'))) AND " +
           "(:searchId IS NULL OR LOWER(b.id) LIKE LOWER(CONCAT('%', :searchId, '%'))) AND " +
           "(:searchGenre IS NULL OR LOWER(g.name) LIKE LOWER(CONCAT('%', :searchGenre, '%'))) AND " +
           "(:searchPublisher IS NULL OR LOWER(b.publisher.name) LIKE LOWER(CONCAT('%', :searchPublisher, '%')))")
    long countBooksWithSearch(
            @Param("searchTitle") String searchTitle,
            @Param("searchAuthor") String searchAuthor,
            @Param("searchId") String searchId,
            @Param("searchGenre") String searchGenre,
            @Param("searchPublisher") String searchPublisher);
    
    /**
     * Find books by genre
     */
    @EntityGraph(attributePaths = {"authors", "genres", "publisher"})
    @Query("SELECT b FROM BookEntity b JOIN b.genres g WHERE g.id = :genreId")
    List<BookEntity> findByGenreId(@Param("genreId") String genreId);
    
    /**
     * Find books by price range
     */
    List<BookEntity> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);
    
    /**
     * Find books by author
     */
    @EntityGraph(attributePaths = {"authors", "genres", "publisher"})
    @Query("SELECT b FROM BookEntity b JOIN b.authors a WHERE LOWER(a.name) LIKE LOWER(CONCAT('%', :authorName, '%'))")
    List<BookEntity> findByAuthorName(@Param("authorName") String authorName);
    
    /**
     * Find books by author ID
     */
    @EntityGraph(attributePaths = {"authors", "genres", "publisher"})
    @Query("SELECT b FROM BookEntity b JOIN b.authors a WHERE a.id = :authorId")
    List<BookEntity> findByAuthorId(@Param("authorId") Long authorId);
    
    /**
     * Check if book exists by title and ISBN
     */
    boolean existsByTitleAndIsbn(String title, String isbn);
    
    /**
     * Check if book exists by title and author
     */
    @Query("SELECT COUNT(b) > 0 FROM BookEntity b JOIN b.authors a WHERE b.title = :title AND a.name = :authorName")
    boolean existsByTitleAndAuthor(@Param("title") String title, @Param("authorName") String authorName);
    
    /**
     * Find book by title and ISBN
     */
    Optional<BookEntity> findByTitleAndIsbn(String title, String isbn);
    
    /**
     * Find books by ISBN
     */
    Optional<BookEntity> findByIsbn(String isbn);
    
    /**
     * Find books by ISBN13
     */
    Optional<BookEntity> findByIsbn13(String isbn13);
    
    /**
     * Find books by publisher
     */
    @EntityGraph(attributePaths = {"authors", "genres", "publisher"})
    @Query("SELECT b FROM BookEntity b WHERE b.publisher.id = :publisherId")
    List<BookEntity> findByPublisherId(@Param("publisherId") Long publisherId);
    
    /**
     * Find books by publication year
     */
    @Query("SELECT b FROM BookEntity b WHERE YEAR(b.publicationDate) = :year")
    List<BookEntity> findByPublicationYear(@Param("year") int year);
    
    /**
     * Find books by language
     */
    List<BookEntity> findByLanguage(String language);
    
    /**
     * Find books by format
     */
    List<BookEntity> findByFormat(String format);
    
    /**
     * Find books with low stock
     */
    @Query("SELECT b FROM BookEntity b WHERE b.stockQuantity <= b.reorderPoint")
    List<BookEntity> findBooksWithLowStock();
    
    /**
     * Find out of stock books
     */
    @Query("SELECT b FROM BookEntity b WHERE b.stockQuantity = 0")
    List<BookEntity> findOutOfStockBooks();
    
    /**
     * Find books with discount
     */
    @Query("SELECT b FROM BookEntity b WHERE b.discountPercentage > 0")
    List<BookEntity> findBooksWithDiscount();
    
    /**
     * Find books created after a specific date
     */
    List<BookEntity> findByCreatedAtAfter(java.time.LocalDateTime date);
    
    /**
     * Get total count of books
     */
    @Query("SELECT COUNT(b) FROM BookEntity b")
    long getTotalBookCount();
    
    /**
     * Get average book price
     */
    @Query("SELECT AVG(b.price) FROM BookEntity b")
    BigDecimal getAverageBookPrice();
}
