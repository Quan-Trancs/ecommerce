package quantran.api.controller;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import quantran.api.dto.BookRequestDto;
import quantran.api.dto.BookResponseDto;
import quantran.api.entity.BookTypeEntity;
import quantran.api.page.Paginate;
import quantran.api.service.BookService;
import quantran.api.dto.AsyncTaskRequest;
import quantran.api.dto.AsyncTaskResponseDto;
import quantran.api.service.AsyncTaskService;
import quantran.api.asyncProcessingWorkAcceptor.AsyncProcessingWorkAcceptor;
import quantran.api.asyncProcessingBackgroundWorker.impl.AsyncProcessingBackgroundWorkerImpl;
import quantran.api.asyncProcessingBackgroundWorker.task.Task;
import quantran.api.service.IdempotencyService;
import javax.validation.constraints.NotBlank;
import java.util.Optional;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.Pattern;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import quantran.api.model.BookModel;
import quantran.api.model.UserModel;

/**
 * Standardized BookController with RESTful endpoints and consistent naming conventions.
 * This controller provides standardized CRUD operations and query methods for books.
 */
@RestController
@RequestMapping("/api/v1/books")
@Validated
@Log4j2
public class BookController {

    @Autowired
    private BookService bookService;

    // Inject async dependencies
    @Autowired private AsyncTaskService asyncTaskService;
    @Autowired private AsyncProcessingWorkAcceptor asyncProcessingWorkAcceptor;
    @Autowired private AsyncProcessingBackgroundWorkerImpl asyncProcessingBackgroundWorkerImpl;
    @Autowired private IdempotencyService idempotencyService;

    // Standardized CRUD Operations

