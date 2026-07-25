package quantran.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import quantran.api.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, String> {
    //void deleteById(String id);
    boolean existsByUserNameAndPassword(String userName, String password);
    UserEntity findByUserNameAndPassword(String userName, String password);
    UserEntity findByUserName(String userName);
}
