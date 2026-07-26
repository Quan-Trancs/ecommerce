package quantran.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponseDto {

    private String id;
    private String userId;
    private String status;
    private String paymentMethod;
    private BigDecimal itemsPrice;
    private BigDecimal shippingPrice;
    private BigDecimal taxPrice;
    private BigDecimal totalPrice;
    private ShippingDto shipping;
    private LocalDateTime expectedDeliveryDate;
    private Boolean isPaid;
    private LocalDateTime paidAt;
    private String paymentResultJson;
    @Builder.Default
    private List<OrderItemDto> items = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShippingDto {
        private String fullName;
        private String address;
        private String city;
        private String postalCode;
        private String country;
        private String phone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemDto {
        private Long id;
        private String productId;
        private String name;
        private String slug;
        private String image;
        private BigDecimal price;
        private Integer quantity;
        private String color;
        private String size;
        private Boolean isShipped;
        private LocalDateTime shippedAt;
        private String shippingCarrier;
        private String trackingNumber;
        private Integer refundedQuantity;
    }
}
