package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quantran.api.dto.CreateOrderRequestDto;
import quantran.api.dto.OrderResponseDto;
import quantran.api.dto.PayOrderRequestDto;
import quantran.api.exception.BusinessLogicException;
import quantran.api.service.OrderService;

@RestController
@RequestMapping("/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponseDto> create(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody CreateOrderRequestDto request
    ) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new BusinessLogicException("X-User-Id header is required");
        }
        OrderResponseDto created = orderService.createOrder(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDto> getById(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<OrderResponseDto> markPaid(
            @PathVariable String id,
            @RequestBody(required = false) PayOrderRequestDto payment
    ) {
        return ResponseEntity.ok(orderService.markPaid(id, payment));
    }
}
