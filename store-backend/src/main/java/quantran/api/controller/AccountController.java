package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quantran.api.account.AccountEntity;
import quantran.api.account.AccountService;
import quantran.api.account.Role;
import quantran.api.account.SellerProfileEntity;
import quantran.api.account.SellerProfileRepository;
import quantran.api.dto.AccountResponseDto;
import quantran.api.exception.UnauthorizedException;
import quantran.api.security.JwtAuthSupport;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final SellerProfileRepository sellerProfileRepository;
    private final JwtAuthSupport jwtAuthSupport;
    private final quantran.api.account.AccountRepository accountRepository;

    @GetMapping("/me")
    public ResponseEntity<AccountResponseDto> me(HttpServletRequest request) {
        String userId = jwtAuthSupport.resolveUserId(request)
                .orElseThrow(() -> new UnauthorizedException("Bearer token required"));
        return ResponseEntity.ok(toDto(accountService.requireAccount(userId)));
    }

    @GetMapping
    public ResponseEntity<List<AccountResponseDto>> list(HttpServletRequest request) {
        requireAdminCaller(request);
        List<AccountResponseDto> accounts = accountRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(accounts);
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<AccountResponseDto> updateRole(
            HttpServletRequest request,
            @PathVariable String id,
            @RequestParam String role
    ) {
        requireAdminCaller(request);
        Role next = Role.from(role);
        AccountEntity account = accountService.requireAccount(id);
        AccountEntity updated = accountService.upsert(
                account.getId(),
                account.getEmail(),
                account.getDisplayName(),
                next
        );
        return ResponseEntity.ok(toDto(updated));
    }

    private void requireAdminCaller(HttpServletRequest request) {
        String userId = jwtAuthSupport.resolveUserId(request)
                .orElseThrow(() -> new UnauthorizedException("Bearer token required"));
        Role role = Role.from(jwtAuthSupport.resolveRole(request).orElse(null));
        if (!role.isAdmin()) {
            // Fall back to persisted account role if claim missing
            accountService.requireAdmin(userId);
        }
    }

    private AccountResponseDto toDto(AccountEntity account) {
        String shopName = null;
        if (account.getRole().canSell()) {
            shopName = sellerProfileRepository.findById(account.getId())
                    .map(SellerProfileEntity::getShopName)
                    .orElse(null);
        }
        return AccountResponseDto.builder()
                .id(account.getId())
                .email(account.getEmail())
                .displayName(account.getDisplayName())
                .role(account.getRole())
                .active(account.isActive())
                .shopName(shopName)
                .build();
    }
}
