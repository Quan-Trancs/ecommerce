package quantran.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Cancels unpaid PENDING orders after a TTL so reserved stock returns to the catalog.
 */
@Component
@RequiredArgsConstructor
@Log4j2
public class UnpaidOrderReservationJob {

    private final OrderService orderService;

    @Value("${app.orders.unpaid-reservation-minutes:30}")
    private int unpaidReservationMinutes;

    @Value("${app.orders.reservation-expire-enabled:true}")
    private boolean enabled;

    @Scheduled(fixedDelayString = "${app.orders.reservation-expire-check-ms:60000}")
    public void expireUnpaidReservations() {
        if (!enabled) {
            return;
        }
        int expired = orderService.expireUnpaidReservations(unpaidReservationMinutes);
        if (expired > 0) {
            log.info(
                    "Expired {} unpaid order reservation(s) older than {} minutes",
                    expired,
                    unpaidReservationMinutes
            );
        }
    }
}
