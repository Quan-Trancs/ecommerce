package quantran.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import quantran.api.dto.CreateOrderRequestDto;
import quantran.api.dto.OrderResponseDto;
import quantran.api.dto.PayOrderRequestDto;
import quantran.api.entity.OrderEntity;
import quantran.api.entity.OrderItemEntity;
import quantran.api.entity.ProductEntity;
import quantran.api.entity.ProductVariantEntity;
import quantran.api.exception.BusinessLogicException;
import quantran.api.exception.ResourceNotFoundException;
import quantran.api.exception.UnauthorizedException;
import quantran.api.repository.OrderRepository;
import quantran.api.repository.ProductRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final BigDecimal PRICE_TOLERANCE = new BigDecimal("0.01");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Transactional
    public OrderResponseDto createOrder(String userId, CreateOrderRequestDto request) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new BusinessLogicException("userId is required");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessLogicException("Order must contain at least one item");
        }

        OrderEntity order = OrderEntity.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId.trim())
                .status(OrderEntity.Status.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .itemsPrice(nullToZero(request.getItemsPrice()))
                .shippingPrice(nullToZero(request.getShippingPrice()))
                .taxPrice(nullToZero(request.getTaxPrice()))
                .totalPrice(nullToZero(request.getTotalPrice()))
                .shipping(mapShipping(request.getShipping()))
                .expectedDeliveryDate(LocalDateTime.now().plusDays(7))
                .isPaid(false)
                .items(new ArrayList<OrderItemEntity>())
                .build();

        BigDecimal computedItems = BigDecimal.ZERO;

        for (CreateOrderRequestDto.OrderItemRequestDto line : request.getItems()) {
            if (line.getProductId() == null || line.getProductId().trim().isEmpty()) {
                throw new BusinessLogicException("productId is required for each order item");
            }
            if (line.getQuantity() == null || line.getQuantity() <= 0) {
                throw new BusinessLogicException("quantity must be positive for product " + line.getProductId());
            }

            ProductEntity product = productRepository.findById(line.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + line.getProductId()));

            ProductVariantEntity variant = findMatchingVariant(product, line.getColor(), line.getSize());
            BigDecimal unitPrice;
            Integer availableStock;

            if (variant != null) {
                unitPrice = variant.getPrice();
                availableStock = variant.getStockQuantity() == null ? 0 : variant.getStockQuantity();
            } else {
                unitPrice = product.getPrice();
                availableStock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
            }

            if (line.getPrice() != null && unitPrice != null) {
                BigDecimal delta = line.getPrice().subtract(unitPrice).abs();
                if (delta.compareTo(PRICE_TOLERANCE) > 0) {
                    throw new BusinessLogicException(
                            "Price mismatch for product " + product.getId()
                                    + ": expected " + unitPrice + ", got " + line.getPrice());
                }
            }

            if (availableStock < line.getQuantity()) {
                throw new BusinessLogicException(
                        "Insufficient stock for product " + product.getId()
                                + (variant != null ? " variant" : "")
                                + ": available " + availableStock + ", requested " + line.getQuantity());
            }

            if (variant != null) {
                variant.setStockQuantity(availableStock - line.getQuantity());
            } else {
                product.setStockQuantity(availableStock - line.getQuantity());
            }

            String image = line.getImage();
            if ((image == null || image.isEmpty()) && product.getImages() != null && !product.getImages().isEmpty()) {
                image = product.getImages().get(0);
            }

            BigDecimal linePrice = unitPrice != null ? unitPrice : BigDecimal.ZERO;
            OrderItemEntity item = OrderItemEntity.builder()
                    .order(order)
                    .productId(product.getId())
                    .name(line.getName() != null ? line.getName() : product.getName())
                    .slug(line.getSlug() != null ? line.getSlug() : product.getSlug())
                    .image(image)
                    .price(linePrice)
                    .quantity(line.getQuantity())
                    .color(line.getColor())
                    .size(line.getSize())
                    .build();
            order.getItems().add(item);
            computedItems = computedItems.add(linePrice.multiply(BigDecimal.valueOf(line.getQuantity())));
        }

        if (request.getItemsPrice() == null) {
            order.setItemsPrice(computedItems);
        }
        if (request.getTotalPrice() == null) {
            order.setTotalPrice(order.getItemsPrice()
                    .add(order.getShippingPrice())
                    .add(order.getTaxPrice()));
        }

        OrderEntity saved = orderRepository.save(order);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getById(String id) {
        OrderEntity order = orderRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
        return toDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> listByUser(String userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> listRecent(int limit) {
        return orderRepository.findRecentDetailed(
                        org.springframework.data.domain.PageRequest.of(0, Math.max(1, limit))
                ).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getByIdForUser(String id, String userId, boolean admin) {
        OrderEntity order = orderRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
        assertOwnerOrAdmin(order, userId, admin);
        return toDto(order);
    }

    @Transactional
    public OrderResponseDto markPaidForUser(String id, String userId, boolean admin, PayOrderRequestDto payment) {
        OrderEntity order = orderRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
        assertOwnerOrAdmin(order, userId, admin);
        return markPaid(id, payment);
    }

    private void assertOwnerOrAdmin(OrderEntity order, String userId, boolean admin) {
        if (admin) {
            return;
        }
        if (order.getUserId() == null || !order.getUserId().equals(userId)) {
            throw new UnauthorizedException("Not allowed to access this order");
        }
    }

    @Transactional
    public OrderResponseDto markPaid(String id, PayOrderRequestDto payment) {
        OrderEntity order = orderRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));

        if (Boolean.TRUE.equals(order.getIsPaid()) || order.getStatus() == OrderEntity.Status.PAID) {
            return toDto(order);
        }

        order.setIsPaid(true);
        order.setPaidAt(LocalDateTime.now());
        order.setStatus(OrderEntity.Status.PAID);

        if (payment != null) {
            if (payment.getPaymentMethod() != null && !payment.getPaymentMethod().isEmpty()) {
                order.setPaymentMethod(payment.getPaymentMethod());
            }
            if (payment.getPaymentResultJson() != null) {
                order.setPaymentResultJson(payment.getPaymentResultJson());
            } else {
                StringBuilder json = new StringBuilder("{");
                boolean first = true;
                if (payment.getId() != null) {
                    json.append("\"id\":\"").append(escapeJson(payment.getId())).append("\"");
                    first = false;
                }
                if (payment.getStatus() != null) {
                    if (!first) json.append(",");
                    json.append("\"status\":\"").append(escapeJson(payment.getStatus())).append("\"");
                    first = false;
                }
                if (payment.getEmailAddress() != null) {
                    if (!first) json.append(",");
                    json.append("\"email_address\":\"").append(escapeJson(payment.getEmailAddress())).append("\"");
                }
                json.append("}");
                order.setPaymentResultJson(json.toString());
            }
        }

        return toDto(orderRepository.save(order));
    }

    private ProductVariantEntity findMatchingVariant(ProductEntity product, String color, String size) {
        if (product.getVariants() == null || product.getVariants().isEmpty()) {
            return null;
        }
        boolean hasColor = color != null && !color.isEmpty();
        boolean hasSize = size != null && !size.isEmpty();
        if (!hasColor && !hasSize) {
            return null;
        }
        for (ProductVariantEntity variant : product.getVariants()) {
            boolean colorOk = !hasColor
                    || (variant.getColor() != null && variant.getColor().equalsIgnoreCase(color));
            boolean sizeOk = !hasSize
                    || (variant.getSize() != null && variant.getSize().equalsIgnoreCase(size));
            if (colorOk && sizeOk) {
                return variant;
            }
        }
        return null;
    }

    private OrderEntity.ShippingAddress mapShipping(CreateOrderRequestDto.ShippingDto shipping) {
        if (shipping == null) {
            return null;
        }
        return OrderEntity.ShippingAddress.builder()
                .fullName(shipping.getFullName())
                .address(shipping.getAddress())
                .city(shipping.getCity())
                .postalCode(shipping.getPostalCode())
                .country(shipping.getCountry())
                .phone(shipping.getPhone())
                .build();
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> listContainingProducts(List<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return new ArrayList<>();
        }
        Set<String> owned = new HashSet<>(productIds);
        return orderRepository.findDetailedContainingProductIds(productIds).stream()
                .map(order -> toDtoFiltered(order, owned))
                .collect(Collectors.toList());
    }

    /**
     * Seller ships their own line items on a paid order.
     * Order becomes SHIPPED only when every line item is shipped.
     * Does not modify isPaid / payment fields.
     */
    @Transactional
    public OrderResponseDto markShippedForSeller(String orderId, List<String> sellerProductIds) {
        if (sellerProductIds == null || sellerProductIds.isEmpty()) {
            throw new UnauthorizedException("No seller products — cannot ship");
        }
        Set<String> owned = new HashSet<>(sellerProductIds);
        OrderEntity order = orderRepository.findDetailedById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new BusinessLogicException("Order has no items");
        }

        List<OrderItemEntity> sellerLines = order.getItems().stream()
                .filter(item -> item.getProductId() != null && owned.contains(item.getProductId()))
                .collect(Collectors.toList());
        if (sellerLines.isEmpty()) {
            throw new UnauthorizedException("Order does not include your products");
        }

        if (order.getStatus() == OrderEntity.Status.CANCELLED) {
            throw new BusinessLogicException("Cannot ship a cancelled order");
        }
        if (!Boolean.TRUE.equals(order.getIsPaid())
                && order.getStatus() != OrderEntity.Status.PAID
                && order.getStatus() != OrderEntity.Status.SHIPPED) {
            throw new BusinessLogicException("Order must be paid before shipping");
        }

        LocalDateTime now = LocalDateTime.now();
        for (OrderItemEntity item : sellerLines) {
            if (!Boolean.TRUE.equals(item.getIsShipped())) {
                item.setIsShipped(true);
                item.setShippedAt(now);
            }
        }

        boolean allShipped = order.getItems().stream()
                .allMatch(item -> Boolean.TRUE.equals(item.getIsShipped()));
        if (allShipped) {
            order.setStatus(OrderEntity.Status.SHIPPED);
        }

        OrderEntity saved = orderRepository.save(order);
        return toDtoFiltered(saved, owned);
    }

    private OrderResponseDto toDtoFiltered(OrderEntity order, Set<String> productIds) {
        OrderResponseDto dto = toDto(order);
        if (dto.getItems() != null) {
            List<OrderResponseDto.OrderItemDto> filtered = dto.getItems().stream()
                    .filter(item -> item.getProductId() != null && productIds.contains(item.getProductId()))
                    .collect(Collectors.toList());
            dto.setItems(filtered);
            BigDecimal sellerItems = filtered.stream()
                    .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setItemsPrice(sellerItems);
        }
        return dto;
    }

    private OrderResponseDto toDto(OrderEntity order) {
        OrderResponseDto.OrderResponseDtoBuilder builder = OrderResponseDto.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .status(order.getStatus() == null ? null : order.getStatus().name())
                .paymentMethod(order.getPaymentMethod())
                .itemsPrice(order.getItemsPrice())
                .shippingPrice(order.getShippingPrice())
                .taxPrice(order.getTaxPrice())
                .totalPrice(order.getTotalPrice())
                .expectedDeliveryDate(order.getExpectedDeliveryDate())
                .isPaid(order.getIsPaid())
                .paidAt(order.getPaidAt())
                .paymentResultJson(order.getPaymentResultJson())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt());

        if (order.getShipping() != null) {
            builder.shipping(OrderResponseDto.ShippingDto.builder()
                    .fullName(order.getShipping().getFullName())
                    .address(order.getShipping().getAddress())
                    .city(order.getShipping().getCity())
                    .postalCode(order.getShipping().getPostalCode())
                    .country(order.getShipping().getCountry())
                    .phone(order.getShipping().getPhone())
                    .build());
        }

        if (order.getItems() != null) {
            builder.items(order.getItems().stream()
                    .map(item -> OrderResponseDto.OrderItemDto.builder()
                            .id(item.getId())
                            .productId(item.getProductId())
                            .name(item.getName())
                            .slug(item.getSlug())
                            .image(item.getImage())
                            .price(item.getPrice())
                            .quantity(item.getQuantity())
                            .color(item.getColor())
                            .size(item.getSize())
                            .isShipped(Boolean.TRUE.equals(item.getIsShipped()))
                            .shippedAt(item.getShippedAt())
                            .build())
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
