package quantran.api.entity;

import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "store_order_items", indexes = {
        @Index(name = "idx_order_item_order", columnList = "order_id"),
        @Index(name = "idx_order_item_product", columnList = "product_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private OrderEntity order;

    @Column(name = "product_id", nullable = false, length = 50)
    private String productId;

    @Column(nullable = false, length = 300)
    private String name;

    @Column(length = 320)
    private String slug;

    @Column(length = 500)
    private String image;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 50)
    private String color;

    @Column(length = 50)
    private String size;

    @Column(name = "is_shipped", nullable = false)
    @Builder.Default
    private Boolean isShipped = false;

    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;

    /** Units already refunded (restocked) on this line. */
    @Column(name = "refunded_quantity", nullable = false)
    @Builder.Default
    private Integer refundedQuantity = 0;

    @PrePersist
    @PreUpdate
    public void normalizeRefundedQuantity() {
        if (refundedQuantity == null) {
            refundedQuantity = 0;
        }
        if (isShipped == null) {
            isShipped = false;
        }
    }
}
