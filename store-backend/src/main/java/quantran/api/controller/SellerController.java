package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quantran.api.account.AccountEntity;
import quantran.api.account.AccountService;
import quantran.api.account.Role;
import quantran.api.dto.ProductResponseDto;
import quantran.api.exception.UnauthorizedException;
import quantran.api.repository.ProductRepository;
import quantran.api.security.JwtAuthSupport;
import quantran.api.service.ProductMapper;

import javax.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Seller-scoped catalog endpoints.
 * Ownership is enforced via products.seller_account_id.
 */
@RestController
@RequestMapping("/v1/seller")
@RequiredArgsConstructor
public class SellerController {

    private final AccountService accountService;
    private final JwtAuthSupport jwtAuthSupport;
    private final ProductRepository productRepository;

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        AccountEntity seller = requireSeller(request);
        return ResponseEntity.ok(Collections.singletonMap("accountId", seller.getId()));
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProductResponseDto>> myProducts(HttpServletRequest request) {
        AccountEntity seller = requireSeller(request);
        List<ProductResponseDto> products = productRepository.findBySellerAccountId(seller.getId())
                .stream()
                .map(ProductMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(products);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<?>> myOrders(HttpServletRequest request) {
        requireSeller(request);
        // Fulfillment queue reserved — join order items by seller products later.
        return ResponseEntity.ok(Collections.emptyList());
    }

    private AccountEntity requireSeller(HttpServletRequest request) {
        String userId = jwtAuthSupport.resolveUserId(request)
                .orElseThrow(() -> new UnauthorizedException("Bearer token required"));
        Role claimRole = Role.from(jwtAuthSupport.resolveRole(request).orElse(null));
        if (claimRole.canSell()) {
            return accountService.upsert(userId, null, null, claimRole);
        }
        return accountService.requireSeller(userId);
    }
}
