package quantran.api.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderNoteDto {
    private Long id;
    private String orderId;
    private String authorUserId;
    private String authorRole;
    private String authorDisplayName;
    private String body;
    private LocalDateTime createdAt;
}
