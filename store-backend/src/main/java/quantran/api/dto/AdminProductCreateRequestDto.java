package quantran.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProductCreateRequestDto {
    private String id;
    private String name;
    private String slug;
    private String sku;
    private String description;
    private BigDecimal price;
    private BigDecimal listPrice;
    private Integer stockQuantity;
    private Long brandId;
    @Builder.Default
    private List<String> categoryIds = new ArrayList<>();
    @Builder.Default
    private List<String> images = new ArrayList<>();
    @Builder.Default
    private List<String> tags = new ArrayList<>();
    private Boolean isPublished;
}
