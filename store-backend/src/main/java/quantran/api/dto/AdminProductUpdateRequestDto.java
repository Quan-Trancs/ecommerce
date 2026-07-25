package quantran.api.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProductUpdateRequestDto {
    private BigDecimal price;
    private Integer stockQuantity;
    private Boolean isPublished;
    private java.util.List<String> images;
}
