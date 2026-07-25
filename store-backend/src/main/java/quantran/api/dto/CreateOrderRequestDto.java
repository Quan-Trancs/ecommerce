package quantran.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequestDto {

    private String paymentMethod;
    private BigDecimal itemsPrice;
    private BigDecimal shippingPrice;
    private BigDecimal taxPrice;
    private BigDecimal totalPrice;
    private ShippingDto shipping;
    @Builder.Default
    private List<OrderItemRequestDto> items = new ArrayList<>();

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
    public static class OrderItemRequestDto {
        private String productId;
        private String name;
        private String slug;
        private String image;
        private BigDecimal price;
        private Integer quantity;
        private String color;
        private String size;
    }
}
