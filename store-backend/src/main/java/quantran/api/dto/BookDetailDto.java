package quantran.api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookDetailDto {
    private String id;
    private String title;
    private String subtitle;
    private String isbn;
    private String isbn13;
    private String description;
    private Integer pageCount;
    private String language;
    private LocalDate publicationDate;
    private String edition;
    private String format;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private BigDecimal discountedPrice;
    private Integer discountPercentage;
    
    // Inventory information
    private Integer stockQuantity;
    private Integer availableQuantity;
    private Integer reservedQuantity;
    private Integer reorderPoint;
    private Integer maxStock;
    private boolean isLowStock;
    private boolean isOutOfStock;
    
    // Relationships
    private List<AuthorDto> authors;
    private List<GenreDto> genres;
    private PublisherDto publisher;
    
    // Audit fields
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Helper methods
    public boolean hasDiscount() {
        return discountPercentage != null && discountPercentage > 0;
    }
    
    public boolean isAvailable() {
        return availableQuantity != null && availableQuantity > 0;
    }
    
    public String getAuthorNames() {
        if (authors == null || authors.isEmpty()) {
            return "Unknown Author";
        }
        return authors.stream()
                .map(AuthorDto::getName)
                .reduce((a, b) -> a + ", " + b)
                .orElse("Unknown Author");
    }
    
    public String getGenreNames() {
        if (genres == null || genres.isEmpty()) {
            return "Uncategorized";
        }
        return genres.stream()
                .map(GenreDto::getName)
                .reduce((a, b) -> a + ", " + b)
                .orElse("Uncategorized");
    }
    
    // Nested DTOs
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthorDto {
        private Long id;
        private String name;
        private String biography;
        private String country;
        private String website;
        private Integer bookCount;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GenreDto {
        private String id;
        private String name;
        private String description;
        private String ageRating;
        private Integer bookCount;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PublisherDto {
        private Long id;
        private String name;
        private String description;
        private String country;
        private String city;
        private String website;
        private Integer foundedYear;
        private Integer bookCount;
    }
} 