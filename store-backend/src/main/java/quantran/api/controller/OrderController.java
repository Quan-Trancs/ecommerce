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

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDto> getById(
            HttpServletRequest request,
            @PathVariable String id
    ) {
        String userId = requireUserId(request);
        boolean admin = isAdmin(request);
        return ResponseEntity.ok(orderService.getByIdForUser(id, userId, admin));
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

    private String requireUserId(HttpServletRequest request) {
        return jwtAuthSupport.resolveUserId(request)
                .orElseThrow(() -> new UnauthorizedException("Bearer token required"));
    }

    private boolean isAdmin(HttpServletRequest request) {
        return Role.from(jwtAuthSupport.resolveRole(request).orElse(null)).isAdmin();
    }
}
