package quantran.api.service;

import quantran.api.entity.PublisherEntity;
import quantran.api.page.Paginate;
import quantran.api.dto.PublisherRequestDto;
import quantran.api.dto.PublisherResponseDto;
import quantran.api.dto.BookResponseDto;

import java.util.List;
import java.util.Optional;

/**
 * Standardized PublisherService interface with consistent naming conventions.
 * This interface provides standardized CRUD operations and query methods.
 */
public interface PublisherService extends BaseService<PublisherEntity, Long> {
    
    // Standardized CRUD operations
    /**
     * Create a new publisher using the standardized request DTO.
     * @param request The publisher creation request
     * @return The created publisher response
     */
    PublisherResponseDto createPublisher(PublisherRequestDto request);
    
    /**
     * Find a publisher by its ID and return the standardized response DTO.
     * @param id The publisher ID
     * @return Optional containing the publisher response if found
     */
    Optional<PublisherResponseDto> findPublisherById(Long id);
    
    /**
     * Update an existing publisher using the standardized request DTO.
     * @param id The publisher ID
     * @param request The publisher update request
     * @return The updated publisher response
     */
    PublisherResponseDto updatePublisher(Long id, PublisherRequestDto request);
    
    /**
     * Delete a publisher by its ID.
     * @param id The publisher ID
     */
    void deletePublisher(Long id);
    
    // Standardized query methods
    /**
     * Find publishers with standardized search parameters.
     * @param name Publisher name filter
     * @param country Country filter
     * @param city City filter
     * @param isActive Active status filter
     * @param page Page number (0-based)
     * @param size Page size
     * @return Paginated list of publisher responses
     */
    Paginate<PublisherResponseDto> findPublishers(String name, String country, String city, Boolean isActive, int page, int size);
    
    /**
     * Find a publisher by name.
     * @param name The publisher name
     * @return Optional containing the publisher response if found
     */
    Optional<PublisherResponseDto> findPublisherByName(String name);
    
    /**
     * Find publishers by country.
     * @param country The country
     * @return List of publisher responses
     */
    List<PublisherResponseDto> findPublishersByCountry(String country);
    
    /**
     * Find publishers by city.
     * @param city The city
     * @return List of publisher responses
     */
    List<PublisherResponseDto> findPublishersByCity(String city);
    
    /**
     * Find publishers by founded year.
     * @param foundedYear The founded year
     * @return List of publisher responses
     */
    List<PublisherResponseDto> findPublishersByFoundedYear(Integer foundedYear);
    
    /**
     * Find publishers founded before a specific year.
     * @param year The year
     * @return List of publisher responses
     */
    List<PublisherResponseDto> findPublishersFoundedBefore(Integer year);
    
    /**
     * Find publishers founded after a specific year.
     * @param year The year
     * @return List of publisher responses
     */
    List<PublisherResponseDto> findPublishersFoundedAfter(Integer year);
    
    /**
     * Find publishers by book genre.
     * @param genreName The genre name
     * @return List of publisher responses
     */
    List<PublisherResponseDto> findPublishersByBookGenre(String genreName);
    
    /**
     * Find publishers by book author.
     * @param authorName The author name
     * @return List of publisher responses
     */
    List<PublisherResponseDto> findPublishersByBookAuthor(String authorName);
    
    /**
     * Find books by publisher ID.
     * @param publisherId The publisher ID
     * @return List of book responses
     */
    List<BookResponseDto> findBooksByPublisher(Long publisherId);
    
    // Legacy methods (deprecated for backward compatibility)
    /**
     * @deprecated Use {@link #createPublisher(PublisherRequestDto)} instead.
     */
    @Deprecated
    PublisherEntity createPublisher(PublisherEntity publisher);
    
    /**
     * @deprecated Use {@link #updatePublisher(Long, PublisherRequestDto)} instead.
     */
    @Deprecated
    PublisherEntity updatePublisher(Long id, PublisherEntity publisher);
    
    /**
     * @deprecated Use {@link #deletePublisher(Long)} instead.
     */
    @Deprecated
    void deletePublisherLegacy(Long id);
    
    /**
     * @deprecated Use {@link #findPublishers(String, String, String, Boolean, int, int)} instead.
     */
    @Deprecated
    Paginate<PublisherEntity> getPublishers(String searchName, String searchCountry, String searchCity, Boolean isActive, int page, int pageSize);
    
    /**
     * @deprecated Use {@link #findPublisherByName(String)} instead.
     */
    @Deprecated
    Optional<PublisherEntity> getPublisherByName(String name);
    
    /**
     * @deprecated Use {@link #findPublishersByCountry(String)} instead.
     */
    @Deprecated
    List<PublisherEntity> getPublishersByCountry(String country);
    
    /**
     * @deprecated Use {@link #findPublishersByCity(String)} instead.
     */
    @Deprecated
    List<PublisherEntity> getPublishersByCity(String city);
    
    /**
     * @deprecated Use {@link #findPublishersByFoundedYear(Integer)} instead.
     */
    @Deprecated
    List<PublisherEntity> getPublishersByFoundedYear(Integer foundedYear);
    
    /**
     * @deprecated Use {@link #findPublishersFoundedBefore(Integer)} instead.
     */
    @Deprecated
    List<PublisherEntity> getPublishersFoundedBefore(Integer year);
    
    /**
     * @deprecated Use {@link #findPublishersFoundedAfter(Integer)} instead.
     */
    @Deprecated
    List<PublisherEntity> getPublishersFoundedAfter(Integer year);
    
    /**
     * @deprecated Use {@link #findPublishersByBookGenre(String)} instead.
     */
    @Deprecated
    List<PublisherEntity> getPublishersByBookGenre(String genreName);
    
    /**
     * @deprecated Use {@link #findPublishersByBookAuthor(String)} instead.
     */
    @Deprecated
    List<PublisherEntity> getPublishersByBookAuthor(String authorName);
    
    /**
     * @deprecated Use {@link #findBooksByPublisher(Long)} instead.
     */
    @Deprecated
    List<BookResponseDto> getBooksByPublisher(Long publisherId);
} 