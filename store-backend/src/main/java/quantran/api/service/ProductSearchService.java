package quantran.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import quantran.api.dto.ProductResponseDto;
import quantran.api.dto.ProductSearchResponseDto;
import quantran.api.entity.AttributeDefinitionEntity;
import quantran.api.entity.CategoryEntity;
import quantran.api.entity.ProductAttributeValueEntity;
import quantran.api.entity.ProductEntity;
import quantran.api.repository.AttributeDefinitionRepository;
import quantran.api.repository.CategoryRepository;
import quantran.api.repository.ProductRepository;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Amazon-style catalog search: filter products by criteria, then compute facet
 * buckets (category, brand, price ranges, dynamic attributes) from the filtered set.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductSearchService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final AttributeDefinitionRepository attributeDefinitionRepository;

    public ProductSearchResponseDto search(
            String q,
            String category,
            List<String> brands,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            List<String> tags,
            Map<String, List<String>> attributeFilters,
            String sort,
            int page,
            int size
    ) {
        List<ProductEntity> published = productRepository.findAllPublishedWithDetails();
        hydrateAttributes(published);
        hydrateVariants(published);

        Set<String> categoryIds = resolveCategoryIds(category);
        Set<String> brandSet = brands == null ? Collections.emptySet() :
                brands.stream().map(String::toLowerCase).collect(Collectors.toSet());
        Set<String> tagSet = tags == null ? Collections.emptySet() :
                tags.stream().map(String::toLowerCase).collect(Collectors.toSet());
        Map<String, Set<String>> attrFilters = normalizeAttributeFilters(attributeFilters);

        List<ProductEntity> filtered = published.stream()
                .filter(p -> matchesQuery(p, q))
                .filter(p -> matchesCategory(p, categoryIds))
                .filter(p -> matchesBrand(p, brandSet))
                .filter(p -> matchesPrice(p, minPrice, maxPrice))
                .filter(p -> matchesTags(p, tagSet))
                .filter(p -> matchesAttributes(p, attrFilters))
                .sorted(resolveSortComparator(sort))
                .collect(Collectors.toList());

        List<ProductSearchResponseDto.FacetDto> facets = buildFacets(
                published, filtered, categoryIds, brandSet, minPrice, maxPrice, attrFilters
        );

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int from = safePage * safeSize;
        List<ProductResponseDto> pageData = filtered.stream()
                .skip(from)
                .limit(safeSize)
                .map(ProductMapper::toDto)
                .collect(Collectors.toList());

        return ProductSearchResponseDto.builder()
                .data(pageData)
                .total(filtered.size())
                .page(safePage)
                .size(safeSize)
                .facets(facets)
                .build();
    }

    public Optional<ProductResponseDto> findByIdOrSlug(String idOrSlug) {
        return productRepository.findDetailedByIdOrSlug(idOrSlug)
                .map(product -> {
                    hydrateAttributes(Collections.singletonList(product));
                    hydrateVariants(Collections.singletonList(product));
                    return ProductMapper.toDto(product);
                });
    }

    public List<ProductResponseDto> findByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        List<ProductEntity> products = productRepository.findDetailedByIdIn(ids);
        hydrateAttributes(products);
        hydrateVariants(products);
        Map<String, ProductEntity> byId = products.stream()
                .collect(Collectors.toMap(ProductEntity::getId, p -> p, (a, b) -> a));
        // Preserve request order
        List<ProductResponseDto> result = new ArrayList<>();
        for (String id : ids) {
            ProductEntity product = byId.get(id);
            if (product != null) {
                result.add(ProductMapper.toDto(product));
            }
        }
        return result;
    }

    private Comparator<ProductEntity> resolveSortComparator(String sort) {
        String key = sort == null ? "featured" : sort.trim().toLowerCase();
        switch (key) {
            case "price-asc":
                return Comparator.comparing(ProductEntity::getPrice, Comparator.nullsLast(BigDecimal::compareTo))
                        .thenComparing(ProductEntity::getName, Comparator.nullsLast(String::compareToIgnoreCase));
            case "price-desc":
                return Comparator.comparing(ProductEntity::getPrice, Comparator.nullsLast(BigDecimal::compareTo)).reversed()
                        .thenComparing(ProductEntity::getName, Comparator.nullsLast(String::compareToIgnoreCase));
            case "rating":
                return Comparator
                        .comparing(ProductEntity::getAvgRating, Comparator.nullsLast(Double::compareTo))
                        .thenComparing(ProductEntity::getNumReviews, Comparator.nullsLast(Integer::compareTo))
                        .reversed()
                        .thenComparing(ProductEntity::getName, Comparator.nullsLast(String::compareToIgnoreCase));
            case "newest":
                return Comparator.comparing(ProductEntity::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed()
                        .thenComparing(ProductEntity::getName, Comparator.nullsLast(String::compareToIgnoreCase));
            case "featured":
            default:
                return Comparator.comparing(ProductEntity::getNumSales, Comparator.nullsLast(Integer::compareTo)).reversed()
                        .thenComparing(ProductEntity::getName, Comparator.nullsLast(String::compareToIgnoreCase));
        }
    }

    private void hydrateAttributes(List<ProductEntity> products) {
        if (products.isEmpty()) {
            return;
        }
        List<String> ids = products.stream().map(ProductEntity::getId).collect(Collectors.toList());
        List<ProductEntity> withAttrs = productRepository.fetchAttributesForIds(ids);
        Map<String, ProductEntity> byId = withAttrs.stream()
                .collect(Collectors.toMap(ProductEntity::getId, p -> p, (a, b) -> a));
        for (ProductEntity product : products) {
            ProductEntity loaded = byId.get(product.getId());
            if (loaded != null) {
                product.setAttributes(loaded.getAttributes());
            }
        }
    }

    private void hydrateVariants(List<ProductEntity> products) {
        if (products.isEmpty()) {
            return;
        }
        List<String> ids = products.stream().map(ProductEntity::getId).collect(Collectors.toList());
        List<ProductEntity> withVariants = productRepository.fetchVariantsForIds(ids);
        Map<String, ProductEntity> byId = withVariants.stream()
                .collect(Collectors.toMap(ProductEntity::getId, p -> p, (a, b) -> a));
        for (ProductEntity product : products) {
            ProductEntity loaded = byId.get(product.getId());
            if (loaded != null) {
                product.setVariants(loaded.getVariants());
            }
        }
    }

    private Set<String> resolveCategoryIds(String category) {
        if (category == null || category.trim().isEmpty() || "all".equalsIgnoreCase(category.trim())) {
            return Collections.emptySet();
        }
        Optional<CategoryEntity> found = categoryRepository.findByIdOrSlug(category.trim());
        if (!found.isPresent()) {
            // allow match by name
            return categoryRepository.findByIsActiveTrueOrderBySortOrderAscNameAsc().stream()
                    .filter(c -> c.getName().equalsIgnoreCase(category.trim())
                            || c.getSlug().equalsIgnoreCase(category.trim()))
                    .map(CategoryEntity::getId)
                    .collect(Collectors.toSet());
        }
        Set<String> ids = new HashSet<>();
        collectCategoryTreeIds(found.get(), ids);
        return ids;
    }

    private void collectCategoryTreeIds(CategoryEntity category, Set<String> ids) {
        ids.add(category.getId());
        if (category.getChildren() != null) {
            for (CategoryEntity child : category.getChildren()) {
                collectCategoryTreeIds(child, ids);
            }
        }
    }

    private boolean matchesQuery(ProductEntity product, String q) {
        if (q == null || q.trim().isEmpty()) {
            return true;
        }
        String needle = q.trim().toLowerCase();
        if (product.getName() != null && product.getName().toLowerCase().contains(needle)) {
            return true;
        }
        if (product.getDescription() != null && product.getDescription().toLowerCase().contains(needle)) {
            return true;
        }
        if (product.getBrand() != null && product.getBrand().getName().toLowerCase().contains(needle)) {
            return true;
        }
        if (product.getTags() != null) {
            for (String tag : product.getTags()) {
                if (tag.toLowerCase().contains(needle)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean matchesCategory(ProductEntity product, Set<String> categoryIds) {
        if (categoryIds.isEmpty()) {
            return true;
        }
        if (product.getCategories() == null) {
            return false;
        }
        return product.getCategories().stream().anyMatch(c -> categoryIds.contains(c.getId()));
    }

    private boolean matchesBrand(ProductEntity product, Set<String> brands) {
        if (brands.isEmpty()) {
            return true;
        }
        if (product.getBrand() == null) {
            return false;
        }
        String slug = product.getBrand().getSlug() == null ? "" : product.getBrand().getSlug().toLowerCase();
        String name = product.getBrand().getName() == null ? "" : product.getBrand().getName().toLowerCase();
        return brands.contains(slug) || brands.contains(name);
    }

    private boolean matchesPrice(ProductEntity product, BigDecimal minPrice, BigDecimal maxPrice) {
        BigDecimal price = product.getPrice();
        if (price == null) {
            return false;
        }
        if (minPrice != null && price.compareTo(minPrice) < 0) {
            return false;
        }
        if (maxPrice != null && price.compareTo(maxPrice) > 0) {
            return false;
        }
        return true;
    }

    private boolean matchesTags(ProductEntity product, Set<String> tags) {
        if (tags.isEmpty()) {
            return true;
        }
        if (product.getTags() == null) {
            return false;
        }
        Set<String> productTags = product.getTags().stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        return productTags.containsAll(tags) || tags.stream().anyMatch(productTags::contains);
    }

    private boolean matchesAttributes(ProductEntity product, Map<String, Set<String>> attrFilters) {
        if (attrFilters.isEmpty()) {
            return true;
        }
        Map<String, Set<String>> productAttrs = attributeMap(product);
        for (Map.Entry<String, Set<String>> entry : attrFilters.entrySet()) {
            Set<String> values = productAttrs.getOrDefault(entry.getKey(), Collections.emptySet());
            boolean anyMatch = entry.getValue().stream()
                    .anyMatch(v -> values.stream().anyMatch(pv -> pv.equalsIgnoreCase(v)));
            if (!anyMatch) {
                return false;
            }
        }
        return true;
    }

    private Map<String, Set<String>> attributeMap(ProductEntity product) {
        Map<String, Set<String>> map = new HashMap<>();
        if (product.getAttributes() == null) {
            return map;
        }
        for (ProductAttributeValueEntity value : product.getAttributes()) {
            if (value.getAttribute() == null) {
                continue;
            }
            map.computeIfAbsent(value.getAttribute().getCode().toLowerCase(), k -> new HashSet<>())
                    .add(value.displayValue().toLowerCase());
        }
        return map;
    }

    private Map<String, Set<String>> normalizeAttributeFilters(Map<String, List<String>> filters) {
        Map<String, Set<String>> normalized = new HashMap<>();
        if (filters == null) {
            return normalized;
        }
        for (Map.Entry<String, List<String>> entry : filters.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isEmpty()) {
                continue;
            }
            normalized.put(
                    entry.getKey().toLowerCase(),
                    entry.getValue().stream().map(String::toLowerCase).collect(Collectors.toSet())
            );
        }
        return normalized;
    }

    private List<ProductSearchResponseDto.FacetDto> buildFacets(
            List<ProductEntity> allPublished,
            List<ProductEntity> filtered,
            Set<String> selectedCategories,
            Set<String> selectedBrands,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Map<String, Set<String>> selectedAttrs
    ) {
        List<ProductSearchResponseDto.FacetDto> facets = new ArrayList<>();

        // Category facet from full published catalog (Amazon shows taxonomy with counts in context)
        Map<String, Long> categoryCounts = new LinkedHashMap<>();
        for (ProductEntity product : filtered) {
            if (product.getCategories() == null) continue;
            for (CategoryEntity category : product.getCategories()) {
                categoryCounts.merge(category.getSlug() + "|" + category.getName(), 1L, Long::sum);
            }
        }
        List<ProductSearchResponseDto.FacetValueDto> categoryValues = categoryCounts.entrySet().stream()
                .map(e -> {
                    String[] parts = e.getKey().split("\\|", 2);
                    String slug = parts[0];
                    String name = parts.length > 1 ? parts[1] : slug;
                    return ProductSearchResponseDto.FacetValueDto.builder()
                            .value(slug)
                            .label(name)
                            .count(e.getValue())
                            .selected(selectedCategories.contains(slug) || selectedCategories.stream().anyMatch(id -> id.equalsIgnoreCase(slug)))
                            .build();
                })
                .sorted(Comparator.comparing(ProductSearchResponseDto.FacetValueDto::getCount).reversed())
                .collect(Collectors.toList());
        facets.add(ProductSearchResponseDto.FacetDto.builder()
                .key("category")
                .label("Category")
                .type("CATEGORY")
                .values(categoryValues)
                .build());

        // Brand facet
        Map<String, Long> brandCounts = new LinkedHashMap<>();
        Map<String, String> brandLabels = new HashMap<>();
        for (ProductEntity product : filtered) {
            if (product.getBrand() == null) continue;
            String key = product.getBrand().getSlug();
            brandCounts.merge(key, 1L, Long::sum);
            brandLabels.put(key, product.getBrand().getName());
        }
        List<ProductSearchResponseDto.FacetValueDto> brandValues = brandCounts.entrySet().stream()
                .map(e -> ProductSearchResponseDto.FacetValueDto.builder()
                        .value(e.getKey())
                        .label(brandLabels.get(e.getKey()))
                        .count(e.getValue())
                        .selected(selectedBrands.contains(e.getKey().toLowerCase())
                                || selectedBrands.contains(brandLabels.get(e.getKey()).toLowerCase()))
                        .build())
                .sorted(Comparator.comparing(ProductSearchResponseDto.FacetValueDto::getCount).reversed())
                .collect(Collectors.toList());
        facets.add(ProductSearchResponseDto.FacetDto.builder()
                .key("brand")
                .label("Brand")
                .type("BRAND")
                .values(brandValues)
                .build());

        // Price buckets
        BigDecimal[][] buckets = new BigDecimal[][]{
                {BigDecimal.ZERO, new BigDecimal("25")},
                {new BigDecimal("25"), new BigDecimal("50")},
                {new BigDecimal("50"), new BigDecimal("100")},
                {new BigDecimal("100"), new BigDecimal("200")},
                {new BigDecimal("200"), null}
        };
        List<ProductSearchResponseDto.FacetValueDto> priceValues = new ArrayList<>();
        for (BigDecimal[] bucket : buckets) {
            BigDecimal min = bucket[0];
            BigDecimal max = bucket[1];
            long count = filtered.stream().filter(p -> matchesPrice(p, min, max)).count();
            String label = max == null
                    ? "$" + min.toPlainString() + "+"
                    : "$" + min.toPlainString() + " - $" + max.toPlainString();
            String value = max == null ? min.toPlainString() + "-" : min.toPlainString() + "-" + max.toPlainString();
            boolean selected = Objects.equals(minPrice, min) && Objects.equals(maxPrice, max);
            priceValues.add(ProductSearchResponseDto.FacetValueDto.builder()
                    .value(value)
                    .label(label)
                    .count(count)
                    .min(min)
                    .max(max)
                    .selected(selected)
                    .build());
        }
        facets.add(ProductSearchResponseDto.FacetDto.builder()
                .key("price")
                .label("Price")
                .type("PRICE")
                .values(priceValues)
                .build());

        // Dynamic attribute facets (only filterable definitions present on results)
        List<AttributeDefinitionEntity> definitions = attributeDefinitionRepository
                .findByIsFilterableTrueOrderBySortOrderAscNameAsc();
        for (AttributeDefinitionEntity definition : definitions) {
            Map<String, Long> valueCounts = new LinkedHashMap<>();
            for (ProductEntity product : filtered) {
                if (product.getAttributes() == null) continue;
                for (ProductAttributeValueEntity attr : product.getAttributes()) {
                    if (attr.getAttribute() == null) continue;
                    if (!definition.getCode().equalsIgnoreCase(attr.getAttribute().getCode())) continue;
                    String display = attr.displayValue();
                    if (!display.isEmpty()) {
                        valueCounts.merge(display, 1L, Long::sum);
                    }
                }
            }
            if (valueCounts.isEmpty()) {
                continue;
            }
            Set<String> selected = selectedAttrs.getOrDefault(definition.getCode().toLowerCase(), Collections.emptySet());
            List<ProductSearchResponseDto.FacetValueDto> values = valueCounts.entrySet().stream()
                    .map(e -> ProductSearchResponseDto.FacetValueDto.builder()
                            .value(e.getKey())
                            .label(e.getKey())
                            .count(e.getValue())
                            .selected(selected.contains(e.getKey().toLowerCase()))
                            .build())
                    .sorted(Comparator.comparing(ProductSearchResponseDto.FacetValueDto::getCount).reversed())
                    .collect(Collectors.toList());
            facets.add(ProductSearchResponseDto.FacetDto.builder()
                    .key(definition.getCode())
                    .label(definition.getName())
                    .type("ATTRIBUTE")
                    .values(values)
                    .build());
        }

        // Suppress unused warning for allPublished (kept for future "browse-all facets" mode)
        if (allPublished.isEmpty()) {
            return facets;
        }
        return facets;
    }
}
