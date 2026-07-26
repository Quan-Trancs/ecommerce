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
import quantran.api.dto.SellerAnalyticsDto;
import quantran.api.dto.UpdateOrderStatusRequestDto;
import quantran.api.exception.BusinessLogicException;
import quantran.api.exception.UnauthorizedException;
import quantran.api.repository.ProductRepository;
import quantran.api.security.JwtAuthSupport;
import quantran.api.service.OrderService;
import quantran.api.service.SellerProductService;
import quantran.api.entity.ProductEntity;

import javax.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    @GetMapping("/analytics")
    public ResponseEntity<SellerAnalyticsDto> analytics(HttpServletRequest request) {
        AccountEntity seller = requireSeller(request);
        List<ProductEntity> products = productRepository.findBySellerAccountId(seller.getId());
        List<String> productIds = products.stream()
                .map(ProductEntity::getId)
                .collect(Collectors.toList());
        List<OrderResponseDto> orders = orderService.listContainingProducts(productIds);

        int published = 0;
        int lowStock = 0;
        for (ProductEntity product : products) {
            if (Boolean.TRUE.equals(product.getIsPublished())) {
                published++;
            }
            int stock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
            if (stock <= 5) {
                lowStock++;
            }
        }

        LocalDateTime since = LocalDateTime.now().minusDays(30);
        int ordersPaid = 0;
        int ordersNeedingShip = 0;
        int unshippedUnits = 0;
        BigDecimal salesRevenue = BigDecimal.ZERO;
        BigDecimal salesLast30 = BigDecimal.ZERO;

        for (OrderResponseDto order : orders) {
            String status = order.getStatus() == null ? "" : order.getStatus().toUpperCase();
            if ("CANCELLED".equals(status)) {
                continue;
            }
            boolean paid = Boolean.TRUE.equals(order.getIsPaid())
                    || "PAID".equals(status)
                    || "SHIPPED".equals(status);
            if (!paid) {
                continue;
            }
            ordersPaid++;

            BigDecimal sellerTotal = BigDecimal.ZERO;
            boolean needsShip = false;
            if (order.getItems() != null) {
                for (OrderResponseDto.OrderItemDto item : order.getItems()) {
                    BigDecimal line = item.getPrice() == null
                            ? BigDecimal.ZERO
                            : item.getPrice().multiply(BigDecimal.valueOf(
                                    item.getQuantity() == null ? 0 : item.getQuantity()));
                    sellerTotal = sellerTotal.add(line);
                    if (!Boolean.TRUE.equals(item.getIsShipped())) {
                        needsShip = true;
                        unshippedUnits += item.getQuantity() == null ? 0 : item.getQuantity();
                    }
                }
            }
            salesRevenue = salesRevenue.add(sellerTotal);
            if (order.getCreatedAt() != null && !order.getCreatedAt().isBefore(since)) {
                salesLast30 = salesLast30.add(sellerTotal);
            }
            if (needsShip && !"SHIPPED".equals(status)) {
                ordersNeedingShip++;
            }
        }

        return ResponseEntity.ok(SellerAnalyticsDto.builder()
                .productsTotal(products.size())
                .productsPublished(published)
                .productsLowStock(lowStock)
                .ordersTotal(orders.size())
                .ordersPaid(ordersPaid)
                .ordersNeedingShip(ordersNeedingShip)
                .unshippedUnits(unshippedUnits)
                .salesRevenue(salesRevenue)
                .salesRevenueLast30Days(salesLast30)
                .build());
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
        String carrier = body == null ? null : body.getCarrier();
        String trackingNumber = body == null ? null : body.getTrackingNumber();
        return ResponseEntity.ok(
                orderService.markShippedForSeller(id, productIds, carrier, trackingNumber));
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
