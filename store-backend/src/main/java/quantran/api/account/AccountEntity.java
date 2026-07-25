package quantran.api.account;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Platform account mirrored from the storefront auth subject (Mongo user id).
 */
@Entity
@Table(name = "accounts", indexes = {
        @Index(name = "idx_account_email", columnList = "email"),
        @Index(name = "idx_account_role", columnList = "role")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountEntity {

    @Id
    @Column(length = 100)
    private String id;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(length = 200)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (role == null) role = Role.BUYER;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