    /**
     * Create a new book.
     * 
     * @param request The book creation request
     * @return The created book response
     */
    @PostMapping
    public ResponseEntity<BookResponseDto> createBook(@Valid @RequestBody BookRequestDto request) {
        log.info("Creating book with ID: {}", request.getId());
        
        try {
            BookResponseDto createdBook = bookService.createBook(request);
            log.info("Successfully created book with ID: {}", createdBook.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdBook);
        } catch (Exception e) {
            log.error("Error creating book with ID: {}", request.getId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Find a book by its ID.
     * 
     * @param id The book ID
     * @return The book response if found
     */
    @GetMapping("/{id}")
    public ResponseEntity<BookResponseDto> findBookById(
            @PathVariable @Pattern(regexp = "^[A-Z0-9]{3,20}$", message = "Invalid book ID format") String id) {
        log.info("Finding book by ID: {}", id);
        
        try {
            Optional<BookResponseDto> book = bookService.findBookById(id);
            if (book.isPresent()) {
                log.info("Found book with ID: {}", id);
                return ResponseEntity.ok(book.get());
            } else {
                log.warn("Book not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error finding book with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Find books with search criteria.
     * 
     * @param title Book title filter
     * @param author Author name filter
     * @param isbn ISBN filter
     * @param genre Genre filter
     * @param publisher Publisher filter
     * @param page Page number (0-based)
     * @param size Page size
     * @return Paginated list of book responses
     */
    @GetMapping
    public ResponseEntity<Paginate<BookResponseDto>> findBooks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String isbn,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String publisher,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be non-negative") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be positive") int size) {
        
        log.info("Finding books with filters - title: {}, author: {}, isbn: {}, genre: {}, publisher: {}, page: {}, size: {}", 
                title, author, isbn, genre, publisher, page, size);
        
        try {
            Paginate<BookResponseDto> books = bookService.findBooks(title, author, isbn, genre, publisher, page, size);
            log.info("Found {} books", books.getTotal());
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error finding books", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update an existing book.
     * 
     * @param id The book ID
     * @param request The book update request
     * @return The updated book response
     */
    @PutMapping("/{id}")
    public ResponseEntity<BookResponseDto> updateBook(
            @PathVariable @Pattern(regexp = "^[A-Z0-9]{3,20}$", message = "Invalid book ID format") String id,
            @Valid @RequestBody BookRequestDto request) {
        
        log.info("Updating book with ID: {}", id);
        
        try {
            BookResponseDto updatedBook = bookService.updateBook(id, request);
            log.info("Successfully updated book with ID: {}", id);
            return ResponseEntity.ok(updatedBook);
        } catch (Exception e) {
            log.error("Error updating book with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a book by its ID.
     * 
     * @param id The book ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(
            @PathVariable @Pattern(regexp = "^[A-Z0-9]{3,20}$", message = "Invalid book ID format") String id) {
        
        log.info("Deleting book with ID: {}", id);
        
        try {
            bookService.deleteBook(id);
            log.info("Successfully deleted book with ID: {}", id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting book with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Specialized Query Endpoints

    /**
     * Find a book by ISBN.
     * 
     * @param isbn The ISBN
     * @return The book response if found
     */
    @GetMapping("/isbn/{isbn}")
    public ResponseEntity<BookResponseDto> findBookByIsbn(
            @PathVariable @Pattern(regexp = "^(?:\\d{10}|\\d{13})$", message = "Invalid ISBN format") String isbn) {
        
        log.info("Finding book by ISBN: {}", isbn);
        
        try {
            Optional<BookResponseDto> book = bookService.findBookByIsbn(isbn);
            if (book.isPresent()) {
                log.info("Found book with ISBN: {}", isbn);
                return ResponseEntity.ok(book.get());
            } else {
                log.warn("Book not found with ISBN: {}", isbn);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error finding book with ISBN: {}", isbn, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Find books by author ID.
     * 
     * @param authorId The author ID
     * @return List of book responses
     */
    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<BookResponseDto>> findBooksByAuthor(
            @PathVariable @Min(value = 1, message = "Author ID must be positive") Long authorId) {
        
        log.info("Finding books by author ID: {}", authorId);
        
        try {
            List<BookResponseDto> books = bookService.findBooksByAuthor(authorId);
            log.info("Found {} books for author ID: {}", books.size(), authorId);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error finding books by author ID: {}", authorId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Find books by genre ID.
     * 
     * @param genreId The genre ID
     * @return List of book responses
     */
    @GetMapping("/genre/{genreId}")
    public ResponseEntity<List<BookResponseDto>> findBooksByGenre(
            @PathVariable @Pattern(regexp = "^[A-Z0-9]{3,20}$", message = "Invalid genre ID format") String genreId) {
        
        log.info("Finding books by genre ID: {}", genreId);
        
        try {
            List<BookResponseDto> books = bookService.findBooksByGenre(genreId);
            log.info("Found {} books for genre ID: {}", books.size(), genreId);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error finding books by genre ID: {}", genreId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Find books by publisher ID.
     * 
     * @param publisherId The publisher ID
     * @return List of book responses
     */
    @GetMapping("/publisher/{publisherId}")
    public ResponseEntity<List<BookResponseDto>> findBooksByPublisher(
            @PathVariable @Min(value = 1, message = "Publisher ID must be positive") Long publisherId) {
        
        log.info("Finding books by publisher ID: {}", publisherId);
        
        try {
            List<BookResponseDto> books = bookService.findBooksByPublisher(publisherId);
            log.info("Found {} books for publisher ID: {}", books.size(), publisherId);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error finding books by publisher ID: {}", publisherId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Find books with low stock.
     * 
     * @return List of book responses with low stock
     */
    @GetMapping("/low-stock")
    public ResponseEntity<List<BookResponseDto>> findBooksWithLowStock() {
        log.info("Finding books with low stock");
        
        try {
            List<BookResponseDto> books = bookService.findBooksWithLowStock();
            log.info("Found {} books with low stock", books.size());
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error finding books with low stock", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Find books with active discounts.
     * 
     * @return List of book responses with discounts
     */
    @GetMapping("/discounts")
    public ResponseEntity<List<BookResponseDto>> findBooksWithDiscount() {
        log.info("Finding books with discounts");
        
        try {
            List<BookResponseDto> books = bookService.findBooksWithDiscount();
            log.info("Found {} books with discounts", books.size());
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error finding books with discounts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Find books by publication year.
     * 
     * @param year The publication year
     * @return List of book responses
     */
    @GetMapping("/publication-year/{year}")
    public ResponseEntity<List<BookResponseDto>> findBooksByPublicationYear(
            @PathVariable @Min(value = 1800, message = "Publication year must be at least 1800") int year) {
        
        log.info("Finding books by publication year: {}", year);
        
        try {
            List<BookResponseDto> books = bookService.findBooksByPublicationYear(year);
            log.info("Found {} books for publication year: {}", books.size(), year);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error finding books by publication year: {}", year, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Find books by language.
     * 
     * @param language The language code
     * @return List of book responses
     */
    @GetMapping("/language/{language}")
    public ResponseEntity<List<BookResponseDto>> findBooksByLanguage(
            @PathVariable @Pattern(regexp = "^[a-z]{2,3}$", message = "Invalid language code format") String language) {
        
        log.info("Finding books by language: {}", language);
        
        try {
            List<BookResponseDto> books = bookService.findBooksByLanguage(language);
            log.info("Found {} books for language: {}", books.size(), language);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error finding books by language: {}", language, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Find books by format.
     * 
     * @param format The book format
     * @return List of book responses
     */
    @GetMapping("/format/{format}")
    public ResponseEntity<List<BookResponseDto>> findBooksByFormat(
            @PathVariable @Pattern(regexp = "^[A-Za-z\\s-]+$", message = "Invalid format") String format) {
        
        log.info("Finding books by format: {}", format);
        
        try {
            List<BookResponseDto> books = bookService.findBooksByFormat(format);
            log.info("Found {} books for format: {}", books.size(), format);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error finding books by format: {}", format, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Find books within a price range.
     * 
     * @param minPrice Minimum price
     * @param maxPrice Maximum price
     * @return List of book responses
     */
    @GetMapping("/price-range")
    public ResponseEntity<List<BookResponseDto>> findBooksByPriceRange(
            @RequestParam @Min(value = 0, message = "Minimum price must be non-negative") BigDecimal minPrice,
            @RequestParam @Min(value = 0, message = "Maximum price must be non-negative") BigDecimal maxPrice) {
        
        log.info("Finding books by price range: {} - {}", minPrice, maxPrice);
        
        try {
            List<BookResponseDto> books = bookService.findBooksByPriceRange(minPrice, maxPrice);
            log.info("Found {} books in price range: {} - {}", books.size(), minPrice, maxPrice);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error finding books by price range: {} - {}", minPrice, maxPrice, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Business Logic Endpoints

    /**
     * Process book upload from file.
     * 
     * @param file The uploaded file
     * @return Success response
     */
    @PostMapping("/upload")
    public ResponseEntity<String> processBookUpload(@RequestParam("file") MultipartFile file) throws IOException {
        log.info("Processing book upload: {}", file.getOriginalFilename());
        bookService.processBookUpload(file);
        log.info("Successfully processed book upload: {}", file.getOriginalFilename());
        return ResponseEntity.ok("Book upload processed successfully");
    }

    /**
     * Download books data.
     * 
     * @return Response entity with book data
     */
    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadBooks() throws IOException {
        log.info("Downloading books data");
        ResponseEntity<byte[]> response = bookService.downloadBooks();
        log.info("Successfully downloaded books data");
        return response;
    }

    /**
     * Get all book types/genres.
     * 
     * @return List of book type entities
     */
    @GetMapping("/types")
    public ResponseEntity<List<BookTypeEntity>> getBookTypes() {
        log.info("Getting book types");
        
        try {
            List<BookTypeEntity> bookTypes = bookService.getBookTypes();
            log.info("Found {} book types", bookTypes.size());
            return ResponseEntity.ok(bookTypes);
        } catch (Exception e) {
            log.error("Error getting book types", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // PATCH /api/v1/books/{id} - Asynchronous book update
    @PatchMapping("/{id}")
    public ResponseEntity<AsyncTaskResponseDto> updateBookAsync(
            @RequestHeader @NotBlank(message = "User name is required") String userName,
            @RequestHeader @NotBlank(message = "User key is required") String userKey,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @PathVariable String id,
            @Valid @RequestBody BookRequestDto bookRequest) {
        UserModel userModel = new UserModel(userName, userKey);
        String[] status = asyncProcessingWorkAcceptor.acceptWork(userModel);
        if ("404".equals(status[0])) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!id.equals(bookRequest.getId())) {
            return ResponseEntity.badRequest().build();
        }
        Optional<ResponseEntity<AsyncTaskResponseDto>> idempotentResponse =
            AsyncIdempotencyUtil.handleIdempotency(userName, idempotencyKey, idempotencyService, asyncTaskService);
        if (idempotentResponse.isPresent()) return idempotentResponse.get();
        BookModel bookModel = new BookModel(
            bookRequest.getId(),
            bookRequest.getTitle(),
            bookRequest.getAuthor(),
            bookRequest.getPrice().toString(),
            bookRequest.getBookType()
        );
        AsyncTaskRequest task = asyncTaskService.submitTask("update_book", bookModel, userName);
        idempotencyService.saveTaskId(userName, idempotencyKey, task.getTaskId());
        Task backgroundTask = new Task("update", task.getTaskId(), bookModel);
        asyncProcessingBackgroundWorkerImpl.addToRequestQueue(backgroundTask);
        AsyncTaskResponseDto response = AsyncTaskResponseDto.fromAsyncTaskRequest(task);
        return ResponseEntity.accepted().body(response);
    }

    // GET /api/v1/books/tasks/{taskId} - Get async task status
    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<AsyncTaskResponseDto> findTaskStatus(@PathVariable String taskId) {
        Optional<AsyncTaskRequest> task = asyncTaskService.getTaskStatus(taskId);
        if (task.isPresent()) {
            AsyncTaskResponseDto response = AsyncTaskResponseDto.fromAsyncTaskRequest(task.get());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE /api/v1/books/tasks/{taskId} - Cancel async task
    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<String> cancelTask(
            @PathVariable String taskId,
            @RequestParam String userId) {
        boolean cancelled = asyncTaskService.cancelTask(taskId, userId);
        if (cancelled) {
            return ResponseEntity.ok("Task cancelled successfully");
        } else {
            return ResponseEntity.badRequest().body("Task could not be cancelled");
        }
    }
} 