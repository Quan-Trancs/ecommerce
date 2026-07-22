package quantran.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import quantran.api.entity.PublisherEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface PublisherRepository extends JpaRepository<PublisherEntity, Long> {
    
    /**
     * Find publishers by name (case-insensitive)
     */
    List<PublisherEntity> findByNameContainingIgnoreCase(String name);
    
    /**
     * Find publisher by exact name
     */
    Optional<PublisherEntity> findByNameIgnoreCase(String name);
    
    /**
     * Find publishers by country
     */
    List<PublisherEntity> findByCountryIgnoreCase(String country);
    
    /**
     * Find publishers by city
     */
    List<PublisherEntity> findByCityIgnoreCase(String city);
    
    /**
     * Find publishers by active status
     */
    List<PublisherEntity> findByIsActive(Boolean isActive);
    
    /**
     * Find publishers founded in a specific year
     */
    List<PublisherEntity> findByFoundedYear(Integer foundedYear);
    
    /**
     * Find publishers founded before a specific year
     */
    List<PublisherEntity> findByFoundedYearBefore(Integer year);
    
    /**
     * Find publishers founded after a specific year
     */
    List<PublisherEntity> findByFoundedYearAfter(Integer year);
    
    /**
     * Search publishers with pagination
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT p FROM PublisherEntity p WHERE " +
           "(:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:country IS NULL OR LOWER(p.country) LIKE LOWER(CONCAT('%', :country, '%'))) AND " +
           "(:city IS NULL OR LOWER(p.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:isActive IS NULL OR p.isActive = :isActive)")
    Page<PublisherEntity> findPublishersWithSearch(
            @Param("name") String name,
            @Param("country") String country,
            @Param("city") String city,
            @Param("isActive") Boolean isActive,
            Pageable pageable);
    
    /**
     * Find publishers with book count greater than specified
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT p FROM PublisherEntity p WHERE SIZE(p.books) > :minBookCount")
    List<PublisherEntity> findByBookCountGreaterThan(@Param("minBookCount") int minBookCount);
    
    /**
     * Find publishers by book genre
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT DISTINCT p FROM PublisherEntity p JOIN p.books b JOIN b.genres g WHERE g.name = :genreName")
    List<PublisherEntity> findByBookGenre(@Param("genreName") String genreName);
    
    /**
     * Get total count of publishers
     */
    @Query("SELECT COUNT(p) FROM PublisherEntity p")
    long getTotalPublisherCount();
    
    /**
     * Get publishers with most books
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT p FROM PublisherEntity p ORDER BY SIZE(p.books) DESC")
    List<PublisherEntity> findTopPublishersByBookCount(Pageable pageable);
    
    /**
     * Find publishers by book author
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT DISTINCT p FROM PublisherEntity p JOIN p.books b JOIN b.authors a WHERE a.name = :authorName")
    List<PublisherEntity> findByBookAuthor(@Param("authorName") String authorName);
} 