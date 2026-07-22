package quantran.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import quantran.api.entity.AsyncTaskEntity;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AsyncTaskRepository extends JpaRepository<AsyncTaskEntity, String> {
    
    /**
     * Find tasks by user ID
     */
    List<AsyncTaskEntity> findByUserIdOrderByCreatedAtDesc(String userId);
    
    /**
     * Find tasks by status
     */
    List<AsyncTaskEntity> findByStatus(AsyncTaskEntity.TaskStatus status);
    
    /**
     * Find tasks by user ID and status
     */
    List<AsyncTaskEntity> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, AsyncTaskEntity.TaskStatus status);
    
    /**
     * Find completed tasks older than specified date
     */
    @Query("SELECT t FROM AsyncTaskEntity t WHERE t.completedAt < :cutoffDate AND t.status IN ('COMPLETED', 'FAILED', 'CANCELLED')")
    List<AsyncTaskEntity> findOldCompletedTasks(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * Find pending tasks that have timed out
     */
    @Query("SELECT t FROM AsyncTaskEntity t WHERE t.status = 'PENDING' AND t.createdAt < :timeoutDate")
    List<AsyncTaskEntity> findTimedOutTasks(@Param("timeoutDate") LocalDateTime timeoutDate);
    
    /**
     * Update task status
     */
    @Modifying
    @Query("UPDATE AsyncTaskEntity t SET t.status = :status, t.result = :result, t.completedAt = :completedAt WHERE t.taskId = :taskId")
    int updateTaskStatus(@Param("taskId") String taskId, 
                        @Param("status") AsyncTaskEntity.TaskStatus status, 
                        @Param("result") String result, 
                        @Param("completedAt") LocalDateTime completedAt);
    
    /**
     * Update task progress
     */
    @Modifying
    @Query("UPDATE AsyncTaskEntity t SET t.progress = :progress WHERE t.taskId = :taskId")
    int updateTaskProgress(@Param("taskId") String taskId, @Param("progress") Integer progress);
    
    /**
     * Delete old completed tasks
     */
    @Modifying
    @Query("DELETE FROM AsyncTaskEntity t WHERE t.completedAt < :cutoffDate AND t.status IN ('COMPLETED', 'FAILED', 'CANCELLED')")
    int deleteOldCompletedTasks(@Param("cutoffDate") LocalDateTime cutoffDate);
} 