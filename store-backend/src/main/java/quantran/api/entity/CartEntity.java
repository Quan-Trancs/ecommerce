package quantran.api.entity;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carts", indexes = {
        @Index(name = "idx_carts_user", columnList = "user_id", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 100, unique = true)
    private String userId;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "delivery_date_index")
    private Integer deliveryDateIndex;

    @Embedded
    private ShippingEmbed shipping;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<CartItemEntity> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShippingEmbed {
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
