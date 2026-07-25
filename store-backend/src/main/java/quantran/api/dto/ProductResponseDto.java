package quantran.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponseDto {
    private String id;
    private String name;
    private String slug;
    private String sku;
    private String description;
    private BigDecimal price;
    private BigDecimal listPrice;
    private Integer discountPercentage;
    private Integer stockQuantity;
    private BrandDto brand;
    @Builder.Default
    private List<CategorySummaryDto> categories = new ArrayList<>();
    @Builder.Default
    private List<String> images = new ArrayList<>();
    @Builder.Default
    private List<String> tags = new ArrayList<>();
    /** attribute code -> display value(s) */
    @Builder.Default
    private Map<String, List<String>> attributes = new HashMap<>();
    @Builder.Default
    private List<VariantDto> variants = new ArrayList<>();
    private Double avgRating;
    private Integer numReviews;
    private Integer numSales;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BrandDto {
        private Long id;
        private String name;
        private String slug;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategorySummaryDto {
        private String id;
        private String name;
        private String slug;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VariantDto {
        private Long id;
        private String sku;
        private String color;
        private String size;
        private BigDecimal price;
        private BigDecimal listPrice;
        private Integer stockQuantity;
    }
}
