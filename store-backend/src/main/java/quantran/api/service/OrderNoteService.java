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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderNoteService {

    private static final int MAX_BODY_LENGTH = 2000;

    private final OrderRepository orderRepository;
    private final OrderNoteRepository orderNoteRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public List<OrderNoteDto> listForUser(String orderId, String userId, boolean elevate) {
        OrderEntity order = requireAccessibleOrder(orderId, userId, elevate);
        return orderNoteRepository.findByOrderIdOrderByCreatedAtAsc(order.getId()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderNoteDto createForUser(
            String orderId,
            String userId,
            Role role,
            boolean elevate,
            CreateOrderNoteRequestDto request
    ) {
        OrderEntity order = requireAccessibleOrder(orderId, userId, elevate);
        String body = request == null || request.getBody() == null ? "" : request.getBody().trim();
        if (body.isEmpty()) {
            throw new BusinessLogicException("Note body is required");
        }
        if (body.length() > MAX_BODY_LENGTH) {
            throw new BusinessLogicException("Note must be at most " + MAX_BODY_LENGTH + " characters");
        }

        Role effectiveRole = role == null ? Role.BUYER : role;
        OrderNoteEntity note = OrderNoteEntity.builder()
                .orderId(order.getId())
                .authorUserId(userId)
                .authorRole(effectiveRole.name())
                .body(body)
                .createdAt(LocalDateTime.now())
                .build();
        return toDto(orderNoteRepository.save(note));
    }

    private OrderEntity requireAccessibleOrder(String orderId, String userId, boolean elevate) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        if (elevate) {
            return order;
        }
        if (order.getUserId() == null || !order.getUserId().equals(userId)) {
            throw new UnauthorizedException("Not allowed to access this order");
        }
        return order;
    }

    private OrderNoteDto toDto(OrderNoteEntity note) {
        String displayName = accountRepository.findById(note.getAuthorUserId())
                .map(this::formatAuthorName)
                .orElse(null);
        return OrderNoteDto.builder()
                .id(note.getId())
                .orderId(note.getOrderId())
                .authorUserId(note.getAuthorUserId())
                .authorRole(note.getAuthorRole())
                .authorDisplayName(displayName)
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
