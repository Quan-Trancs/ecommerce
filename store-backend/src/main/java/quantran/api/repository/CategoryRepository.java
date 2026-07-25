package quantran.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import quantran.api.entity.CategoryEntity;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<CategoryEntity, String> {
    Optional<CategoryEntity> findBySlug(String slug);

    List<CategoryEntity> findByIsActiveTrueOrderBySortOrderAscNameAsc();

    List<CategoryEntity> findByParentIsNullAndIsActiveTrueOrderBySortOrderAscNameAsc();

    @Query("SELECT c FROM CategoryEntity c LEFT JOIN FETCH c.children WHERE c.parent IS NULL AND c.isActive = true ORDER BY c.sortOrder ASC, c.name ASC")
    List<CategoryEntity> findRootCategoriesWithChildren();

    @Query("SELECT c FROM CategoryEntity c WHERE c.id = :id OR c.slug = :id")
    Optional<CategoryEntity> findByIdOrSlug(@Param("id") String id);
}
