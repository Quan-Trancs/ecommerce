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
import quantran.api.repository.BrandRepository;
import quantran.api.repository.CategoryRepository;
import quantran.api.repository.ProductRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductAdminService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public ProductResponseDto create(AdminProductCreateRequestDto request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BusinessLogicException("name is required");
        }
        if (request.getPrice() == null) {
            throw new BusinessLogicException("price is required");
        }

        String id = request.getId() != null && !request.getId().trim().isEmpty()
                ? request.getId().trim()
                : UUID.randomUUID().toString();

        if (productRepository.existsById(id)) {
            throw new BusinessLogicException("Product already exists: " + id);
        }

        String slug = request.getSlug();
        if (slug == null || slug.trim().isEmpty()) {
            slug = slugify(request.getName());
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
                .build();

        ProductEntity saved = productRepository.save(product);
        return ProductMapper.toDto(saved);
    }

    @Transactional
    public ProductResponseDto update(String id, AdminProductUpdateRequestDto request) {
        ProductEntity product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

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
        if (request.getImages() != null) {
            product.setImages(new java.util.ArrayList<>(request.getImages()));
        }

        ProductEntity saved = productRepository.save(product);
        return ProductMapper.toDto(saved);
    }

    private String slugify(String name) {
        return name.trim().toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}
