package quantran.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import quantran.api.entity.OrderNoteEntity;

import java.util.List;

public interface OrderNoteRepository extends JpaRepository<OrderNoteEntity, Long> {

    List<OrderNoteEntity> findByOrderIdOrderByCreatedAtAsc(String orderId);
}
