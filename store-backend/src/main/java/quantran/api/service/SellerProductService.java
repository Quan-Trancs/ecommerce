package quantran.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import quantran.api.dto.AdminProductCreateRequestDto;
import quantran.api.dto.AdminProductUpdateRequestDto;
import quantran.api.dto.ProductResponseDto;
import quantran.api.entity.BrandEntity;
import quantran.api.entity.CategoryEntity;
import quantran.api.entity.ProductEntity;
import quantran.api.exception.BusinessLogicException;
import quantran.api.exception.ResourceNotFoundException;
import quantran.api.exception.UnauthorizedException;
import quantran.api.repository.BrandRepository;
import quantran.api.repository.CategoryRepository;
import quantran.api.repository.ProductRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SellerProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<ProductResponseDto> listForSeller(String sellerAccountId) {
        return productRepository.findBySellerAccountId(sellerAccountId).stream()
                .map(ProductMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductResponseDto create(String sellerAccountId, AdminProductCreateRequestDto request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BusinessLogicException("name is required");
        }
        if (request.getPrice() == null) {
            throw new BusinessLogicException("price is required");
        }
        if (request.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessLogicException("price cannot be negative");
        }

        String id = request.getId() != null && !request.getId().trim().isEmpty()
                ? request.getId().trim()
                : UUID.randomUUID().toString();

        if (productRepository.existsById(id)) {
            throw new BusinessLogicException("Product already exists: " + id);
        }

        String slug = request.getSlug();
        if (slug == null || slug.trim().isEmpty()) {
            slug = slugify(request.getName()) + "-" + id.substring(0, Math.min(8, id.length()));
        }
        if (productRepository.findBySlug(slug).isPresent()) {
            throw new BusinessLogicException("Slug already exists: " + slug);
        }

        BrandEntity brand = null;
        if (request.getBrandId() != null) {
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new ResourceNotFoundException("Brand not found: " + request.getBrandId()));
        }

        Set<CategoryEntity> categories = new HashSet<>();
        if (request.getCategoryIds() != null) {
            for (String categoryId : request.getCategoryIds()) {
                CategoryEntity category = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
                categories.add(category);
            }
        }

        ProductEntity product = ProductEntity.builder()
                .id(id)
                .name(request.getName().trim())
                .slug(slug.trim())
                .sku(request.getSku())
                .description(request.getDescription())
                .price(request.getPrice())
                .listPrice(request.getListPrice())
                .stockQuantity(request.getStockQuantity() == null ? 0 : request.getStockQuantity())
                .brand(brand)
                .categories(categories)
                .images(request.getImages() == null ? new ArrayList<String>() : new ArrayList<>(request.getImages()))
                .tags(request.getTags() == null ? new HashSet<String>() : new HashSet<>(request.getTags()))
                .isPublished(request.getIsPublished() == null ? true : request.getIsPublished())
                .sellerAccountId(sellerAccountId)
                .build();

        return ProductMapper.toDto(productRepository.save(product));
    }

    @Transactional
    public ProductResponseDto update(String sellerAccountId, String productId, AdminProductUpdateRequestDto request) {
        ProductEntity product = requireOwnedProduct(sellerAccountId, productId);

        if (request.getPrice() != null) {
            if (request.getPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessLogicException("price cannot be negative");
            }
            product.setPrice(request.getPrice());
        }
        if (request.getStockQuantity() != null) {
            if (request.getStockQuantity() < 0) {
                throw new BusinessLogicException("stockQuantity cannot be negative");
            }
            product.setStockQuantity(request.getStockQuantity());
        }
        if (request.getIsPublished() != null) {
            product.setIsPublished(request.getIsPublished());
        }

        return ProductMapper.toDto(productRepository.save(product));
    }

    private ProductEntity requireOwnedProduct(String sellerAccountId, String productId) {
        ProductEntity product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        if (product.getSellerAccountId() == null
                || !product.getSellerAccountId().equals(sellerAccountId)) {
            throw new UnauthorizedException("Not allowed to modify this product");
        }
        return product;
    }

    private String slugify(String name) {
        return name.trim().toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}
