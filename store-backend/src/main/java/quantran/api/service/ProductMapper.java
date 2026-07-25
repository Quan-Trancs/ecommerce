package quantran.api.service;

import quantran.api.dto.ProductResponseDto;
import quantran.api.entity.ProductAttributeValueEntity;
import quantran.api.entity.ProductEntity;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class ProductMapper {

    private ProductMapper() {}

    public static ProductResponseDto toDto(ProductEntity product) {
        ProductResponseDto.ProductResponseDtoBuilder builder = ProductResponseDto.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .sku(product.getSku())
                .description(product.getDescription())
                .price(product.getPrice())
                .listPrice(product.getListPrice())
                .discountPercentage(product.getDiscountPercentage())
                .stockQuantity(product.getStockQuantity())
                .images(product.getImages() == null ? new ArrayList<>() : new ArrayList<>(product.getImages()))
                .tags(product.getTags() == null ? new ArrayList<>() : new ArrayList<>(product.getTags()))
                .avgRating(product.getAvgRating())
                .numReviews(product.getNumReviews())
                .numSales(product.getNumSales())
                .isPublished(product.getIsPublished())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt());

        if (product.getBrand() != null) {
            builder.brand(ProductResponseDto.BrandDto.builder()
                    .id(product.getBrand().getId())
                    .name(product.getBrand().getName())
                    .slug(product.getBrand().getSlug())
                    .build());
        }

        if (product.getCategories() != null) {
            builder.categories(product.getCategories().stream()
                    .map(c -> ProductResponseDto.CategorySummaryDto.builder()
                            .id(c.getId())
                            .name(c.getName())
                            .slug(c.getSlug())
                            .build())
                    .collect(Collectors.toList()));
        }

        Map<String, List<String>> attrs = new LinkedHashMap<>();
        if (product.getAttributes() != null) {
            for (ProductAttributeValueEntity value : product.getAttributes()) {
                if (value.getAttribute() == null) {
                    continue;
                }
                String code = value.getAttribute().getCode();
                attrs.computeIfAbsent(code, k -> new ArrayList<>()).add(value.displayValue());
            }
        }
        builder.attributes(attrs);
        return builder.build();
    }
}
