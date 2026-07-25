package quantran.api.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayOrderRequestDto {
    private String id;
    private String status;
    private String emailAddress;
    private String paymentMethod;
    private String paymentResultJson;
}
