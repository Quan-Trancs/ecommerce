package quantran.api.config;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Per-IP rate limiting with a stricter bucket for public catalog search.
 */
@Configuration
@EnableScheduling
@Log4j2
public class RateLimitConfig implements WebMvcConfigurer {

    @Value("${app.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${app.rate-limit.max-requests-per-minute:120}")
    private int maxRequestsPerMinute;

    @Value("${app.rate-limit.burst-limit:30}")
    private int burstLimit;

    @Value("${app.rate-limit.window-size:60}")
    private int windowSizeSeconds;

    /** Stricter limits for faceted product search (expensive). */
    @Value("${app.rate-limit.search.max-requests-per-minute:40}")
    private int searchMaxRequestsPerMinute;

    @Value("${app.rate-limit.search.burst-limit:8}")
    private int searchBurstLimit;

    private final ConcurrentHashMap<String, RequestCounter> requestCounters = new ConcurrentHashMap<>();

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        if (!rateLimitEnabled) {
            log.info("Rate limiting disabled");
            return;
        }
        registry.addInterceptor(new RateLimitInterceptor())
                .addPathPatterns("/v1/**", "/api/v1/**")
                .excludePathPatterns(
                        "/health/**",
                        "/api/health/**",
                        "/actuator/**",
                        "/api/actuator/**",
                        "/metrics/**",
                        "/api/metrics/**"
                );
        log.info(
                "Rate limiting enabled: default {}/min (burst {}), search {}/min (burst {})",
                maxRequestsPerMinute,
                burstLimit,
                searchMaxRequestsPerMinute,
                searchBurstLimit
        );
    }

    @Scheduled(fixedRate = 300000)
    public void cleanupOldCounters() {
        long currentTime = System.currentTimeMillis();
        int before = requestCounters.size();
        requestCounters.entrySet().removeIf(entry ->
                currentTime > entry.getValue().getResetTime() + TimeUnit.MINUTES.toMillis(5)
        );
        int removed = before - requestCounters.size();
        if (removed > 0) {
            log.debug("Rate-limit counter cleanup removed {} stale keys", removed);
        }
    }

    private class RateLimitInterceptor implements HandlerInterceptor {

        @Override
        public boolean preHandle(
                @NonNull HttpServletRequest request,
                @NonNull HttpServletResponse response,
                @NonNull Object handler
        ) throws Exception {
            if (!rateLimitEnabled) {
                return true;
            }

            String clientIp = getClientIpAddress(request);
            String path = request.getRequestURI() == null ? "" : request.getRequestURI();
            boolean search = isCatalogSearchPath(path);
            int limit = search ? searchMaxRequestsPerMinute : maxRequestsPerMinute;
            int burst = search ? searchBurstLimit : burstLimit;
            String bucket = search ? "search" : "default";
            String key = clientIp + ":" + bucket;

            RequestCounter counter = requestCounters.computeIfAbsent(
                    key,
                    k -> new RequestCounter(windowSizeSeconds, limit, burst)
            );

            if (counter.isRateLimited()) {
                log.warn(
                        "Rate limit exceeded ip={} bucket={} path={}",
                        clientIp,
                        bucket,
                        path
                );
                response.setStatus(429);
                response.setContentType("application/json");
                response.setHeader("Retry-After", String.valueOf(windowSizeSeconds));
                response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
                response.setHeader("X-RateLimit-Remaining", "0");
                response.setHeader("X-RateLimit-Reset", String.valueOf(counter.getResetTime() / 1000));
                response.setHeader("X-RateLimit-Bucket", bucket);
                response.getWriter().write(
                        "{\"error\":\"Rate limit exceeded\",\"bucket\":\"" + bucket + "\",\"retryAfterSeconds\":"
                                + windowSizeSeconds + "}"
                );
                return false;
            }

            counter.increment();
            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader(
                    "X-RateLimit-Remaining",
                    String.valueOf(Math.max(0, limit - counter.getCount()))
            );
            response.setHeader("X-RateLimit-Reset", String.valueOf(counter.getResetTime() / 1000));
            response.setHeader("X-RateLimit-Bucket", bucket);
            return true;
        }

        private boolean isCatalogSearchPath(String path) {
            // Exact list/search endpoints (not /products/{id} detail).
            return path.endsWith("/v1/products")
                    || path.endsWith("/v1/products/")
                    || path.endsWith("/v1/products/batch")
                    || path.endsWith("/v1/categories")
                    || path.endsWith("/v1/categories/");
        }

        private String getClientIpAddress(HttpServletRequest request) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
                return xForwardedFor.split(",")[0].trim();
            }
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
                return xRealIp.trim();
            }
            String xClientIp = request.getHeader("X-Client-IP");
            if (xClientIp != null && !xClientIp.isEmpty() && !"unknown".equalsIgnoreCase(xClientIp)) {
                return xClientIp.trim();
            }
            String cfConnectingIp = request.getHeader("CF-Connecting-IP");
            if (cfConnectingIp != null && !cfConnectingIp.isEmpty() && !"unknown".equalsIgnoreCase(cfConnectingIp)) {
                return cfConnectingIp.trim();
            }
            return request.getRemoteAddr();
        }
    }

    private static class RequestCounter {
        private final AtomicInteger count = new AtomicInteger(0);
        private final AtomicInteger burstCount = new AtomicInteger(0);
        private final int windowSizeSeconds;
        private final int maxRequests;
        private final int burstLimit;
        private volatile long resetTime;
        private volatile long burstResetTime;

        RequestCounter(int windowSizeSeconds, int maxRequests, int burstLimit) {
            this.windowSizeSeconds = windowSizeSeconds;
            this.maxRequests = maxRequests;
            this.burstLimit = burstLimit;
            long now = System.currentTimeMillis();
            this.resetTime = now + TimeUnit.SECONDS.toMillis(windowSizeSeconds);
            this.burstResetTime = now + 1000;
        }

        boolean isRateLimited() {
            long currentTime = System.currentTimeMillis();

            if (currentTime > burstResetTime) {
                burstCount.set(0);
                burstResetTime = currentTime + 1000;
            }
            if (burstCount.get() >= burstLimit) {
                return true;
            }

            if (currentTime > resetTime) {
                count.set(0);
                resetTime = currentTime + TimeUnit.SECONDS.toMillis(windowSizeSeconds);
            }
            return count.get() >= maxRequests;
        }

        void increment() {
            count.incrementAndGet();
            burstCount.incrementAndGet();
        }

        int getCount() {
            return count.get();
        }

        long getResetTime() {
            return resetTime;
        }
    }
}
