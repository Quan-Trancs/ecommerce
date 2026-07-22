package quantran.api.controller;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import quantran.api.dto.AuthorRequestDto;
import quantran.api.dto.AuthorResponseDto;
import quantran.api.dto.BookResponseDto;
import quantran.api.page.Paginate;
import quantran.api.service.AuthorService;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.Pattern;
import java.util.List;
import java.util.Optional;

/**
 * Standardized AuthorController with RESTful endpoints and consistent naming conventions.
 * This controller provides standardized CRUD operations and query methods for authors.
 */
@RestController
@RequestMapping("/api/v1/authors")
@Validated
@Log4j2
public class AuthorController {

    @Autowired
    private AuthorService authorService;

    // Standardized CRUD Operations

    /**
     * Create a new author.
     * 
     * @param request The author creation request
     * @return The created author response
     */
    @PostMapping
    public ResponseEntity<AuthorResponseDto> createAuthor(@Valid @RequestBody AuthorRequestDto request) {
        log.info("Creating author with name: {}", request.getName());
        
        AuthorResponseDto createdAuthor = authorService.createAuthor(request);
        log.info("Successfully created author with ID: {}", createdAuthor.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAuthor);
    }

    /**
     * Find an author by its ID.
     * 
     * @param id The author ID
     * @return The author response if found
     */
    @GetMapping("/{id}")
    public ResponseEntity<AuthorResponseDto> findAuthorById(
            @PathVariable @Min(value = 1, message = "Author ID must be positive") Long id) {
        log.info("Finding author by ID: {}", id);
        
        Optional<AuthorResponseDto> author = authorService.findAuthorById(id);
        if (author.isPresent()) {
            log.info("Found author with ID: {}", id);
            return ResponseEntity.ok(author.get());
        } else {
            log.warn("Author not found with ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Find authors with search criteria.
     * 
     * @param name Author name filter
     * @param country Country filter
     * @param isAlive Alive status filter
     * @param page Page number (0-based)
     * @param size Page size
     * @return Paginated list of author responses
     */
    @GetMapping
    public ResponseEntity<Paginate<AuthorResponseDto>> findAuthors(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Boolean isAlive,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be non-negative") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be positive") int size) {
        
        log.info("Finding authors with filters - name: {}, country: {}, isAlive: {}, page: {}, size: {}", 
                name, country, isAlive, page, size);
        
        Paginate<AuthorResponseDto> authors = authorService.findAuthors(name, country, isAlive, page, size);
        log.info("Found {} authors", authors.getTotal());
        return ResponseEntity.ok(authors);
    }

    /**
     * Update an existing author.
     * 
     * @param id The author ID
     * @param request The author update request
     * @return The updated author response
     */
    @PutMapping("/{id}")
    public ResponseEntity<AuthorResponseDto> updateAuthor(
            @PathVariable @Min(value = 1, message = "Author ID must be positive") Long id,
            @Valid @RequestBody AuthorRequestDto request) {
        
        log.info("Updating author with ID: {}", id);
        
        AuthorResponseDto updatedAuthor = authorService.updateAuthor(id, request);
        log.info("Successfully updated author with ID: {}", id);
        return ResponseEntity.ok(updatedAuthor);
    }

    /**
     * Delete an author by its ID.
     * 
     * @param id The author ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAuthor(
            @PathVariable @Min(value = 1, message = "Author ID must be positive") Long id) {
        
        log.info("Deleting author with ID: {}", id);
        
        authorService.deleteAuthor(id);
        log.info("Successfully deleted author with ID: {}", id);
        return ResponseEntity.noContent().build();
    }

    // Specialized Query Endpoints

    /**
     * Find an author by name.
     * 
     * @param name The author name
     * @return The author response if found
     */
    @GetMapping("/name/{name}")
    public ResponseEntity<AuthorResponseDto> findAuthorByName(
            @PathVariable @Pattern(regexp = "^[A-Za-z\\s\\-']+$", message = "Invalid author name format") String name) {
        
        log.info("Finding author by name: {}", name);
        
        Optional<AuthorResponseDto> author = authorService.findAuthorByName(name);
        if (author.isPresent()) {
            log.info("Found author with name: {}", name);
            return ResponseEntity.ok(author.get());
        } else {
            log.warn("Author not found with name: {}", name);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Find authors by country.
     * 
     * @param country The country
     * @return List of author responses
     */
    @GetMapping("/country/{country}")
    public ResponseEntity<List<AuthorResponseDto>> findAuthorsByCountry(
            @PathVariable @Pattern(regexp = "^[A-Za-z\\s\\-']+$", message = "Invalid country format") String country) {
        
        log.info("Finding authors by country: {}", country);
        
        List<AuthorResponseDto> authors = authorService.findAuthorsByCountry(country);
        log.info("Found {} authors for country: {}", authors.size(), country);
        return ResponseEntity.ok(authors);
    }

    /**
     * Find authors by birth year range.
     * 
     * @param startYear Start year
     * @param endYear End year
     * @return List of author responses
     */
    @GetMapping("/birth-year-range")
    public ResponseEntity<List<AuthorResponseDto>> findAuthorsByBirthYearRange(
            @RequestParam @Min(value = 1800, message = "Start year must be at least 1800") int startYear,
            @RequestParam @Min(value = 1800, message = "End year must be at least 1800") int endYear) {
        
        log.info("Finding authors by birth year range: {} - {}", startYear, endYear);
        
        List<AuthorResponseDto> authors = authorService.findAuthorsByBirthYearRange(startYear, endYear);
        log.info("Found {} authors in birth year range: {} - {}", authors.size(), startYear, endYear);
        return ResponseEntity.ok(authors);
    }

    /**
     * Find authors by book genre.
     * 
     * @param genreName The genre name
     * @return List of author responses
     */
    @GetMapping("/genre/{genreName}")
    public ResponseEntity<List<AuthorResponseDto>> findAuthorsByBookGenre(
            @PathVariable @Pattern(regexp = "^[A-Za-z\\s\\-']+$", message = "Invalid genre name format") String genreName) {
        
        log.info("Finding authors by book genre: {}", genreName);
        
        List<AuthorResponseDto> authors = authorService.findAuthorsByBookGenre(genreName);
        log.info("Found {} authors for book genre: {}", authors.size(), genreName);
        return ResponseEntity.ok(authors);
    }

    /**
     * Find authors by book publisher.
     * 
     * @param publisherName The publisher name
     * @return List of author responses
     */
    @GetMapping("/publisher/{publisherName}")
    public ResponseEntity<List<AuthorResponseDto>> findAuthorsByBookPublisher(
            @PathVariable @Pattern(regexp = "^[A-Za-z\\s\\-']+$", message = "Invalid publisher name format") String publisherName) {
        
        log.info("Finding authors by book publisher: {}", publisherName);
        
        List<AuthorResponseDto> authors = authorService.findAuthorsByBookPublisher(publisherName);
        log.info("Found {} authors for book publisher: {}", authors.size(), publisherName);
        return ResponseEntity.ok(authors);
    }

    /**
     * Find books by author ID.
     * 
     * @param authorId The author ID
     * @return List of book responses
     */
    @GetMapping("/{authorId}/books")
    public ResponseEntity<List<BookResponseDto>> findBooksByAuthor(
            @PathVariable @Min(value = 1, message = "Author ID must be positive") Long authorId) {
        
        log.info("Finding books by author ID: {}", authorId);
        
        List<BookResponseDto> books = authorService.findBooksByAuthor(authorId);
        log.info("Found {} books for author ID: {}", books.size(), authorId);
        return ResponseEntity.ok(books);
    }
} 