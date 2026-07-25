package quantran.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import quantran.api.entity.CartEntity;

import java.util.Optional;

public interface CartRepository extends JpaRepository<CartEntity, String> {
    Optional<CartEntity> findByUserId(String userId);

    void deleteByUserId(String userId);
}
