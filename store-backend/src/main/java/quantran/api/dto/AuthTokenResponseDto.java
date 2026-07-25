package quantran.api.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthTokenResponseDto {
    private String token;
    private String userId;
    private String email;
    private String tokenType;
}
