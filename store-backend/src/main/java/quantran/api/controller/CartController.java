package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quantran.api.dto.CartResponseDto;
import quantran.api.dto.UpsertCartRequestDto;
import quantran.api.exception.UnauthorizedException;
import quantran.api.security.JwtAuthSupport;
import quantran.api.service.CartService;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final JwtAuthSupport jwtAuthSupport;

    @GetMapping
    public ResponseEntity<CartResponseDto> get(HttpServletRequest request) {
        return ResponseEntity.ok(cartService.getCart(requireUserId(request)));
    }

    @PutMapping
    public ResponseEntity<CartResponseDto> replace(
            HttpServletRequest request,
            @RequestBody UpsertCartRequestDto body
    ) {
        UpsertCartRequestDto payload = body == null ? new UpsertCartRequestDto() : body;
        return ResponseEntity.ok(cartService.replaceCart(requireUserId(request), payload));
    }

    @DeleteMapping
    public ResponseEntity<Void> clear(HttpServletRequest request) {
        cartService.clearCart(requireUserId(request));
        return ResponseEntity.noContent().build();
    }

    private String requireUserId(HttpServletRequest request) {
        return jwtAuthSupport.resolveUserId(request)
                .orElseThrow(() -> new UnauthorizedException("Bearer token required"));
    }
}
