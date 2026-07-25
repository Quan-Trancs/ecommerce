package quantran.api.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpsertCartRequestDto {

    private String paymentMethod;
    private Integer deliveryDateIndex;
    private CartResponseDto.ShippingDto shipping;
    @Builder.Default
    private List<CartResponseDto.CartItemDto> items = new ArrayList<>();
}
