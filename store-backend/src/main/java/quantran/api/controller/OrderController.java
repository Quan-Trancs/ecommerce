package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quantran.api.account.Role;
import quantran.api.dto.CreateOrderRequestDto;
import quantran.api.dto.OrderResponseDto;
import quantran.api.dto.PayOrderRequestDto;
import quantran.api.exception.UnauthorizedException;
import quantran.api.security.JwtAuthSupport;
import quantran.api.service.OrderService;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final JwtAuthSupport jwtAuthSupport;

    @PostMapping
    public ResponseEntity<OrderResponseDto> create(
            HttpServletRequest request,
            @RequestBody CreateOrderRequestDto body
    ) {
        String userId = requireUserId(request);
        OrderResponseDto created = orderService.createOrder(userId, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/me")
    public ResponseEntity<List<OrderResponseDto>> listMine(HttpServletRequest request) {
        String userId = requireUserId(request);
        return ResponseEntity.ok(orderService.listByUser(userId));
    }

    /** Recent orders for SUPPORT / ADMIN customer service. */
    @GetMapping("/assist/recent")
    public ResponseEntity<List<OrderResponseDto>> listRecentForAssist(
            HttpServletRequest request,
            @RequestParam(defaultValue = "40") int limit
    ) {
        requireAssist(request);
        int capped = Math.max(1, Math.min(limit, 100));
        return ResponseEntity.ok(orderService.listRecent(capped));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDto> getById(
            HttpServletRequest request,
            @PathVariable String id
    ) {
        String userId = requireUserId(request);
        boolean elevate = canAssist(request);
        return ResponseEntity.ok(orderService.getByIdForUser(id, userId, elevate));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<OrderResponseDto> markPaid(
            HttpServletRequest request,
            @PathVariable String id,
            @RequestBody(required = false) PayOrderRequestDto payment
    ) {
        String userId = requireUserId(request);
        boolean admin = isAdmin(request);
        return ResponseEntity.ok(orderService.markPaidForUser(id, userId, admin, payment));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponseDto> cancel(
            HttpServletRequest request,
            @PathVariable String id
    ) {
        String userId = requireUserId(request);
        boolean elevate = canAssist(request);
        return ResponseEntity.ok(orderService.cancelForUser(id, userId, elevate));
    }

    private String requireUserId(HttpServletRequest request) {
        return jwtAuthSupport.resolveUserId(request)
                .orElseThrow(() -> new UnauthorizedException("Bearer token required"));
    }

    private Role requestRole(HttpServletRequest request) {
        return Role.from(jwtAuthSupport.resolveRole(request).orElse(null));
    }

    private boolean isAdmin(HttpServletRequest request) {
        return requestRole(request).isAdmin();
    }

    private boolean canAssist(HttpServletRequest request) {
        return requestRole(request).canAssist();
    }

    private void requireAssist(HttpServletRequest request) {
        requireUserId(request);
        if (!canAssist(request)) {
            throw new UnauthorizedException("Support or admin role required");
        }
    }
}
