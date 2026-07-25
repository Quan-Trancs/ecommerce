package quantran.api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for book summary information used in optimized queries.
 * This projection reduces data transfer by fetching only essential fields.
 */
@Data
@NoArgsConstructor
public class BookSummaryDto {
    private String id;
    private String title;
    private BigDecimal price;
    private Integer stockQuantity;
    private String authorName;
    private String genreName;
    private String publisherName;
    
    /**
     * Constructor for JPQL projection query
     */
    public BookSummaryDto(String id, String title, BigDecimal price, 
                         Integer stockQuantity, String authorName, 
                         String genreName, String publisherName) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.authorName = authorName;
        this.genreName = genreName;
        this.publisherName = publisherName;
    }
    
    /**
     * Get formatted price string
     */
    public String getFormattedPrice() {
        return price != null ? String.format("$%.2f", price) : "N/A";
    }
    
    /**
     * Get stock status
     */
    public String getStockStatus() {
        if (stockQuantity == null) return "Unknown";
        if (stockQuantity <= 0) return "Out of Stock";
        if (stockQuantity <= 5) return "Low Stock";
        return "In Stock";
    }
    
    /**
     * Check if book is available
     */
    public boolean isAvailable() {
        return stockQuantity != null && stockQuantity > 0;
    }
} 