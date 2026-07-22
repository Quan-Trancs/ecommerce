package quantran.api.service;

import quantran.api.entity.AuthorEntity;
import quantran.api.page.Paginate;
import quantran.api.dto.AuthorRequestDto;
import quantran.api.dto.AuthorResponseDto;
import quantran.api.dto.BookResponseDto;

import java.util.List;
import java.util.Optional;

/**
 * Standardized AuthorService interface with consistent naming conventions.
 * This interface provides standardized CRUD operations and query methods.
 */
public interface AuthorService extends BaseService<AuthorEntity, Long> {
    
    // Standardized CRUD operations
    /**
     * Create a new author using the standardized request DTO.
     * @param request The author creation request
     * @return The created author response
     */
    AuthorResponseDto createAuthor(AuthorRequestDto request);
    
    /**
     * Find an author by its ID and return the standardized response DTO.
     * @param id The author ID
     * @return Optional containing the author response if found
     */
    Optional<AuthorResponseDto> findAuthorById(Long id);
    
    /**
     * Update an existing author using the standardized request DTO.
     * @param id The author ID
     * @param request The author update request
     * @return The updated author response
     */
    AuthorResponseDto updateAuthor(Long id, AuthorRequestDto request);
    
    /**
     * Delete an author by its ID.
     * @param id The author ID
     */
    void deleteAuthor(Long id);
    
    // Standardized query methods
    /**
     * Find authors with standardized search parameters.
     * @param name Author name filter
     * @param country Country filter
     * @param isAlive Alive status filter
     * @param page Page number (0-based)
     * @param size Page size
     * @return Paginated list of author responses
     */
    Paginate<AuthorResponseDto> findAuthors(String name, String country, Boolean isAlive, int page, int size);
    
    /**
     * Find an author by name.
     * @param name The author name
     * @return Optional containing the author response if found
     */
    Optional<AuthorResponseDto> findAuthorByName(String name);
    
    /**
     * Find authors by country.
     * @param country The country
     * @return List of author responses
     */
    List<AuthorResponseDto> findAuthorsByCountry(String country);
    
    /**
     * Find authors by birth year range.
     * @param startYear Start year
     * @param endYear End year
     * @return List of author responses
     */
    List<AuthorResponseDto> findAuthorsByBirthYearRange(int startYear, int endYear);
    
    /**
     * Find authors by book genre.
     * @param genreName The genre name
     * @return List of author responses
     */
    List<AuthorResponseDto> findAuthorsByBookGenre(String genreName);
    
    /**
     * Find authors by book publisher.
     * @param publisherName The publisher name
     * @return List of author responses
     */
    List<AuthorResponseDto> findAuthorsByBookPublisher(String publisherName);
    
    /**
     * Find books by author ID.
     * @param authorId The author ID
     * @return List of book responses
     */
    List<BookResponseDto> findBooksByAuthor(Long authorId);
    
    // Legacy methods (deprecated for backward compatibility)
    /**
     * @deprecated Use {@link #createAuthor(AuthorRequestDto)} instead.
     */
    @Deprecated
    AuthorEntity createAuthor(AuthorEntity author);
    
    /**
     * @deprecated Use {@link #updateAuthor(Long, AuthorRequestDto)} instead.
     */
    @Deprecated
    AuthorEntity updateAuthor(Long id, AuthorEntity author);
    
    /**
     * @deprecated Use {@link #deleteAuthor(Long)} instead.
     */
    @Deprecated
    void deleteAuthorLegacy(Long id);
    
    /**
     * @deprecated Use {@link #findAuthors(String, String, Boolean, int, int)} instead.
     */
    @Deprecated
    Paginate<AuthorEntity> getAuthors(String searchName, String searchCountry, Boolean isAlive, int page, int pageSize);
    
    /**
     * @deprecated Use {@link #findAuthorByName(String)} instead.
     */
    @Deprecated
    Optional<AuthorEntity> getAuthorByName(String name);
    
    /**
     * @deprecated Use {@link #findAuthorsByCountry(String)} instead.
     */
    @Deprecated
    List<AuthorEntity> getAuthorsByCountry(String country);
    
    /**
     * @deprecated Use {@link #findAuthorsByBirthYearRange(int, int)} instead.
     */
    @Deprecated
    List<AuthorEntity> getAuthorsByBirthYearRange(int startYear, int endYear);
    
    /**
     * @deprecated Use {@link #findAuthorsByBookGenre(String)} instead.
     */
    @Deprecated
    List<AuthorEntity> getAuthorsByBookGenre(String genreName);
    
    /**
     * @deprecated Use {@link #findAuthorsByBookPublisher(String)} instead.
     */
    @Deprecated
    List<AuthorEntity> getAuthorsByBookPublisher(String publisherName);
    
    /**
     * @deprecated Use {@link #findBooksByAuthor(Long)} instead.
     */
    @Deprecated
    List<BookResponseDto> getBooksByAuthor(Long authorId);
} 