package quantran.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import quantran.api.dto.CategoryResponseDto;
import quantran.api.entity.CategoryEntity;
import quantran.api.repository.CategoryRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponseDto> getCategoryTree() {
        List<CategoryEntity> all = categoryRepository.findByIsActiveTrueOrderBySortOrderAscNameAsc();
        Map<String, CategoryResponseDto> nodes = new LinkedHashMap<>();
        for (CategoryEntity entity : all) {
            nodes.put(entity.getId(), toFlatDto(entity));
        }

        List<CategoryResponseDto> roots = new ArrayList<>();
        for (CategoryEntity entity : all) {
            CategoryResponseDto node = nodes.get(entity.getId());
            if (entity.getParent() == null) {
                roots.add(node);
            } else {
                CategoryResponseDto parent = nodes.get(entity.getParent().getId());
                if (parent != null) {
                    parent.getChildren().add(node);
                } else {
                    roots.add(node);
                }
            }
        }
        return roots;
    }

    public List<CategoryResponseDto> getFlatCategories() {
        return categoryRepository.findByIsActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(this::toFlatDto)
                .collect(Collectors.toList());
    }

    private CategoryResponseDto toFlatDto(CategoryEntity entity) {
        return CategoryResponseDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .slug(entity.getSlug())
                .description(entity.getDescription())
                .parentId(entity.getParent() != null ? entity.getParent().getId() : null)
                .imageUrl(entity.getImageUrl())
                .sortOrder(entity.getSortOrder())
                .isActive(entity.getIsActive())
                .children(new ArrayList<>())
                .build();
    }
}
