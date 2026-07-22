package quantran.api.aspect;

import lombok.extern.log4j.Log4j2;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Aspect for monitoring query performance and identifying slow queries.
 * This helps in identifying optimization opportunities.
 */
@Aspect
@Component
@Log4j2
public class QueryPerformanceAspect {
    
    private static final long SLOW_QUERY_THRESHOLD_MS = 1000; // 1 second
    private static final long VERY_SLOW_QUERY_THRESHOLD_MS = 5000; // 5 seconds
    
    // Statistics tracking
    private final ConcurrentHashMap<String, QueryStats> queryStats = new ConcurrentHashMap<>();
    
    /**
     * Monitor all repository query methods
     */
    @Around("execution(* quantran.api.repository.*.*(..))")
    public Object logQueryPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String fullMethodName = className + "." + methodName;
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            // Update statistics
            updateQueryStats(fullMethodName, executionTime, true);
            
            // Log slow queries
            if (executionTime > VERY_SLOW_QUERY_THRESHOLD_MS) {
                log.error("VERY SLOW QUERY: {} took {}ms - INVESTIGATE IMMEDIATELY", fullMethodName, executionTime);
            } else if (executionTime > SLOW_QUERY_THRESHOLD_MS) {
                log.warn("SLOW QUERY: {} took {}ms - Consider optimization", fullMethodName, executionTime);
            } else if (executionTime > 500) { // Log queries taking more than 500ms
                log.info("MODERATE QUERY: {} took {}ms", fullMethodName, executionTime);
            }
            
            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            updateQueryStats(fullMethodName, executionTime, false);
            log.error("QUERY FAILED: {} took {}ms before failing", fullMethodName, executionTime, e);
            throw e;
        }
    }
    
    /**
     * Monitor all service methods that might involve database operations
     */
    @Around("execution(* quantran.api.service.*.*(..))")
    public Object logServicePerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String fullMethodName = className + "." + methodName;
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            // Log only slow service methods
            if (executionTime > SLOW_QUERY_THRESHOLD_MS) {
                log.warn("SLOW SERVICE METHOD: {} took {}ms", fullMethodName, executionTime);
            }
            
            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            log.error("SERVICE METHOD FAILED: {} took {}ms before failing", fullMethodName, executionTime, e);
            throw e;
        }
    }
    
    /**
     * Update query statistics
     */
    private void updateQueryStats(String methodName, long executionTime, boolean success) {
        queryStats.compute(methodName, (key, stats) -> {
            if (stats == null) {
                stats = new QueryStats();
            }
            stats.incrementCount();
            stats.addExecutionTime(executionTime);
            if (!success) {
                stats.incrementFailures();
            }
            return stats;
        });
    }
    
    /**
     * Get query performance statistics
     */
    public ConcurrentHashMap<String, QueryStats> getQueryStats() {
        return queryStats;
    }
    
    /**
     * Get slowest queries
     */
    public java.util.List<QueryStatsSummary> getSlowestQueries(int limit) {
        return queryStats.entrySet().stream()
                .map(entry -> new QueryStatsSummary(
                        entry.getKey(),
                        entry.getValue().getAverageExecutionTime(),
                        entry.getValue().getTotalCount(),
                        entry.getValue().getFailureCount()
                ))
                .sorted((a, b) -> Double.compare(b.getAverageExecutionTime(), a.getAverageExecutionTime()))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
    }
    
    /**
     * Get most frequently called queries
     */
    public java.util.List<QueryStatsSummary> getMostFrequentQueries(int limit) {
        return queryStats.entrySet().stream()
                .map(entry -> new QueryStatsSummary(
                        entry.getKey(),
                        entry.getValue().getAverageExecutionTime(),
                        entry.getValue().getTotalCount(),
                        entry.getValue().getFailureCount()
                ))
                .sorted((a, b) -> Long.compare(b.getTotalCount(), a.getTotalCount()))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
    }
    
    /**
     * Clear statistics (useful for testing or periodic reset)
     */
    public void clearStats() {
        queryStats.clear();
        log.info("Query performance statistics cleared");
    }
    
    /**
     * Inner class to track query statistics
     */
    public static class QueryStats {
        private final AtomicLong count = new AtomicLong(0);
        private final AtomicLong totalExecutionTime = new AtomicLong(0);
        private final AtomicLong failureCount = new AtomicLong(0);
        private final AtomicLong maxExecutionTime = new AtomicLong(0);
        private final AtomicLong minExecutionTime = new AtomicLong(Long.MAX_VALUE);
        
        public void incrementCount() {
            count.incrementAndGet();
        }
        
        public void addExecutionTime(long executionTime) {
            totalExecutionTime.addAndGet(executionTime);
            
            // Update max execution time
            long currentMax = maxExecutionTime.get();
            while (executionTime > currentMax && 
                   !maxExecutionTime.compareAndSet(currentMax, executionTime)) {
                currentMax = maxExecutionTime.get();
            }
            
            // Update min execution time
            long currentMin = minExecutionTime.get();
            while (executionTime < currentMin && 
                   !minExecutionTime.compareAndSet(currentMin, executionTime)) {
                currentMin = minExecutionTime.get();
            }
        }
        
        public void incrementFailures() {
            failureCount.incrementAndGet();
        }
        
        public long getTotalCount() {
            return count.get();
        }
        
        public long getTotalExecutionTime() {
            return totalExecutionTime.get();
        }
        
        public double getAverageExecutionTime() {
            long totalCount = count.get();
            return totalCount > 0 ? (double) totalExecutionTime.get() / totalCount : 0.0;
        }
        
        public long getMaxExecutionTime() {
            return maxExecutionTime.get();
        }
        
        public long getMinExecutionTime() {
            long min = minExecutionTime.get();
            return min == Long.MAX_VALUE ? 0 : min;
        }
        
        public long getFailureCount() {
            return failureCount.get();
        }
        
        public double getFailureRate() {
            long totalCount = count.get();
            return totalCount > 0 ? (double) failureCount.get() / totalCount : 0.0;
        }
    }
    
    /**
     * Summary class for query statistics
     */
    public static class QueryStatsSummary {
        private final String methodName;
        private final double averageExecutionTime;
        private final long totalCount;
        private final long failureCount;
        
        public QueryStatsSummary(String methodName, double averageExecutionTime, 
                               long totalCount, long failureCount) {
            this.methodName = methodName;
            this.averageExecutionTime = averageExecutionTime;
            this.totalCount = totalCount;
            this.failureCount = failureCount;
        }
        
        public String getMethodName() {
            return methodName;
        }
        
        public double getAverageExecutionTime() {
            return averageExecutionTime;
        }
        
        public long getTotalCount() {
            return totalCount;
        }
        
        public long getFailureCount() {
            return failureCount;
        }
        
        public double getFailureRate() {
            return totalCount > 0 ? (double) failureCount / totalCount : 0.0;
        }
        
        @Override
        public String toString() {
            return String.format("QueryStatsSummary{methodName='%s', avgTime=%.2fms, count=%d, failures=%d, failureRate=%.2f%%}",
                    methodName, averageExecutionTime, totalCount, failureCount, getFailureRate() * 100);
        }
    }
} 