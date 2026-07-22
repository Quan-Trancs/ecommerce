package quantran.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import quantran.api.entity.BookTypeEntity;

@Repository
public interface BookTypeRepository extends JpaRepository<BookTypeEntity, String> {
    //void deleteById(String id);
}
