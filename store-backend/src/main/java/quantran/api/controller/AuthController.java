package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quantran.api.account.AccountEntity;
import quantran.api.account.AccountService;
import quantran.api.account.Role;
import quantran.api.dto.AuthTokenRequestDto;
import quantran.api.dto.AuthTokenResponseDto;
import quantran.api.exception.BusinessLogicException;
import quantran.api.exception.UnauthorizedException;
import quantran.api.security.JwtTokenProvider;

import java.util.Arrays;

/**
 * BFF-trusted token minting for the Next.js frontend.
 * Protected by X-Admin-Key, or allowed when running in a local/dev profile.
 * Upserts the store account so role checks work on subsequent API calls.
 */
@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final AccountService accountService;
    private final Environment environment;

    @Value("${app.admin.api-key:dev-admin-key}")
    private String adminApiKey;

    @PostMapping("/token")
    public ResponseEntity<AuthTokenResponseDto> createToken(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestBody AuthTokenRequestDto request
    ) {
        if (!isAuthorized(adminKey)) {
            throw new UnauthorizedException("X-Admin-Key required (or run with dev/local profile)");
        }
        if (request == null || request.getUserId() == null || request.getUserId().trim().isEmpty()) {
            throw new BusinessLogicException("userId is required");
        }

        String userId = request.getUserId().trim();
        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        Role role = Role.from(request.getRole());

        AccountEntity account = accountService.upsert(userId, email, request.getDisplayName(), role);
        String token = jwtTokenProvider.generateToken(account.getId(), account.getRole().name());

        return ResponseEntity.ok(AuthTokenResponseDto.builder()
                .token(token)
                .userId(account.getId())
                .email(account.getEmail())
                .role(account.getRole().name())
                .tokenType("Bearer")
                .build());
    }

    private boolean isAuthorized(String adminKey) {
        if (adminKey != null && adminApiKey.equals(adminKey)) {
            return true;
        }
        return isDevEnvironment();
    }

    private boolean isDevEnvironment() {
        String[] profiles = environment.getActiveProfiles();
        if (profiles == null || profiles.length == 0) {
            return true;
        }
        return Arrays.stream(profiles).anyMatch(p ->
                "dev".equalsIgnoreCase(p)
                        || "local".equalsIgnoreCase(p)
                        || "default".equalsIgnoreCase(p));
    }
}
