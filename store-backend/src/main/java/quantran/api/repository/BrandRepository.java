package quantran.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import quantran.api.entity.BrandEntity;

import java.util.List;
import java.util.Optional;

public interface BrandRepository extends JpaRepository<BrandEntity, Long> {
    Optional<BrandEntity> findBySlug(String slug);

    List<BrandEntity> findByIsActiveTrueOrderByNameAsc();
}
