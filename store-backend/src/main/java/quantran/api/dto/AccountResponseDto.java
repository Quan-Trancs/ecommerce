package quantran.api.dto;

import lombok.*;
import quantran.api.account.Role;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountResponseDto {
    private String id;
    private String email;
    private String displayName;
    private Role role;
    private boolean active;
    private String shopName;
}
