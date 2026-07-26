package quantran.api.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateOrderStatusRequestDto {
    /** Target status — sellers may set SHIPPED on paid orders. */
    private String status;
    /** Optional carrier label (UPS, USPS, FedEx, …). */
    private String carrier;
    /** Optional tracking / waybill number. */
    private String trackingNumber;
}
