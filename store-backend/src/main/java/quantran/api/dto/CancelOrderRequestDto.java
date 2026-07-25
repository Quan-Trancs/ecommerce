package quantran.api.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelOrderRequestDto {
    /** Optional processor refund id after a successful PayPal/Stripe refund. */
    private String refundId;
    private String refundStatus;
    /** When true, support cancelled without calling the payment processor. */
    private Boolean refundSkipped;
    private String refundNote;
}
