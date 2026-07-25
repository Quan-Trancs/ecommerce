package quantran.api.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderNoteRequestDto {
    private String body;
    /**
     * Optional. PUBLIC (default) or INTERNAL.
     * INTERNAL requires SUPPORT/ADMIN; buyers cannot create internal notes.
     */
    private String visibility;
}
