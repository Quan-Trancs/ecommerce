package quantran.api.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import quantran.api.dto.AsyncTaskRequest;
import quantran.api.service.AsyncTaskService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
public class AsyncTaskServiceImpl implements AsyncTaskService {
    
    // In-memory storage (in production, use Redis or database)
    private final Map<String, AsyncTaskRequest> taskStore = new ConcurrentHashMap<>();
    
    @Override
    public AsyncTaskRequest submitTask(String requestType, Object data, String userId) {
        log.info("Submitting task - type: {}, userId: {}", requestType, userId);
        
        AsyncTaskRequest task = AsyncTaskRequest.create(requestType, data, userId);
        taskStore.put(task.getTaskId(), task);
        
        log.info("Task submitted successfully - taskId: {}", task.getTaskId());
        return task;
    }
    
    @Override
    public Optional<AsyncTaskRequest> getTaskStatus(String taskId) {
        log.debug("Getting task status - taskId: {}", taskId);
        return Optional.ofNullable(taskStore.get(taskId));
    }
    
    @Override
    public List<AsyncTaskRequest> getUserTasks(String userId) {
        log.debug("Getting tasks for user - userId: {}", userId);
        return taskStore.values().stream()
                .filter(task -> userId.equals(task.getUserId()))
                .collect(Collectors.toList());
    }
    
    @Override
    public boolean cancelTask(String taskId, String userId) {
        log.info("Cancelling task - taskId: {}, userId: {}", taskId, userId);
        
        AsyncTaskRequest task = taskStore.get(taskId);
        if (task != null && userId.equals(task.getUserId()) && 
            task.getStatus() == AsyncTaskRequest.TaskStatus.PENDING) {
            
            task.setStatus(AsyncTaskRequest.TaskStatus.FAILED);
            task.setResult("Task cancelled by user");
            task.setCompletedAt(LocalDateTime.now());
            
            log.info("Task cancelled successfully - taskId: {}", taskId);
            return true;
        }
        
        log.warn("Task could not be cancelled - taskId: {}, userId: {}", taskId, userId);
        return false;
    }
    
    @Override
    public void cleanupOldTasks(int daysToKeep) {
        log.info("Cleaning up tasks older than {} days", daysToKeep);
        
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        
        taskStore.entrySet().removeIf(entry -> {
            AsyncTaskRequest task = entry.getValue();
            boolean shouldRemove = task.getCompletedAt() != null && 
                                 task.getCompletedAt().isBefore(cutoffDate);
            
            if (shouldRemove) {
                log.debug("Removing old task - taskId: {}, completedAt: {}", 
                         task.getTaskId(), task.getCompletedAt());
            }
            
            return shouldRemove;
        });
        
        log.info("Cleanup completed, {} tasks remaining", taskStore.size());
    }
    
    // Internal methods for updating task status
    @Override
    public void updateTaskStatus(String taskId, AsyncTaskRequest.TaskStatus status, String result) {
        log.debug("Updating task status - taskId: {}, status: {}, result: {}", taskId, status, result);
        
        AsyncTaskRequest task = taskStore.get(taskId);
        if (task != null) {
            task.setStatus(status);
            task.setResult(result);
            if (status == AsyncTaskRequest.TaskStatus.COMPLETED || 
                status == AsyncTaskRequest.TaskStatus.FAILED || 
                status == AsyncTaskRequest.TaskStatus.CANCELLED) {
                task.setCompletedAt(LocalDateTime.now());
            }
        } else {
            log.warn("Task not found for status update - taskId: {}", taskId);
        }
    }
    
    @Override
    public void updateTaskProgress(String taskId, int progress) {
        log.debug("Updating task progress - taskId: {}, progress: {}", taskId, progress);
        
        AsyncTaskRequest task = taskStore.get(taskId);
        if (task != null) {
            task.setProgress(progress);
        } else {
            log.warn("Task not found for progress update - taskId: {}", taskId);
        }
    }
} 