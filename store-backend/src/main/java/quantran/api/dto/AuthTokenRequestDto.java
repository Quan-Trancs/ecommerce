package quantran.api.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthTokenRequestDto {
    private String userId;
    private String email;
    private String displayName;
    /** BUYER | SELLER | ADMIN (legacy USER/Admin accepted). */
    private String role;
}
