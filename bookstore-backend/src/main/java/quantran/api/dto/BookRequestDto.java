package quantran.api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookRequestDto {
    
    @NotBlank(message = "Book ID is required")
    @Pattern(regexp = "^[A-Z0-9]{3,20}$", message = "Book ID must be 3-20 characters, uppercase letters and numbers only")
    private String id;
    
    @NotBlank(message = "Book title is required")
    @Size(min = 1, max = 500, message = "Title must be between 1 and 500 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-\\.,'\"()&]+$", message = "Title contains invalid characters")
    private String title;
    
    @Size(max = 500, message = "Subtitle must not exceed 500 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-\\.,'\"()&]*$", message = "Subtitle contains invalid characters")
    private String subtitle;
    
    @Pattern(regexp = "^(?:\\d{10}|\\d{13})$", message = "ISBN must be 10 or 13 digits")
    private String isbn;
    
    @Pattern(regexp = "^\\d{3}-\\d{10}$", message = "ISBN-13 must be in format XXX-XXXXXXXXXX")
    private String isbn13;
    
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-\\.,'\"()&!?;:]*$", message = "Description contains invalid characters")
    private String description;
    
    @Min(value = 1, message = "Page count must be at least 1")
    @Max(value = 10000, message = "Page count must not exceed 10000")
    private Integer pageCount;
    
    @Pattern(regexp = "^[a-z]{2,3}$", message = "Language must be 2-3 letter ISO code")
    private String language;
    
    @PastOrPresent(message = "Publication date cannot be in the future")
    private LocalDate publicationDate;
    
    @Size(max = 50, message = "Edition must not exceed 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-\\.,'\"()]*$", message = "Edition contains invalid characters")
    private String edition;
    
    @Pattern(regexp = "^(Hardcover|Paperback|E-book|Audiobook|Digital|PDF)$", message = "Format must be one of: Hardcover, Paperback, E-book, Audiobook, Digital, PDF")
    private String format;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
    @DecimalMax(value = "999999.99", message = "Price must not exceed 999,999.99")
    @Digits(integer = 6, fraction = 2, message = "Price must have at most 6 digits before decimal and 2 after")
    private BigDecimal price;
    
    @DecimalMin(value = "0.01", message = "Original price must be at least 0.01")
    @DecimalMax(value = "999999.99", message = "Original price must not exceed 999,999.99")
    @Digits(integer = 6, fraction = 2, message = "Original price must have at most 6 digits before decimal and 2 after")
    private BigDecimal originalPrice;
    
    @Min(value = 0, message = "Stock quantity cannot be negative")
    @Max(value = 100000, message = "Stock quantity must not exceed 100,000")
    private Integer stockQuantity;
    
    @Min(value = 0, message = "Discount percentage cannot be negative")
    @Max(value = 100, message = "Discount percentage cannot exceed 100")
    private Integer discountPercentage;
    
    @NotBlank(message = "Author is required")
    @Size(min = 1, max = 255, message = "Author name must be between 1 and 255 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Author name contains invalid characters")
    private String author;
    
    @NotBlank(message = "Book type/genre is required")
    @Size(min = 1, max = 100, message = "Book type must be between 1 and 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-]+$", message = "Book type contains invalid characters")
    private String bookType;
    
    @Min(value = 1, message = "Publisher ID must be at least 1")
    private Long publisherId;
    
    // Custom validation methods
    public boolean isValidPriceRange() {
        if (price == null || originalPrice == null) {
            return true; // Let individual validations handle null checks
        }
        return price.compareTo(originalPrice) <= 0;
    }
    
    public boolean isValidDiscount() {
        if (discountPercentage == null || originalPrice == null || price == null) {
            return true; // Let individual validations handle null checks
        }
        if (discountPercentage == 0) {
            return price.compareTo(originalPrice) == 0;
        }
        BigDecimal expectedDiscountedPrice = originalPrice.multiply(
            BigDecimal.valueOf(100 - discountPercentage)
        ).divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);
        return price.compareTo(expectedDiscountedPrice) == 0;
    }
} 