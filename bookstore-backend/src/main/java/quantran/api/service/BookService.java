package quantran.api.service;

import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import quantran.api.entity.BookEntity;
import quantran.api.entity.BookTypeEntity;
import quantran.api.model.BookModel;
import quantran.api.page.Paginate;
import quantran.api.dto.BookRequestDto;
import quantran.api.dto.BookResponseDto;
import quantran.api.dto.BookDetailDto;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Standardized BookService interface with consistent naming conventions.
 * This interface provides standardized CRUD operations and query methods.
 */
public interface BookService extends BaseService<BookEntity, String> {
    
    // Standardized CRUD operations
    /**
     * Create a new book using the standardized request DTO.
     * @param request The book creation request
     * @return The created book response
     */
    BookResponseDto createBook(BookRequestDto request);
    
    /**
     * Find a book by its ID and return the standardized response DTO.
     * @param id The book ID
     * @return Optional containing the book response if found
     */
    Optional<BookResponseDto> findBookById(String id);
    
    /**
     * Update an existing book using the standardized request DTO.
     * @param id The book ID
     * @param request The book update request
     * @return The updated book response
     */
    BookResponseDto updateBook(String id, BookRequestDto request);
    
    /**
     * Delete a book by its ID.
     * @param id The book ID
     */
    void deleteBook(String id);
    
    // Standardized query methods
    /**
     * Find books with standardized search parameters.
     * @param title Book title filter
     * @param author Author name filter
     * @param isbn ISBN filter
     * @param genre Genre filter
     * @param publisher Publisher filter
     * @param page Page number (0-based)
     * @param size Page size
     * @return Paginated list of book responses
     */
    Paginate<BookResponseDto> findBooks(String title, String author, String isbn, String genre, String publisher, int page, int size);
    
    /**
     * Find a book by its ISBN.
     * @param isbn The ISBN
     * @return Optional containing the book response if found
     */
    Optional<BookResponseDto> findBookByIsbn(String isbn);
    
    /**
     * Find books by author ID.
     * @param authorId The author ID
     * @return List of book responses
     */
    List<BookResponseDto> findBooksByAuthor(Long authorId);
    
    /**
     * Find books by genre ID.
     * @param genreId The genre ID
     * @return List of book responses
     */
    List<BookResponseDto> findBooksByGenre(String genreId);
    
    /**
     * Find books by publisher ID.
     * @param publisherId The publisher ID
     * @return List of book responses
     */
    List<BookResponseDto> findBooksByPublisher(Long publisherId);
    
    /**
     * Find books with low stock.
     * @return List of book responses with low stock
     */
    List<BookResponseDto> findBooksWithLowStock();
    
    /**
     * Find books with active discounts.
     * @return List of book responses with discounts
     */
    List<BookResponseDto> findBooksWithDiscount();
    
    /**
     * Find books by publication year.
     * @param year The publication year
     * @return List of book responses
     */
    List<BookResponseDto> findBooksByPublicationYear(int year);
    
    /**
     * Find books by language.
     * @param language The language code
     * @return List of book responses
     */
    List<BookResponseDto> findBooksByLanguage(String language);
    
    /**
     * Find books by format.
     * @param format The book format
     * @return List of book responses
     */
    List<BookResponseDto> findBooksByFormat(String format);
    
    /**
     * Find books within a price range.
     * @param minPrice Minimum price
     * @param maxPrice Maximum price
     * @return List of book responses
     */
    List<BookResponseDto> findBooksByPriceRange(java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice);
    
    // Business logic methods
    /**
     * Process book upload from file.
     * @param bookFile The uploaded file
     * @throws IOException If file processing fails
     */
    void processBookUpload(MultipartFile bookFile) throws IOException;
    
    /**
     * Download books data.
     * @return Response entity with book data
     * @throws IOException If download fails
     */
    ResponseEntity<byte[]> downloadBooks() throws IOException;
    
    /**
     * Get all book types/genres.
     * @return List of book type entities
     */
    List<BookTypeEntity> getBookTypes();
    
    // Legacy methods (deprecated for backward compatibility)
    /**
     * @deprecated Use {@link #createBook(BookRequestDto)} instead.
     */
    @Deprecated
    void addBook(BookModel bookModel);
    
    /**
     * @deprecated Use {@link #deleteBook(String)} instead.
     */
    @Deprecated
    void delBook(String delId);
    
    /**
     * @deprecated Use {@link #updateBook(String, BookRequestDto)} instead.
     */
    @Deprecated
    void updateBook(BookModel bookModel);
    
    /**
     * @deprecated Use {@link #findBooks(String, String, String, String, String, int, int)} instead.
     */
    @Deprecated
    Paginate<BookModel> getBook(String searchTitle, String searchAuthor, String searchId, String searchGenre, String searchPublisher, int page, int pageSize);
    
    /**
     * @deprecated Use {@link #findBookById(String)} instead.
     */
    @Deprecated
    Optional<BookDetailDto> getBookById(String id);
    
    /**
     * @deprecated Use {@link #findBookByIsbn(String)} instead.
     */
    @Deprecated
    Optional<BookDetailDto> getBookByIsbn(String isbn);
    
    /**
     * @deprecated Use {@link #findBooksByAuthor(Long)} instead.
     */
    @Deprecated
    List<BookDetailDto> getBooksByAuthor(Long authorId);
    
    /**
     * @deprecated Use {@link #findBooksByGenre(String)} instead.
     */
    @Deprecated
    List<BookDetailDto> getBooksByGenre(String genreId);
    
    /**
     * @deprecated Use {@link #findBooksByPublisher(Long)} instead.
     */
    @Deprecated
    List<BookDetailDto> getBooksByPublisher(Long publisherId);
    
    /**
     * @deprecated Use {@link #findBooksWithLowStock()} instead.
     */
    @Deprecated
    List<BookDetailDto> getBooksWithLowStock();
    
    /**
     * @deprecated Use {@link #findBooksWithDiscount()} instead.
     */
    @Deprecated
    List<BookDetailDto> getBooksWithDiscount();
    
    /**
     * @deprecated Use {@link #findBooksByPublicationYear(int)} instead.
     */
    @Deprecated
    List<BookDetailDto> getBooksByPublicationYear(int year);
    
    /**
     * @deprecated Use {@link #findBooksByLanguage(String)} instead.
     */
    @Deprecated
    List<BookDetailDto> getBooksByLanguage(String language);
    
    /**
     * @deprecated Use {@link #findBooksByFormat(String)} instead.
     */
    @Deprecated
    List<BookDetailDto> getBooksByFormat(String format);
    
    /**
     * @deprecated Use {@link #findBooksByPriceRange(java.math.BigDecimal, java.math.BigDecimal)} instead.
     */
    @Deprecated
    List<BookDetailDto> getBooksByPriceRange(java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice);
    
    /**
     * @deprecated Use {@link #processBookUpload(MultipartFile)} instead.
     */
    @Deprecated
    void uploadBook(MultipartFile bookFile) throws IOException;
    
    /**
     * @deprecated Use {@link #downloadBooks()} instead.
     */
    @Deprecated
    ResponseEntity<byte[]> downloadBook() throws IOException;
    
    /**
     * @deprecated Use {@link #getBookTypes()} instead.
     */
    @Deprecated
    List<BookTypeEntity> getBookType();
} 