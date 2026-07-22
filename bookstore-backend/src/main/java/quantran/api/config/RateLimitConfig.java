package quantran.api.config;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.TimeUnit;

@Configuration
@Log4j2
public class RateLimitConfig implements WebMvcConfigurer {

    @Value("${app.rate-limit.max-requests-per-minute:100}")
    private static int maxRequestsPerMinute;
    
    @Value("${app.rate-limit.enabled:true}")
    private static boolean rateLimitEnabled;
    
    @Value("${app.rate-limit.burst-limit:20}")
    private static int burstLimit;
    
    @Value("${app.rate-limit.window-size:60}")
    private static int windowSizeSeconds;

    private static final ConcurrentHashMap<String, RequestCounter> requestCounters = new ConcurrentHashMap<>();

    @Bean
    public RateLimitInterceptor rateLimitInterceptor() {
        return new RateLimitInterceptor();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (rateLimitEnabled) {
            registry.addInterceptor(rateLimitInterceptor())
                    .addPathPatterns("/api/**")
                    .excludePathPatterns("/api/health/**", "/api/actuator/**", "/api/metrics/**");
            log.info("Rate limiting enabled with {} requests per minute", maxRequestsPerMinute);
        } else {
            log.info("Rate limiting disabled");
        }
    }

    public static class RateLimitInterceptor implements HandlerInterceptor {

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            if (!rateLimitEnabled) {
                return true;
            }
            
            String clientIp = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            String requestPath = request.getRequestURI();
            String key = clientIp + ":" + userAgent + ":" + requestPath;

            RequestCounter counter = requestCounters.computeIfAbsent(key, k -> new RequestCounter());
            
            if (counter.isRateLimited()) {
                log.warn("Rate limit exceeded for IP: {}, Path: {}, User-Agent: {}", 
                        clientIp, requestPath, userAgent);
                
                response.setStatus(429); // Too Many Requests
                response.setHeader("Retry-After", String.valueOf(windowSizeSeconds));
                response.setHeader("X-RateLimit-Limit", String.valueOf(maxRequestsPerMinute));
                response.setHeader("X-RateLimit-Remaining", "0");
                response.setHeader("X-RateLimit-Reset", String.valueOf(counter.getResetTime()));
                response.getWriter().write("Rate limit exceeded. Please try again later.");
                return false;
            }

            counter.increment();
            
            // Add rate limit headers
            response.setHeader("X-RateLimit-Limit", String.valueOf(maxRequestsPerMinute));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(maxRequestsPerMinute - counter.getCount()));
            response.setHeader("X-RateLimit-Reset", String.valueOf(counter.getResetTime()));
            
            return true;
        }

        private String getClientIpAddress(HttpServletRequest request) {
            // Check for X-Forwarded-For header (for proxy scenarios)
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
                return xForwardedFor.split(",")[0].trim();
            }
            
            // Check for X-Real-IP header
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
                return xRealIp.trim();
            }
            
            // Check for X-Client-IP header
            String xClientIp = request.getHeader("X-Client-IP");
            if (xClientIp != null && !xClientIp.isEmpty() && !"unknown".equalsIgnoreCase(xClientIp)) {
                return xClientIp.trim();
            }
            
            // Check for CF-Connecting-IP header (Cloudflare)
            String cfConnectingIp = request.getHeader("CF-Connecting-IP");
            if (cfConnectingIp != null && !cfConnectingIp.isEmpty() && !"unknown".equalsIgnoreCase(cfConnectingIp)) {
                return cfConnectingIp.trim();
            }
            
            // Fallback to remote address
            return request.getRemoteAddr();
        }
    }

    private static class RequestCounter {
        private final AtomicInteger count = new AtomicInteger(0);
        private long resetTime = System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(windowSizeSeconds);
        private final AtomicInteger burstCount = new AtomicInteger(0);
        private long burstResetTime = System.currentTimeMillis() + 1000; // 1 second burst window

        public boolean isRateLimited() {
            long currentTime = System.currentTimeMillis();
            
            // Check burst limit first
            if (currentTime > burstResetTime) {
                burstCount.set(0);
                burstResetTime = currentTime + 1000;
            }
            
            if (burstCount.get() >= burstLimit) {
                return true;
            }
            
            // Check regular rate limit
            if (currentTime > resetTime) {
                count.set(0);
                resetTime = currentTime + TimeUnit.SECONDS.toMillis(windowSizeSeconds);
            }
            
            return count.get() >= maxRequestsPerMinute;
        }

        public void increment() {
            count.incrementAndGet();
            burstCount.incrementAndGet();
        }
        
        public int getCount() {
            return count.get();
        }
        
        public long getResetTime() {
            return resetTime;
        }
    }
    
    // Cleanup method to prevent memory leaks
    public void cleanupOldCounters() {
        long currentTime = System.currentTimeMillis();
        requestCounters.entrySet().removeIf(entry -> {
            RequestCounter counter = entry.getValue();
            return currentTime > counter.getResetTime() + TimeUnit.MINUTES.toMillis(5); // Keep for 5 minutes after reset
        });
    }
} 