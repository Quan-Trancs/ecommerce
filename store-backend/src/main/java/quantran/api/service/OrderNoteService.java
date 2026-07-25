package quantran.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import quantran.api.account.AccountEntity;
import quantran.api.account.AccountRepository;
import quantran.api.account.Role;
import quantran.api.dto.CreateOrderNoteRequestDto;
import quantran.api.dto.OrderNoteDto;
import quantran.api.entity.OrderEntity;
import quantran.api.entity.OrderNoteEntity;
import quantran.api.exception.BusinessLogicException;
import quantran.api.exception.ResourceNotFoundException;
import quantran.api.exception.UnauthorizedException;
import quantran.api.repository.OrderNoteRepository;
import quantran.api.repository.OrderRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderNoteService {

    private static final int MAX_BODY_LENGTH = 2000;

    private final OrderRepository orderRepository;
    private final OrderNoteRepository orderNoteRepository;
    private final AccountRepository accountRepository;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public List<OrderNoteDto> listForUser(
            String orderId,
            String userId,
            boolean elevate,
            boolean canSell
    ) {
        OrderEntity order = requireAccessibleOrder(orderId, userId, elevate, canSell);
        return orderNoteRepository.findByOrderIdOrderByCreatedAtAsc(order.getId()).stream()
                .filter(note -> elevate || isPublic(note))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderNoteDto createForUser(
            String orderId,
            String userId,
            Role role,
            boolean elevate,
            boolean canSell,
            CreateOrderNoteRequestDto request
    ) {
        OrderEntity order = requireAccessibleOrder(orderId, userId, elevate, canSell);
        String body = request == null || request.getBody() == null ? "" : request.getBody().trim();
        if (body.isEmpty()) {
            throw new BusinessLogicException("Note body is required");
        }
        if (body.length() > MAX_BODY_LENGTH) {
            throw new BusinessLogicException("Note must be at most " + MAX_BODY_LENGTH + " characters");
        }

        OrderNoteEntity.Visibility visibility = resolveVisibility(
                request == null ? null : request.getVisibility(),
                elevate
        );
        boolean urgent = Boolean.TRUE.equals(request == null ? null : request.getUrgent())
                && visibility == OrderNoteEntity.Visibility.PUBLIC;

        Role effectiveRole = role == null ? Role.BUYER : role;
        OrderNoteEntity note = OrderNoteEntity.builder()
                .orderId(order.getId())
                .authorUserId(userId)
                .authorRole(effectiveRole.name())
                .visibility(visibility)
                .urgent(urgent)
                .body(body)
                .createdAt(LocalDateTime.now())
                .build();
        return toDto(orderNoteRepository.save(note));
    }

    private OrderNoteEntity.Visibility resolveVisibility(String raw, boolean elevate) {
        if (raw == null || raw.trim().isEmpty()) {
            return OrderNoteEntity.Visibility.PUBLIC;
        }
        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        if ("INTERNAL".equals(normalized) || "STAFF".equals(normalized) || "PRIVATE".equals(normalized)) {
            if (!elevate) {
                throw new UnauthorizedException("Only support or admin can post internal notes");
            }
            return OrderNoteEntity.Visibility.INTERNAL;
        }
        if ("PUBLIC".equals(normalized)) {
            return OrderNoteEntity.Visibility.PUBLIC;
        }
        throw new BusinessLogicException("visibility must be PUBLIC or INTERNAL");
    }

    private boolean isPublic(OrderNoteEntity note) {
        return note.getVisibility() == null
                || note.getVisibility() == OrderNoteEntity.Visibility.PUBLIC;
    }

    private OrderEntity requireAccessibleOrder(
            String orderId,
            String userId,
            boolean elevate,
            boolean canSell
    ) {
        OrderEntity order = orderRepository.findDetailedById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        if (elevate) {
            return order;
        }
        if (order.getUserId() != null && order.getUserId().equals(userId)) {
            return order;
        }
        if (canSell) {
            Set<String> owned = orderService.productIdsOwnedBySeller(userId);
            if (orderService.orderContainsAnyProduct(order, owned)) {
                return order;
            }
        }
        throw new UnauthorizedException("Not allowed to access this order");
    }

    private OrderNoteDto toDto(OrderNoteEntity note) {
        String displayName = accountRepository.findById(note.getAuthorUserId())
                .map(this::formatAuthorName)
                .orElse(null);
        OrderNoteEntity.Visibility visibility = note.getVisibility() == null
                ? OrderNoteEntity.Visibility.PUBLIC
                : note.getVisibility();
        return OrderNoteDto.builder()
                .id(note.getId())
                .orderId(note.getOrderId())
                .authorUserId(note.getAuthorUserId())
                .authorRole(note.getAuthorRole())
                .authorDisplayName(displayName)
                .visibility(visibility.name())
                .urgent(Boolean.TRUE.equals(note.getUrgent()))
                .body(note.getBody())
                .createdAt(note.getCreatedAt())
                .build();
    }

    private String formatAuthorName(AccountEntity account) {
        if (account.getDisplayName() != null && !account.getDisplayName().trim().isEmpty()) {
            return account.getDisplayName().trim();
        }
        if (account.getEmail() != null && !account.getEmail().trim().isEmpty()) {
            return account.getEmail().trim();
        }
        return account.getId();
    }
}
