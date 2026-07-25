package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quantran.api.account.AccountEntity;
import quantran.api.account.AccountService;
import quantran.api.account.Role;
import quantran.api.dto.AdminProductCreateRequestDto;
import quantran.api.dto.AdminProductUpdateRequestDto;
import quantran.api.dto.OrderResponseDto;
import quantran.api.dto.ProductResponseDto;
import quantran.api.dto.UpdateOrderStatusRequestDto;
import quantran.api.exception.BusinessLogicException;
import quantran.api.exception.UnauthorizedException;
import quantran.api.repository.ProductRepository;
import quantran.api.security.JwtAuthSupport;
import quantran.api.service.OrderService;
import quantran.api.service.SellerProductService;
import quantran.api.entity.ProductEntity;

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
    private final SellerProductService sellerProductService;
    private final OrderService orderService;
    private final ProductRepository productRepository;

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        AccountEntity seller = requireSeller(request);
        return ResponseEntity.ok(Collections.singletonMap("accountId", seller.getId()));
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProductResponseDto>> myProducts(HttpServletRequest request) {
        AccountEntity seller = requireSeller(request);
        return ResponseEntity.ok(sellerProductService.listForSeller(seller.getId()));
    }

    @PostMapping("/products")
    public ResponseEntity<ProductResponseDto> createProduct(
            HttpServletRequest request,
            @RequestBody AdminProductCreateRequestDto body
    ) {
        AccountEntity seller = requireSeller(request);
        ProductResponseDto created = sellerProductService.create(seller.getId(), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/products/{id}")
    public ResponseEntity<ProductResponseDto> updateProduct(
            HttpServletRequest request,
            @PathVariable String id,
            @RequestBody AdminProductUpdateRequestDto body
    ) {
        AccountEntity seller = requireSeller(request);
        return ResponseEntity.ok(sellerProductService.update(seller.getId(), id, body));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponseDto>> myOrders(HttpServletRequest request) {
        AccountEntity seller = requireSeller(request);
        List<String> productIds = productRepository.findBySellerAccountId(seller.getId()).stream()
                .map(ProductEntity::getId)
                .collect(Collectors.toList());
        return ResponseEntity.ok(orderService.listContainingProducts(productIds));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponseDto> updateOrderStatus(
            HttpServletRequest request,
            @PathVariable String id,
            @RequestBody UpdateOrderStatusRequestDto body
    ) {
        AccountEntity seller = requireSeller(request);
        String target = body == null || body.getStatus() == null
                ? ""
                : body.getStatus().trim().toUpperCase();
        if (!"SHIPPED".equals(target)) {
            throw new BusinessLogicException("Sellers can only set status to SHIPPED");
        }
        List<String> productIds = productRepository.findBySellerAccountId(seller.getId()).stream()
                .map(ProductEntity::getId)
                .collect(Collectors.toList());
        return ResponseEntity.ok(orderService.markShippedForSeller(id, productIds));
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
