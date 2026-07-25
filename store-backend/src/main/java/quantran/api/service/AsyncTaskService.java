package quantran.api.service;

import quantran.api.dto.AsyncTaskRequest;
import java.util.List;
import java.util.Optional;

public interface AsyncTaskService {
    /**
     * Submit a task for asynchronous processing
     */
    AsyncTaskRequest submitTask(String requestType, Object data, String userId);
    
    /**
     * Get task status by task ID
     */
    Optional<AsyncTaskRequest> getTaskStatus(String taskId);
    
    /**
     * Get all tasks for a user
     */
    List<AsyncTaskRequest> getUserTasks(String userId);
    
    /**
     * Cancel a pending task
     */
    boolean cancelTask(String taskId, String userId);
    
    /**
     * Clean up old completed tasks
     */
    void cleanupOldTasks(int daysToKeep);
    
    /**
     * Update task status (internal use)
     */
    void updateTaskStatus(String taskId, AsyncTaskRequest.TaskStatus status, String result);
    
    /**
     * Update task progress (internal use)
     */
    void updateTaskProgress(String taskId, int progress);
} 