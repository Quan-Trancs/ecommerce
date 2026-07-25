package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quantran.api.dto.CategoryResponseDto;
import quantran.api.service.CategoryService;

import java.util.List;

@RestController
@RequestMapping("/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /** Hierarchical category tree (Amazon-style browse taxonomy). */
    @GetMapping
    public ResponseEntity<List<CategoryResponseDto>> getCategories(
            @RequestParam(defaultValue = "tree") String view
    ) {
        if ("flat".equalsIgnoreCase(view)) {
            return ResponseEntity.ok(categoryService.getFlatCategories());
        }
        return ResponseEntity.ok(categoryService.getCategoryTree());
    }
}
