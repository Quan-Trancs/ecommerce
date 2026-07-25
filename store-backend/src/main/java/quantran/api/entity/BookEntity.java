package quantran.api.entity;

import quantran.api.model.BookModel;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import javax.validation.constraints.Size;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "books", indexes = {
    @Index(name = "idx_book_title", columnList = "title"),
    @Index(name = "idx_book_isbn", columnList = "isbn"),
    @Index(name = "idx_book_publication_date", columnList = "publication_date"),
    @Index(name = "idx_book_publisher", columnList = "publisher_id"),
    @Index(name = "idx_book_price", columnList = "price"), // For price range queries
    @Index(name = "idx_book_language", columnList = "language"), // For language filter
    @Index(name = "idx_book_format", columnList = "format"), // For format filter
    @Index(name = "idx_book_stock_quantity", columnList = "stock_quantity"), // For stock queries
    @Index(name = "idx_book_discount_percentage", columnList = "discount_percentage") // For discount queries
})
public class BookEntity {
    @Id
    @Column(name = "id", length = 50)
    @NotBlank(message = "Book ID is required")
    private String id;
    
    @Column(name = "title", nullable = false, length = 500)
    @NotBlank(message = "Book title is required")
    @Size(min = 1, max = 500, message = "Title must be between 1 and 500 characters")
    private String title;
    
    @Column(name = "subtitle", length = 500)
    private String subtitle;
    
    @Column(name = "isbn", length = 20, unique = true)
    private String isbn;
    
