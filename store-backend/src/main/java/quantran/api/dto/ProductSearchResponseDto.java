package quantran.api.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSearchResponseDto {
    @Builder.Default
    private List<ProductResponseDto> data = new ArrayList<>();
    private int total;
    private int page;
    private int size;
    @Builder.Default
    private List<FacetDto> facets = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FacetDto {
        /** Query param key: category, brand, price, or attribute code */
        private String key;
        private String label;
        /** CATEGORY | BRAND | PRICE | ATTRIBUTE */
        private String type;
        @Builder.Default
        private List<FacetValueDto> values = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FacetValueDto {
        private String value;
        private String label;
        private long count;
        private Boolean selected;
        private BigDecimal min;
        private BigDecimal max;
    }
}
