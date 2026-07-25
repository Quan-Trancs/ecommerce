package quantran.api.entity;

import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "store_orders", indexes = {
        @Index(name = "idx_order_user", columnList = "user_id"),
        @Index(name = "idx_order_status", columnList = "status"),
        @Index(name = "idx_order_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderEntity {

    public enum Status {
        PENDING,
        PAID,
        SHIPPED,
        CANCELLED
    }

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 100)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "items_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal itemsPrice;

    @Column(name = "shipping_price", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal shippingPrice = BigDecimal.ZERO;

    @Column(name = "tax_price", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal taxPrice = BigDecimal.ZERO;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Embedded
    private ShippingAddress shipping;

    @Column(name = "expected_delivery_date")
    private LocalDateTime expectedDeliveryDate;

    @Column(name = "is_paid", nullable = false)
    @Builder.Default
    private Boolean isPaid = false;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "payment_result_json", columnDefinition = "TEXT")
    private String paymentResultJson;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OrderItemEntity> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = Status.PENDING;
        }
        if (isPaid == null) {
            isPaid = false;
        }
        if (shippingPrice == null) {
            shippingPrice = BigDecimal.ZERO;
        }
        if (taxPrice == null) {
            taxPrice = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShippingAddress {
        @Column(name = "shipping_full_name", length = 200)
        private String fullName;

        @Column(name = "shipping_address", length = 500)
        private String address;

        @Column(name = "shipping_city", length = 100)
        private String city;

        @Column(name = "shipping_postal_code", length = 30)
        private String postalCode;

        @Column(name = "shipping_country", length = 100)
        private String country;

        @Column(name = "shipping_phone", length = 50)
        private String phone;
    }
}
