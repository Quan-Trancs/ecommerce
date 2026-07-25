package quantran.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartialRefundRequestDto {
    private List<Line> lines;
    private String refundId;
    private String refundStatus;
    private BigDecimal amount;
    private String note;
    private Boolean refundSkipped;
    /** When true, allow refunding shipped lines (return / RMA flow). */
    private Boolean allowShipped;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Line {
        private Long orderItemId;
        private Integer quantity;
    }
}
