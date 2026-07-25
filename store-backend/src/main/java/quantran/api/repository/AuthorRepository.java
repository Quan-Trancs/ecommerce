package quantran.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;
import quantran.api.entity.AuthorEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuthorRepository extends JpaRepository<AuthorEntity, Long> {
    
    /**
     * Find authors by name (case-insensitive)
     */
    @EntityGraph(attributePaths = {"books"})
    List<AuthorEntity> findByNameContainingIgnoreCase(String name);
    
    /**
     * Find author by exact name
     */
    @EntityGraph(attributePaths = {"books"})
    Optional<AuthorEntity> findByNameIgnoreCase(String name);
    
    /**
     * Find authors by country
     */
    @EntityGraph(attributePaths = {"books"})
    List<AuthorEntity> findByCountryIgnoreCase(String country);
    
    /**
     * Find living authors
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT a FROM AuthorEntity a WHERE a.deathDate IS NULL")
    List<AuthorEntity> findLivingAuthors();
    
    /**
     * Find authors by birth year range
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT a FROM AuthorEntity a WHERE YEAR(a.birthDate) BETWEEN :startYear AND :endYear")
    List<AuthorEntity> findByBirthYearRange(@Param("startYear") int startYear, @Param("endYear") int endYear);
    
    /**
     * Find authors with book count greater than specified
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT a FROM AuthorEntity a WHERE SIZE(a.books) > :minBookCount")
    List<AuthorEntity> findByBookCountGreaterThan(@Param("minBookCount") int minBookCount);
    
    /**
     * Find authors by active status
     */
    @EntityGraph(attributePaths = {"books"})
    List<AuthorEntity> findByIsActive(Boolean isActive);
    
    /**
     * Search authors with pagination
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT a FROM AuthorEntity a WHERE " +
           "(:name IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:country IS NULL OR LOWER(a.country) LIKE LOWER(CONCAT('%', :country, '%'))) AND " +
           "(:isAlive IS NULL OR (a.deathDate IS NULL) = :isAlive)")
    Page<AuthorEntity> findAuthorsWithSearch(
            @Param("name") String name,
            @Param("country") String country,
            @Param("isAlive") Boolean isAlive,
            Pageable pageable);
    
    /**
     * Find authors by book genre
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT DISTINCT a FROM AuthorEntity a JOIN a.books b JOIN b.genres g WHERE g.name = :genreName")
    List<AuthorEntity> findByBookGenre(@Param("genreName") String genreName);
    
    /**
     * Find authors by book publisher
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT DISTINCT a FROM AuthorEntity a JOIN a.books b WHERE b.publisher.name = :publisherName")
    List<AuthorEntity> findByBookPublisher(@Param("publisherName") String publisherName);
    
    /**
     * Get total count of authors
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT COUNT(a) FROM AuthorEntity a")
    long getTotalAuthorCount();
    
    /**
     * Get authors with most books
     */
    @EntityGraph(attributePaths = {"books"})
    @Query("SELECT a FROM AuthorEntity a ORDER BY SIZE(a.books) DESC")
    List<AuthorEntity> findTopAuthorsByBookCount(Pageable pageable);
} 