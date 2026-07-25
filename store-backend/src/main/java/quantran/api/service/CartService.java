package quantran.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import quantran.api.dto.CartResponseDto;
import quantran.api.dto.UpsertCartRequestDto;
import quantran.api.entity.CartEntity;
import quantran.api.entity.CartItemEntity;
import quantran.api.repository.CartRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;

    @Transactional(readOnly = true)
    public CartResponseDto getCart(String userId) {
        return cartRepository.findByUserId(userId)
                .map(this::toDto)
                .orElseGet(() -> emptyCart(userId));
    }

    @Transactional
    public CartResponseDto replaceCart(String userId, UpsertCartRequestDto body) {
        CartEntity cart = cartRepository.findByUserId(userId).orElseGet(() ->
                CartEntity.builder()
                        .id(UUID.randomUUID().toString())
                        .userId(userId)
                        .items(new ArrayList<>())
                        .build()
        );

        cart.setPaymentMethod(body.getPaymentMethod());
        cart.setDeliveryDateIndex(body.getDeliveryDateIndex());
        cart.setShipping(toShippingEmbed(body.getShipping()));

        cart.getItems().clear();
        if (body.getItems() != null) {
            for (CartResponseDto.CartItemDto item : body.getItems()) {
                if (item == null || item.getProductId() == null || item.getProductId().trim().isEmpty()) {
                    continue;
                }
                int qty = item.getQuantity() == null ? 0 : item.getQuantity();
                if (qty <= 0) continue;

                CartItemEntity line = CartItemEntity.builder()
                        .id(UUID.randomUUID().toString())
                        .cart(cart)
                        .clientId(blankTo(item.getClientId(), item.getProductId()))
                        .productId(item.getProductId().trim())
                        .name(blankTo(item.getName(), "Item"))
                        .slug(blankTo(item.getSlug(), item.getProductId()))
                        .image(blankTo(item.getImage(), ""))
                        .category(blankTo(item.getCategory(), "General"))
                        .price(item.getPrice() == null ? BigDecimal.ZERO : item.getPrice())
                        .quantity(qty)
                        .countInStock(item.getCountInStock() == null ? 0 : item.getCountInStock())
                        .color(emptyToNull(item.getColor()))
                        .size(emptyToNull(item.getSize()))
                        .build();
                cart.getItems().add(line);
            }
        }

        return toDto(cartRepository.save(cart));
    }

    @Transactional
    public void clearCart(String userId) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cart.getItems().clear();
            cart.setPaymentMethod(null);
            cart.setDeliveryDateIndex(null);
            cart.setShipping(null);
            cartRepository.save(cart);
        });
    }

    private CartResponseDto emptyCart(String userId) {
        return CartResponseDto.builder()
                .userId(userId)
                .items(new ArrayList<>())
                .build();
    }

    private CartResponseDto toDto(CartEntity cart) {
        List<CartResponseDto.CartItemDto> items = new ArrayList<>();
        if (cart.getItems() != null) {
            for (CartItemEntity item : cart.getItems()) {
                items.add(CartResponseDto.CartItemDto.builder()
                        .clientId(item.getClientId())
                        .productId(item.getProductId())
                        .name(item.getName())
                        .slug(item.getSlug())
                        .image(item.getImage())
                        .category(item.getCategory())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .countInStock(item.getCountInStock())
                        .color(item.getColor())
                        .size(item.getSize())
                        .build());
            }
        }

        CartEntity.ShippingEmbed shipping = cart.getShipping();
        CartResponseDto.ShippingDto shippingDto = null;
        if (shipping != null && hasAnyShipping(shipping)) {
            shippingDto = CartResponseDto.ShippingDto.builder()
                    .fullName(shipping.getFullName())
                    .address(shipping.getAddress())
                    .city(shipping.getCity())
                    .postalCode(shipping.getPostalCode())
                    .country(shipping.getCountry())
                    .phone(shipping.getPhone())
                    .build();
        }

        return CartResponseDto.builder()
                .id(cart.getId())
                .userId(cart.getUserId())
                .paymentMethod(cart.getPaymentMethod())
                .deliveryDateIndex(cart.getDeliveryDateIndex())
                .shipping(shippingDto)
                .items(items)
                .build();
    }

    private CartEntity.ShippingEmbed toShippingEmbed(CartResponseDto.ShippingDto shipping) {
        if (shipping == null) return null;
        if (!hasAnyShippingDto(shipping)) return null;
        return CartEntity.ShippingEmbed.builder()
                .fullName(shipping.getFullName())
                .address(shipping.getAddress())
                .city(shipping.getCity())
                .postalCode(shipping.getPostalCode())
                .country(shipping.getCountry())
                .phone(shipping.getPhone())
                .build();
    }

    private boolean hasAnyShipping(CartEntity.ShippingEmbed shipping) {
        return notBlank(shipping.getFullName())
                || notBlank(shipping.getAddress())
                || notBlank(shipping.getCity())
                || notBlank(shipping.getPostalCode())
                || notBlank(shipping.getCountry())
                || notBlank(shipping.getPhone());
    }

    private boolean hasAnyShippingDto(CartResponseDto.ShippingDto shipping) {
        return notBlank(shipping.getFullName())
                || notBlank(shipping.getAddress())
                || notBlank(shipping.getCity())
                || notBlank(shipping.getPostalCode())
                || notBlank(shipping.getCountry())
                || notBlank(shipping.getPhone());
    }

    private static boolean notBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String blankTo(String value, String fallback) {
        return notBlank(value) ? value.trim() : fallback;
    }

    private static String emptyToNull(String value) {
        return notBlank(value) ? value.trim() : null;
    }
}
