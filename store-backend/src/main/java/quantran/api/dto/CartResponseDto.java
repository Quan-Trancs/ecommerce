package quantran.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartResponseDto {

    private String id;
    private String userId;
    private String paymentMethod;
    private Integer deliveryDateIndex;
    private ShippingDto shipping;
    @Builder.Default
    private List<CartItemDto> items = new ArrayList<>();

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
    public static class CartItemDto {
        private String clientId;
        private String productId;
        private String name;
        private String slug;
        private String image;
        private String category;
        private BigDecimal price;
        private Integer quantity;
        private Integer countInStock;
        private String color;
        private String size;
    }
}
