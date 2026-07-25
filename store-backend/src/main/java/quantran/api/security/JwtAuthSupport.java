package quantran.api.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import java.util.Optional;

/**
 * Lightweight helper to validate Bearer JWTs using {@link JwtTokenProvider}.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthSupport {

    private final JwtTokenProvider jwtTokenProvider;

    public Optional<String> extractBearerToken(HttpServletRequest request) {
        if (request == null) {
            return Optional.empty();
        }
        String header = request.getHeader("Authorization");
        if (header == null || header.trim().isEmpty()) {
            return Optional.empty();
        }
        if (header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = header.substring(7).trim();
            return token.isEmpty() ? Optional.empty() : Optional.of(token);
        }
        return Optional.empty();
    }

    public boolean isValidBearer(HttpServletRequest request) {
        Optional<String> token = extractBearerToken(request);
        return token.isPresent() && jwtTokenProvider.validateToken(token.get());
    }

    public Optional<String> resolveUserId(HttpServletRequest request) {
        Optional<String> token = extractBearerToken(request);
        if (!token.isPresent()) {
            return Optional.empty();
        }
        if (!jwtTokenProvider.validateToken(token.get())) {
            return Optional.empty();
        }
        try {
            return Optional.ofNullable(jwtTokenProvider.getUsernameFromToken(token.get()));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Optional<String> resolveRole(HttpServletRequest request) {
        Optional<String> token = extractBearerToken(request);
        if (!token.isPresent() || !jwtTokenProvider.validateToken(token.get())) {
            return Optional.empty();
        }
        try {
            return Optional.ofNullable(jwtTokenProvider.getRoleFromToken(token.get()));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
