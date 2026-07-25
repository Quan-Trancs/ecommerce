package quantran.api.entity;

import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cart_items", indexes = {
        @Index(name = "idx_cart_items_cart", columnList = "cart_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemEntity {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private CartEntity cart;

    @Column(name = "client_id", nullable = false, length = 100)
    private String clientId;

    @Column(name = "product_id", nullable = false, length = 100)
    private String productId;

    @Column(nullable = false, length = 300)
    private String name;

    @Column(nullable = false, length = 320)
    private String slug;

    @Column(nullable = false, length = 1000)
    private String image;

    @Column(nullable = false, length = 200)
    @Builder.Default
    private String category = "General";

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "count_in_stock", nullable = false)
    @Builder.Default
    private Integer countInStock = 0;

    @Column(length = 100)
    private String color;

    @Column(length = 100)
    private String size;
}
