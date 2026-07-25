package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quantran.api.dto.AdminProductCreateRequestDto;
import quantran.api.dto.AdminProductUpdateRequestDto;
import quantran.api.dto.ProductResponseDto;
import quantran.api.exception.UnauthorizedException;
import quantran.api.repository.ProductRepository;
import quantran.api.service.ProductAdminService;
import quantran.api.service.ProductMapper;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/admin/products")
@RequiredArgsConstructor
public class ProductAdminController {

    private final ProductAdminService productAdminService;
    private final ProductRepository productRepository;

    @Value("${app.admin.api-key:dev-admin-key}")
    private String adminApiKey;

    @GetMapping
    public ResponseEntity<List<ProductResponseDto>> list(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        requireAdminKey(adminKey);
        List<ProductResponseDto> products = productRepository.findAll().stream()
                .map(ProductMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(products);
    }

    @PostMapping
    public ResponseEntity<ProductResponseDto> create(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestBody AdminProductCreateRequestDto request
    ) {
        requireAdminKey(adminKey);
        ProductResponseDto created = productAdminService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProductResponseDto> update(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable String id,
            @RequestBody AdminProductUpdateRequestDto request
    ) {
        requireAdminKey(adminKey);
        return ResponseEntity.ok(productAdminService.update(id, request));
    }

    private void requireAdminKey(String adminKey) {
        if (adminKey == null || !adminApiKey.equals(adminKey)) {
            throw new UnauthorizedException("Invalid or missing X-Admin-Key");
        }
    }
}