    @Column(name = "isbn13", length = 20, unique = true)
    private String isbn13;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "page_count")
    private Integer pageCount;
    
    @Column(name = "language", length = 10)
    private String language = "en";
    
    @Column(name = "publication_date")
    private LocalDate publicationDate;
    
    @Column(name = "edition", length = 50)
    private String edition;
    
    @Column(name = "format", length = 50)
    private String format = "Paperback"; // Hardcover, Paperback, E-book, etc.
    
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;
    

    
    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;
    
    @Column(name = "discount_percentage")
    private Integer discountPercentage = 0;
    
    // Inventory fields (embedded)
    @Column(name = "stock_quantity", nullable = false)
    @NotNull(message = "Stock quantity is required")
    private Integer stockQuantity = 0;
    
    @Column(name = "reserved_quantity", nullable = false)
    private Integer reservedQuantity = 0;
    
    @Column(name = "reorder_point", nullable = false)
    private Integer reorderPoint = 5;
    
    @Column(name = "max_stock", nullable = false)
    private Integer maxStock = 100;
    
    // Relationships
    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "book_authors",
        joinColumns = @JoinColumn(name = "book_id"),
        inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    private Set<AuthorEntity> authors = new HashSet<>();
    
    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "book_genres",
        joinColumns = @JoinColumn(name = "book_id"),
        inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    private Set<BookTypeEntity> genres = new HashSet<>();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publisher_id")
    private PublisherEntity publisher;
    
    // Audit fields
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Version
    @Column(name = "version")
    private Long version;

    public BookEntity() {
        this.createdAt = LocalDateTime.now();
    }
    
    public BookEntity(BookModel bookModel) {
        this();
        this.id = bookModel.getId();
        this.title = bookModel.getName();
        this.price = parsePrice(bookModel.getPrice());
        // Note: Authors, genres, and publisher would need to be set separately
    }
    
    public BookEntity(String id, String title, String subtitle, String isbn, 
                     String description, Integer pageCount, String language, 
                     LocalDate publicationDate, String edition, String format, 
                     BigDecimal price, PublisherEntity publisher) {
        this();
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.isbn = isbn;
        this.description = description;
        this.pageCount = pageCount;
        this.language = language;
        this.publicationDate = publicationDate;
        this.edition = edition;
        this.format = format;
        this.price = price;
        this.publisher = publisher;
    }

    private BigDecimal parsePrice(String priceString) {
        try {
            // Extract numeric value from price string (e.g., "1000VND" -> 1000)
            String numericPart = priceString.replaceAll("(?i)(vnd|usd|eur)$", "").trim();
            BigDecimal price = new BigDecimal(numericPart);
            
            // Always store in USD - frontend will handle currency conversion
            return price;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid price format: " + priceString);
        }
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public String getIsbn() {
        return isbn;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }

    public String getIsbn13() {
        return isbn13;
    }

    public void setIsbn13(String isbn13) {
        this.isbn13 = isbn13;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getPageCount() {
        return pageCount;
    }

    public void setPageCount(Integer pageCount) {
        this.pageCount = pageCount;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public LocalDate getPublicationDate() {
        return publicationDate;
    }

    public void setPublicationDate(LocalDate publicationDate) {
        this.publicationDate = publicationDate;
    }

    public String getEdition() {
        return edition;
    }

    public void setEdition(String edition) {
        this.edition = edition;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }
    


    public BigDecimal getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(BigDecimal originalPrice) {
        this.originalPrice = originalPrice;
    }

    public Integer getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(Integer discountPercentage) {
        this.discountPercentage = discountPercentage;
    }

    public Set<AuthorEntity> getAuthors() {
        return authors;
    }

    public void setAuthors(Set<AuthorEntity> authors) {
        this.authors = authors;
    }

    public Set<BookTypeEntity> getGenres() {
        return genres;
    }

    public void setGenres(Set<BookTypeEntity> genres) {
        this.genres = genres;
    }

    public PublisherEntity getPublisher() {
        return publisher;
    }

    public void setPublisher(PublisherEntity publisher) {
        this.publisher = publisher;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public Long getVersion() {
        return version;
    }
    
    // Inventory methods
    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public Integer getReservedQuantity() {
        return reservedQuantity;
    }

    public void setReservedQuantity(Integer reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
    }

    public Integer getReorderPoint() {
        return reorderPoint;
    }

    public void setReorderPoint(Integer reorderPoint) {
        this.reorderPoint = reorderPoint;
    }

    public Integer getMaxStock() {
        return maxStock;
    }

    public void setMaxStock(Integer maxStock) {
        this.maxStock = maxStock;
    }
    
    public Integer getAvailableQuantity() {
        return Math.max(0, stockQuantity - reservedQuantity);
    }
    
    public boolean isLowStock() {
        return getAvailableQuantity() <= reorderPoint;
    }
    
    public boolean isOutOfStock() {
        return getAvailableQuantity() <= 0;
    }
    
    public boolean canReserve(Integer requestedQuantity) {
        return getAvailableQuantity() >= requestedQuantity;
    }
    
    public void reserve(Integer quantity) {
        if (canReserve(quantity)) {
            this.reservedQuantity += quantity;
        } else {
            throw new IllegalStateException("Cannot reserve " + quantity + " items. Available: " + getAvailableQuantity());
        }
    }
    
    public void release(Integer quantity) {
        this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
    }
    
    public void addStock(Integer quantity) {
        this.stockQuantity = Math.min(maxStock, this.stockQuantity + quantity);
    }
    
    public void removeStock(Integer quantity) {
        this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
    }
    
    // Helper methods
    public String getAuthorNames() {
        if (authors == null || authors.isEmpty()) {
            return "Unknown Author";
        }
        return authors.stream()
                .map(AuthorEntity::getName)
                .reduce((a, b) -> a + ", " + b)
                .orElse("Unknown Author");
    }
    
    public String getGenreNames() {
        if (genres == null || genres.isEmpty()) {
            return "Uncategorized";
        }
        return genres.stream()
                .map(BookTypeEntity::getName)
                .reduce((a, b) -> a + ", " + b)
                .orElse("Uncategorized");
    }
    
    public BigDecimal getDiscountedPrice() {
        if (discountPercentage == null || discountPercentage <= 0) {
            return price;
        }
        return price.multiply(BigDecimal.valueOf(100 - discountPercentage))
                   .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
}
