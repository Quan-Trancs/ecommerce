package quantran.api.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.persistence.*;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_inventory", indexes = {
    @Index(name = "idx_inventory_book", columnList = "book_id"),
    @Index(name = "idx_inventory_low_stock", columnList = "quantity")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookInventory {
    
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "book_id", nullable = false, length = 50)
    @NotNull(message = "Book ID is required")
    private String bookId;
    
    @Column(name = "quantity", nullable = false)
    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;
    
    @Column(name = "reserved_quantity", nullable = false)
    @Min(value = 0, message = "Reserved quantity cannot be negative")
    @Builder.Default
    private Integer reservedQuantity = 0;
    
    @Column(name = "reorder_point", nullable = false)
    @Min(value = 0, message = "Reorder point cannot be negative")
    @Builder.Default
    private Integer reorderPoint = 5;
    
    @Column(name = "max_stock", nullable = false)
    @Min(value = 1, message = "Max stock must be at least 1")
    @Builder.Default
    private Integer maxStock = 100;
    
    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (lastUpdated == null) {
            lastUpdated = LocalDateTime.now();
        }
        if (reservedQuantity == null) {
            reservedQuantity = 0;
        }
        if (reorderPoint == null) {
            reorderPoint = 5;
        }
        if (maxStock == null) {
            maxStock = 100;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
    
    // Helper methods
    public Integer getAvailableQuantity() {
        return Math.max(0, quantity - reservedQuantity);
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
        this.quantity = Math.min(maxStock, this.quantity + quantity);
    }
    
    public void removeStock(Integer quantity) {
        this.quantity = Math.max(0, this.quantity - quantity);
    }
} 