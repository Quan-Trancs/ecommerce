package quantran.api.account;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<AccountEntity, String> {
    Optional<AccountEntity> findByEmailIgnoreCase(String email);

    List<AccountEntity> findByRole(Role role);
}
