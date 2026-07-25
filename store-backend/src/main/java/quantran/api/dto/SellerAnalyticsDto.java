package quantran.api.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerAnalyticsDto {
    private int productsTotal;
    private int productsPublished;
    private int productsLowStock;
    private int ordersTotal;
    private int ordersPaid;
    private int ordersNeedingShip;
    private int unshippedUnits;
    private BigDecimal salesRevenue;
    private BigDecimal salesRevenueLast30Days;
}
