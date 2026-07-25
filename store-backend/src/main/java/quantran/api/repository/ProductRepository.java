package quantran.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import quantran.api.entity.ProductEntity;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<ProductEntity, String> {
    Optional<ProductEntity> findBySlug(String slug);

    @Query("SELECT DISTINCT p FROM ProductEntity p " +
            "LEFT JOIN FETCH p.brand " +
            "LEFT JOIN FETCH p.categories " +
            "WHERE p.isPublished = true")
    List<ProductEntity> findAllPublishedWithDetails();

    @Query("SELECT DISTINCT p FROM ProductEntity p " +
            "LEFT JOIN FETCH p.brand " +
            "LEFT JOIN FETCH p.categories " +
            "WHERE p.id = :id OR p.slug = :id")
    Optional<ProductEntity> findDetailedByIdOrSlug(@Param("id") String id);

    @Query("SELECT DISTINCT p FROM ProductEntity p " +
            "LEFT JOIN FETCH p.brand " +
            "LEFT JOIN FETCH p.categories " +
            "WHERE p.id IN :ids")
    List<ProductEntity> findDetailedByIdIn(@Param("ids") List<String> ids);

    @Query("SELECT DISTINCT p FROM ProductEntity p " +
            "LEFT JOIN FETCH p.attributes a " +
            "LEFT JOIN FETCH a.attribute " +
            "WHERE p.id IN :ids")
    List<ProductEntity> fetchAttributesForIds(@Param("ids") List<String> ids);

    @Query("SELECT DISTINCT p FROM ProductEntity p " +
            "LEFT JOIN FETCH p.variants " +
            "WHERE p.id IN :ids")
    List<ProductEntity> fetchVariantsForIds(@Param("ids") List<String> ids);

    List<ProductEntity> findBySellerAccountId(String sellerAccountId);
}
