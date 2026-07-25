package quantran.api.entity;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "store_order_notes", indexes = {
        @Index(name = "idx_order_note_order", columnList = "order_id"),
        @Index(name = "idx_order_note_created", columnList = "order_id, created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderNoteEntity {

    public enum Visibility {
        PUBLIC,
        INTERNAL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, length = 36)
    private String orderId;

    @Column(name = "author_user_id", nullable = false, length = 100)
    private String authorUserId;

    @Column(name = "author_role", nullable = false, length = 20)
    private String authorRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Visibility visibility = Visibility.PUBLIC;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
