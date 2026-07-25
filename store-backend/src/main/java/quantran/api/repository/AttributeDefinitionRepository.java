package quantran.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import quantran.api.entity.AttributeDefinitionEntity;

import java.util.List;
import java.util.Optional;

public interface AttributeDefinitionRepository extends JpaRepository<AttributeDefinitionEntity, Long> {
    Optional<AttributeDefinitionEntity> findByCode(String code);

    List<AttributeDefinitionEntity> findByIsFilterableTrueOrderBySortOrderAscNameAsc();
}
