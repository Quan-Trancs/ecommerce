package quantran.api.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.cache.support.CompositeCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Enhanced cache configuration with optimized settings for better performance.
 * Implements multi-level caching (L1: Caffeine, L2: Redis) with monitoring.
 */
@Configuration
public class CacheConfig {

    @Value("${spring.cache.caffeine.spec:maximumSize=1000,expireAfterWrite=10m}")
    private String caffeineSpec;

    @Value("${spring.cache.redis.ttl:30m}")
    private String redisTtl;

    @Value("${spring.cache.caffeine.maximum-size:1000}")
    private int caffeineMaxSize;

    @Value("${spring.cache.caffeine.expire-after-write:10m}")
    private String caffeineExpireAfterWrite;

    /**
     * Primary cache manager with multi-level caching strategy
     */
    @Bean
    @Primary
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        // L1: Caffeine (in-memory) - Fast access for frequently used data
        CaffeineCacheManager caffeineCacheManager = new CaffeineCacheManager();
        caffeineCacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(caffeineMaxSize)
                .expireAfterWrite(parseDuration(caffeineExpireAfterWrite), TimeUnit.MINUTES)
                .recordStats()
        );

        // L2: Redis (distributed) - Persistent cache for shared data
        RedisCacheManager redisCacheManager = RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(30))
                        .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                        .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer())))
                .withCacheConfiguration("books", 
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(15)))
                .withCacheConfiguration("authors", 
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(20)))
                .withCacheConfiguration("publishers", 
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(20)))
                .withCacheConfiguration("book_summaries", 
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration("book_counts", 
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(5)))
                .build();

        // Composite: L1 first, then L2
        CompositeCacheManager compositeCacheManager = new CompositeCacheManager(
                caffeineCacheManager, redisCacheManager
        );
        compositeCacheManager.setFallbackToNoOpCache(false); // throw if cache not found
        
        return compositeCacheManager;
    }

    /**
     * Redis template for custom cache operations
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Use String serializer for keys
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Use JSON serializer for values
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        
        template.afterPropertiesSet();
        return template;
    }

    /**
     * Cache configuration for specific cache names with different TTLs
     */
    @Bean
    public CacheManager specificCacheManager(RedisConnectionFactory redisConnectionFactory) {
        return RedisCacheManager.builder(redisConnectionFactory)
                .withCacheConfiguration("books", 
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(15))
                        .prefixCacheNameWith("bookstore:"))
                .withCacheConfiguration("authors", 
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(20))
                        .prefixCacheNameWith("bookstore:"))
                .withCacheConfiguration("publishers", 
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(20))
                        .prefixCacheNameWith("bookstore:"))
                .withCacheConfiguration("book_summaries", 
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(10))
                        .prefixCacheNameWith("bookstore:"))
                .withCacheConfiguration("book_counts", 
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(5))
                        .prefixCacheNameWith("bookstore:"))
                .withCacheConfiguration("books_fts", 
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(30))
                        .prefixCacheNameWith("bookstore:"))
                .withCacheConfiguration("books_indexed", 
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(15))
                        .prefixCacheNameWith("bookstore:"))
                .withCacheConfiguration("books_price_range", 
                    RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(20))
                        .prefixCacheNameWith("bookstore:"))
                .build();
    }

    /**
     * Parse duration string to minutes
     */
    private long parseDuration(String duration) {
        if (duration.endsWith("m")) {
            return Long.parseLong(duration.substring(0, duration.length() - 1));
        } else if (duration.endsWith("h")) {
            return Long.parseLong(duration.substring(0, duration.length() - 1)) * 60;
        } else if (duration.endsWith("d")) {
            return Long.parseLong(duration.substring(0, duration.length() - 1)) * 60 * 24;
        }
        return Long.parseLong(duration);
    }
} 