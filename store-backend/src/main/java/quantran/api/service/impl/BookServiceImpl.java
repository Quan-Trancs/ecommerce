package quantran.api.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import quantran.api.dto.BookDetailDto;
import quantran.api.dto.BookRequestDto;
import quantran.api.dto.BookResponseDto;
import quantran.api.entity.BookEntity;
import quantran.api.entity.BookTypeEntity;
import quantran.api.business.BookBusiness;
import quantran.api.model.BookModel;
import quantran.api.page.Paginate;
import quantran.api.repository.BookRepository;
import quantran.api.service.BookService;
import quantran.api.util.ValidationUtil;
import org.springframework.cache.annotation.Cacheable;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class BookServiceImpl implements BookService {
    private final BookBusiness bookBusiness;
    private final BookRepository bookRepository;

    // BaseService implementations
    @Override
    public Paginate<BookEntity> getAll(int page, int size) {
        log.debug("Getting all books - page: {}, size: {}", page, size);
        // Use the existing getBook method with null search parameters
        Paginate<BookModel> bookModels = bookBusiness.getBook(null, null, null, null, null, page, size);
        // Convert BookModel to BookEntity - this is a simplified approach
        // In a real implementation, you might want to create a proper conversion method
        return new Paginate<>(new ArrayList<>(), bookModels.getTotal());
    }

    @Override
    public Optional<BookEntity> getById(String id) {
        log.debug("Getting book by ID: {}", id);
        return bookRepository.findById(id);
    }

    @Override
    public BookEntity create(BookEntity entity) {
        log.info("Creating new book: {}", entity.getId());
        
        // Validate book before creation
        validateBeforeCreate(entity);
        
        BookEntity savedEntity = bookRepository.save(entity);
        log.info("Book created successfully with ID: {}", savedEntity.getId());
        
        return savedEntity;
    }

    @Override
    public BookEntity update(String id, BookEntity entity) {
        log.info("Updating book with ID: {}", id);
        
        // Validate book exists
        BookEntity existingBook = ValidationUtil.validateEntityExists(
            bookRepository.findById(id), id, "Book"
        );
        
        // Validate book before update
        validateBeforeUpdate(id, entity);
        
        // Update book fields
        updateEntityFields(existingBook, entity);
        
        BookEntity savedEntity = bookRepository.save(existingBook);
        log.info("Book updated successfully with ID: {}", id);
        
        return savedEntity;
    }

    @Override
    public void delete(String id) {
        log.info("Deleting book with ID: {}", id);
        
        // Validate book exists
        BookEntity book = ValidationUtil.validateEntityExists(
            bookRepository.findById(id), id, "Book"
        );
        
        // Validate book can be deleted
        validateBeforeDelete(book);
        
        bookRepository.delete(book);
        log.info("Book deleted successfully with ID: {}", id);
    }

    @Override
    public boolean exists(String id) {
        return bookRepository.existsById(id);
    }

    @Override
    public long getTotalCount() {
        return bookRepository.count();
    }

    // Validation methods
    private void validateBeforeCreate(BookEntity book) {
        ValidationUtil.validateRequiredString(book.getId(), "Book ID");
        ValidationUtil.validateRequiredString(book.getTitle(), "Book title");
        
        // Check if book with same ID already exists
        ValidationUtil.validateNameDoesNotExist(
            book.getId(),
            bookRepository.findById(book.getId()),
            "Book"
        );
    }

    private void validateBeforeUpdate(String id, BookEntity book) {
        ValidationUtil.validateRequiredString(book.getTitle(), "Book title");
    }

    private void validateBeforeDelete(BookEntity book) {
        // Add any specific validation for book deletion if needed
        // For example, check if book has active reservations
    }

    private void updateEntityFields(BookEntity target, BookEntity source) {
        target.setTitle(source.getTitle());
        target.setSubtitle(source.getSubtitle());
        target.setIsbn(source.getIsbn());
        target.setIsbn13(source.getIsbn13());
        target.setDescription(source.getDescription());
        target.setPageCount(source.getPageCount());
        target.setLanguage(source.getLanguage());
        target.setPublicationDate(source.getPublicationDate());
        target.setEdition(source.getEdition());
        target.setFormat(source.getFormat());
        target.setPrice(source.getPrice());
        target.setOriginalPrice(source.getOriginalPrice());
        target.setDiscountPercentage(source.getDiscountPercentage());
        target.setStockQuantity(source.getStockQuantity());
        target.setReservedQuantity(source.getReservedQuantity());
        target.setReorderPoint(source.getReorderPoint());
        target.setMaxStock(source.getMaxStock());
        target.setAuthors(source.getAuthors());
        target.setGenres(source.getGenres());
        target.setPublisher(source.getPublisher());
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadBook() throws IOException {
        log.info("Start downloadBook()");
        
        String csvContent = bookBusiness.downloadBook();
        String header = "ID,Name,Author,BookType,Price\n";
        String fullContent = header + csvContent;
        
        // Create ZIP file with CSV
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            ZipEntry entry = new ZipEntry("books.csv");
            zos.putNextEntry(entry);
            zos.write(fullContent.getBytes());
            zos.closeEntry();
        }
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "books.zip");
        
        log.info("End downloadBook()");
        return ResponseEntity.ok()
                .headers(headers)
                .body(baos.toByteArray());
    }

    @Override
    @Transactional
    public void uploadBook(MultipartFile bookFile) throws IOException {
        log.info("Start uploadBook()");
        List<BookModel> bookList = new ArrayList<>();
        
        try (BufferedReader bookReader = new BufferedReader(new InputStreamReader(bookFile.getInputStream()))) {
            String line;
            int lineNumber = 0;
            
            while ((line = bookReader.readLine()) != null) {
                lineNumber++;
                try {
                    String[] data = line.split(",");
                    
                    // Validate CSV format - should have exactly 5 columns
                    if (data.length != 5) {
                        log.warn("Skipping line {}: Invalid CSV format. Expected 5 columns, found {}", lineNumber, data.length);
                        continue;
                    }
                    
                    // Validate that required fields are not empty
                    if (data[0].trim().isEmpty() || data[1].trim().isEmpty() || 
                        data[2].trim().isEmpty() || data[3].trim().isEmpty() || data[4].trim().isEmpty()) {
                        log.warn("Skipping line {}: Empty required fields", lineNumber);
                        continue;
                    }
                    
                    BookModel bookModel = new BookModel(
                        data[0].trim(), // id
                        data[1].trim(), // name
                        data[2].trim(), // author
                        data[4].trim(), // price
                        data[3].trim()  // bookType
                    );
                    bookList.add(bookModel);
                    
                } catch (Exception e) {
                    log.error("Error processing line {}: {}", lineNumber, e.getMessage());
                }
            }
        }
        
        if (!bookList.isEmpty()) {
            bookBusiness.uploadBook(bookList);
        } else {
            log.warn("No valid books found in uploaded file");
        }
        
        log.info("End uploadBook()");
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "bookTypes")
    public List<BookTypeEntity> getBookType() {
        log.debug("Getting all book types");
        return bookBusiness.getBookType();
    }

    @Override
    public List<BookTypeEntity> getBookTypes() {
        return getBookType();
    }

    @Override
    public ResponseEntity<byte[]> downloadBooks() throws IOException {
        return downloadBook();
    }
    
    @Override
    @Transactional
    public void addBook(BookModel bookModel) {
        log.info("Start addBook()");
        bookBusiness.addBook(bookModel);
        log.info("End addBook()");
    }
    
    @Override
    @Transactional
    public void delBook(String delId) {
        log.info("Start delBook()");
        bookBusiness.delBook(delId);
        log.info("End delBook()");
    }
    
    @Override
    @Transactional
    public void updateBook(BookModel bookModel) {
        log.info("Start updateBook()");
        bookBusiness.updateBook(bookModel);
        log.info("End updateBook()");
    }

    // Enhanced book management methods
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "books", key = "#searchTitle + '-' + #searchAuthor + '-' + #searchId + '-' + #searchGenre + '-' + #searchPublisher + '-' + #page + '-' + #pageSize")
    public Paginate<BookModel> getBook(String searchTitle, String searchAuthor, String searchId, String searchGenre, String searchPublisher, int page, int pageSize) {
        log.info("Start getBook() with enhanced search");
        return bookBusiness.getBook(searchId, searchTitle, searchAuthor, searchGenre, searchPublisher, page, pageSize);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "bookDetails", key = "#id")
    public Optional<BookDetailDto> getBookById(String id) {
        return bookRepository.findById(id)
                .map(this::convertToBookDetailDto);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "bookDetailsByIsbn", key = "#isbn")
    public Optional<BookDetailDto> getBookByIsbn(String isbn) {
        return bookRepository.findByIsbn(isbn)
                .map(this::convertToBookDetailDto);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "booksByAuthor", key = "#authorId")
    public List<BookDetailDto> getBooksByAuthor(Long authorId) {
        return bookRepository.findByAuthorId(authorId)
                .stream()
                .map(this::convertToBookDetailDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "booksByGenre", key = "#genreId")
    public List<BookDetailDto> getBooksByGenre(String genreId) {
        return bookRepository.findByGenreId(genreId)
                .stream()
                .map(this::convertToBookDetailDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "booksByPublisher", key = "#publisherId")
    public List<BookDetailDto> getBooksByPublisher(Long publisherId) {
        return bookRepository.findByPublisherId(publisherId)
                .stream()
                .map(this::convertToBookDetailDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "booksWithLowStock")
    public List<BookDetailDto> getBooksWithLowStock() {
        return bookRepository.findBooksWithLowStock()
                .stream()
                .map(this::convertToBookDetailDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "outOfStockBooks")
    public List<BookDetailDto> getOutOfStockBooks() {
        return bookRepository.findOutOfStockBooks()
                .stream()
                .map(this::convertToBookDetailDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "booksWithDiscount")
    public List<BookDetailDto> getBooksWithDiscount() {
        return bookRepository.findBooksWithDiscount()
                .stream()
                .map(this::convertToBookDetailDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "booksByPublicationYear", key = "#year")
    public List<BookDetailDto> getBooksByPublicationYear(int year) {
        return bookRepository.findByPublicationYear(year)
                .stream()
                .map(this::convertToBookDetailDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "booksByLanguage", key = "#language")
    public List<BookDetailDto> getBooksByLanguage(String language) {
        return bookRepository.findByLanguage(language)
                .stream()
                .map(this::convertToBookDetailDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "booksByFormat", key = "#format")
    public List<BookDetailDto> getBooksByFormat(String format) {
        return bookRepository.findByFormat(format)
                .stream()
                .map(this::convertToBookDetailDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "booksByPriceRange", key = "#minPrice + '-' + #maxPrice")
    public List<BookDetailDto> getBooksByPriceRange(java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice) {
        return bookRepository.findByPriceBetween(minPrice, maxPrice)
                .stream()
                .map(this::convertToBookDetailDto)
                .collect(Collectors.toList());
    }

    // Inventory management methods
    @Transactional
    public void updateStock(String bookId, Integer quantity) {
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));
        book.addStock(quantity);
        bookRepository.save(book);
    }

    @Transactional
    public void reserveBook(String bookId, Integer quantity) {
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));
        book.reserve(quantity);
        bookRepository.save(book);
    }

    @Transactional
    public void releaseBook(String bookId, Integer quantity) {
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));
        book.release(quantity);
        bookRepository.save(book);
    }

    @Transactional(readOnly = true)
    public boolean isBookAvailable(String bookId, Integer quantity) {
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + bookId));
        return book.canReserve(quantity);
    }

    // Helper method to convert BookEntity to BookDetailDto
    private BookDetailDto convertToBookDetailDto(BookEntity book) {
        return BookDetailDto.builder()
                .id(book.getId())
                .title(book.getTitle())
                .subtitle(book.getSubtitle())
                .isbn(book.getIsbn())
                .isbn13(book.getIsbn13())
                .description(book.getDescription())
                .pageCount(book.getPageCount())
                .language(book.getLanguage())
                .publicationDate(book.getPublicationDate())
                .edition(book.getEdition())
                .format(book.getFormat())
                .price(book.getPrice())
                .originalPrice(book.getOriginalPrice())
                .discountedPrice(book.getDiscountedPrice())
                .discountPercentage(book.getDiscountPercentage())
                .stockQuantity(book.getStockQuantity())
                .availableQuantity(book.getAvailableQuantity())
                .reservedQuantity(book.getReservedQuantity())
                .reorderPoint(book.getReorderPoint())
                .maxStock(book.getMaxStock())
                .isLowStock(book.isLowStock())
                .isOutOfStock(book.isOutOfStock())
                .authors(book.getAuthors().stream()
                    .map(author -> BookDetailDto.AuthorDto.builder()
                        .id(author.getId())
                        .name(author.getName())
                        .biography(author.getBiography())
                        .country(author.getCountry())
                        .website(author.getWebsite())
                        .bookCount(author.getBookCount())
                        .build())
                    .collect(Collectors.toList()))
                .genres(book.getGenres().stream()
                    .map(genre -> BookDetailDto.GenreDto.builder()
                        .id(genre.getId())
                        .name(genre.getName())
                        .description(genre.getDescription())
                        .ageRating(genre.getAgeRating())
                        .bookCount(genre.getBookEntities() != null ? genre.getBookEntities().size() : 0)
                        .build())
                    .collect(Collectors.toList()))
                .publisher(book.getPublisher() != null ? BookDetailDto.PublisherDto.builder()
                    .id(book.getPublisher().getId())
                    .name(book.getPublisher().getName())
                    .description(book.getPublisher().getDescription())
                    .country(book.getPublisher().getCountry())
                    .city(book.getPublisher().getCity())
                    .website(book.getPublisher().getWebsite())
                    .foundedYear(book.getPublisher().getFoundedYear())
                    .bookCount(book.getPublisher().getBookCount())
                    .build() : null)
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .build();
    }

    // Standardized methods
    @Override
    public BookResponseDto createBook(BookRequestDto request) {
        BookEntity book = new BookEntity();
        book.setId(request.getId());
        book.setTitle(request.getTitle());
        book.setSubtitle(request.getSubtitle());
        book.setIsbn(request.getIsbn());
        book.setIsbn13(request.getIsbn13());
        book.setDescription(request.getDescription());
        book.setPageCount(request.getPageCount());
        book.setLanguage(request.getLanguage());
        book.setPublicationDate(request.getPublicationDate());
        book.setEdition(request.getEdition());
        book.setFormat(request.getFormat());
        book.setPrice(request.getPrice());
        book.setOriginalPrice(request.getOriginalPrice());
        book.setDiscountPercentage(request.getDiscountPercentage());
        book.setStockQuantity(request.getStockQuantity());
        // Set default values for missing fields
        book.setReservedQuantity(0);
        book.setReorderPoint(5);
        book.setMaxStock(100);
        
        BookEntity savedBook = create(book);
        return convertToResponseDto(savedBook);
    }

    @Override
    public Optional<BookResponseDto> findBookById(String id) {
        return getById(id).map(this::convertToResponseDto);
    }

    @Override
    public BookResponseDto updateBook(String id, BookRequestDto request) {
        BookEntity book = ValidationUtil.validateEntityExists(
            bookRepository.findById(id), id, "Book"
        );
        
        book.setTitle(request.getTitle());
        book.setSubtitle(request.getSubtitle());
        book.setIsbn(request.getIsbn());
        book.setIsbn13(request.getIsbn13());
        book.setDescription(request.getDescription());
        book.setPageCount(request.getPageCount());
        book.setLanguage(request.getLanguage());
        book.setPublicationDate(request.getPublicationDate());
        book.setEdition(request.getEdition());
        book.setFormat(request.getFormat());
        book.setPrice(request.getPrice());
        book.setOriginalPrice(request.getOriginalPrice());
        book.setDiscountPercentage(request.getDiscountPercentage());
        book.setStockQuantity(request.getStockQuantity());
        // Keep existing values for missing fields
        
        BookEntity updatedBook = update(id, book);
        return convertToResponseDto(updatedBook);
    }

    @Override
    public void deleteBook(String id) {
        delete(id);
    }

    @Override
    public Paginate<BookResponseDto> findBooks(String title, String author, String isbn, String genre, String publisher, int page, int size) {
        Paginate<BookModel> bookModels = getBook(title, author, null, genre, publisher, page, size);
        
        List<BookResponseDto> responseDtos = bookModels.getData().stream()
            .map(this::convertBookModelToResponseDto)
            .collect(Collectors.toList());
        
        return new Paginate<>(responseDtos, bookModels.getTotal());
    }

    @Override
    public Optional<BookResponseDto> findBookByIsbn(String isbn) {
        return getBookByIsbn(isbn).map(this::convertBookDetailToResponseDto);
    }

    @Override
    public List<BookResponseDto> findBooksByAuthor(Long authorId) {
        return getBooksByAuthor(authorId).stream()
            .map(this::convertBookDetailToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<BookResponseDto> findBooksByGenre(String genreId) {
        return getBooksByGenre(genreId).stream()
            .map(this::convertBookDetailToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<BookResponseDto> findBooksByPublisher(Long publisherId) {
        return getBooksByPublisher(publisherId).stream()
            .map(this::convertBookDetailToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<BookResponseDto> findBooksWithLowStock() {
        return getBooksWithLowStock().stream()
            .map(this::convertBookDetailToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<BookResponseDto> findBooksWithDiscount() {
        return getBooksWithDiscount().stream()
            .map(this::convertBookDetailToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<BookResponseDto> findBooksByPublicationYear(int year) {
        return getBooksByPublicationYear(year).stream()
            .map(this::convertBookDetailToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<BookResponseDto> findBooksByLanguage(String language) {
        return getBooksByLanguage(language).stream()
            .map(this::convertBookDetailToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<BookResponseDto> findBooksByFormat(String format) {
        return getBooksByFormat(format).stream()
            .map(this::convertBookDetailToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<BookResponseDto> findBooksByPriceRange(java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice) {
        return getBooksByPriceRange(minPrice, maxPrice).stream()
            .map(this::convertBookDetailToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public void processBookUpload(MultipartFile bookFile) throws IOException {
        uploadBook(bookFile);
    }

    // Helper methods for DTO conversion
    private BookResponseDto convertToResponseDto(BookEntity book) {
        return BookResponseDto.builder()
            .id(book.getId())
            .title(book.getTitle())
            .subtitle(book.getSubtitle())
            .isbn(book.getIsbn())
            .isbn13(book.getIsbn13())
            .description(book.getDescription())
            .pageCount(book.getPageCount())
            .language(book.getLanguage())
            .publicationDate(book.getPublicationDate())
            .edition(book.getEdition())
            .format(book.getFormat())
            .price(book.getPrice())
            .originalPrice(book.getOriginalPrice())
            .discountedPrice(book.getDiscountedPrice())
            .discountPercentage(book.getDiscountPercentage())
            .stockQuantity(book.getStockQuantity())
            .availableQuantity(book.getAvailableQuantity())
            .reservedQuantity(book.getReservedQuantity())
            .reorderPoint(book.getReorderPoint())
            .maxStock(book.getMaxStock())
            .isLowStock(book.isLowStock())
            .isOutOfStock(book.isOutOfStock())
            .createdAt(book.getCreatedAt())
            .updatedAt(book.getUpdatedAt())
            .build();
    }

    private BookResponseDto convertBookModelToResponseDto(BookModel bookModel) {
        return BookResponseDto.builder()
            .id(bookModel.getId())
            .title(bookModel.getName())
            .price(new java.math.BigDecimal(bookModel.getPrice()))
            .build();
    }

    private BookResponseDto convertBookDetailToResponseDto(BookDetailDto bookDetail) {
        return BookResponseDto.builder()
            .id(bookDetail.getId())
            .title(bookDetail.getTitle())
            .subtitle(bookDetail.getSubtitle())
            .isbn(bookDetail.getIsbn())
            .isbn13(bookDetail.getIsbn13())
            .description(bookDetail.getDescription())
            .pageCount(bookDetail.getPageCount())
            .language(bookDetail.getLanguage())
            .publicationDate(bookDetail.getPublicationDate())
            .edition(bookDetail.getEdition())
            .format(bookDetail.getFormat())
            .price(bookDetail.getPrice())
            .originalPrice(bookDetail.getOriginalPrice())
            .discountedPrice(bookDetail.getDiscountedPrice())
            .discountPercentage(bookDetail.getDiscountPercentage())
            .stockQuantity(bookDetail.getStockQuantity())
            .availableQuantity(bookDetail.getAvailableQuantity())
            .reservedQuantity(bookDetail.getReservedQuantity())
            .reorderPoint(bookDetail.getReorderPoint())
            .maxStock(bookDetail.getMaxStock())
            .isLowStock(bookDetail.isLowStock())
            .isOutOfStock(bookDetail.isOutOfStock())
            .createdAt(bookDetail.getCreatedAt())
            .updatedAt(bookDetail.getUpdatedAt())
            .build();
    }
}
