package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quantran.api.dto.ProductResponseDto;
import quantran.api.dto.ProductSearchResponseDto;
import quantran.api.service.ProductSearchService;

import java.math.BigDecimal;
import java.util.*;

/**
 * Commercial catalog API with Amazon-style faceted search.
 *
 * Example:
 * GET /v1/products?q=shoe&category=shoes&brand=nike&color=Black&size=10&minPrice=25&maxPrice=100
 */
@RestController
@RequestMapping("/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductSearchService productSearchService;

    private static final Set<String> RESERVED_PARAMS = new HashSet<>(Arrays.asList(
            "q", "category", "brand", "minPrice", "maxPrice", "tag", "tags", "page", "size"
    ));

    @GetMapping
    public ResponseEntity<ProductSearchResponseDto> searchProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) List<String> brand,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) List<String> tag,
            @RequestParam(required = false) String price,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam Map<String, String> allParams
    ) {
        if (price != null && !price.isEmpty() && minPrice == null && maxPrice == null) {
            String[] parts = price.split("-", -1);
            if (parts.length >= 1 && !parts[0].isEmpty()) {
                minPrice = new BigDecimal(parts[0]);
            }
            if (parts.length >= 2 && !parts[1].isEmpty()) {
                maxPrice = new BigDecimal(parts[1]);
            }
        }

        Map<String, List<String>> attributeFilters = new HashMap<>();
        for (Map.Entry<String, String> entry : allParams.entrySet()) {
            String key = entry.getKey();
            if (RESERVED_PARAMS.contains(key) || "price".equals(key)) {
                continue;
            }
            // Support multi-value: color=Black&color=White via repeated params isn't in Map;
            // also support color=Black,White
            List<String> values = new ArrayList<>();
            for (String part : entry.getValue().split(",")) {
                if (!part.trim().isEmpty()) {
                    values.add(part.trim());
                }
            }
            if (!values.isEmpty()) {
                attributeFilters.put(key, values);
            }
        }

        // Merge repeated brand/tag from Spring list params already handled.
        ProductSearchResponseDto response = productSearchService.search(
                q,
                category,
                brand,
                minPrice,
                maxPrice,
                tag,
                attributeFilters,
                page,
                size
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{idOrSlug}")
    public ResponseEntity<ProductResponseDto> getProduct(@PathVariable String idOrSlug) {
        return productSearchService.findByIdOrSlug(idOrSlug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
