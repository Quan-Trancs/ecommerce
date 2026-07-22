package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import quantran.api.common.UrlConstant;
import quantran.api.dto.AsyncTaskRequest;
import quantran.api.service.AsyncTaskService;

import java.util.List;

@RestController
@Log4j2
@RequiredArgsConstructor
@RequestMapping(UrlConstant.TASK)
@CrossOrigin(origins = UrlConstant.BOOKFE)
public class AsyncTaskController {
    
    private final AsyncTaskService asyncTaskService;
    
    /**
     * Get task status by task ID
     */
    @GetMapping("/{taskId}")
    public ResponseEntity<AsyncTaskRequest> getTaskStatus(@PathVariable String taskId) {
        log.info("Getting task status - taskId: {}", taskId);
        
        return asyncTaskService.getTaskStatus(taskId)
                .map(task -> ResponseEntity.ok(task))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get all tasks for a user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AsyncTaskRequest>> getUserTasks(@PathVariable String userId) {
        log.info("Getting tasks for user - userId: {}", userId);
        
        List<AsyncTaskRequest> tasks = asyncTaskService.getUserTasks(userId);
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Cancel a task
     */
    @DeleteMapping("/{taskId}")
    public ResponseEntity<String> cancelTask(
            @PathVariable String taskId,
            @RequestParam String userId) {
        log.info("Cancelling task - taskId: {}, userId: {}", taskId, userId);
        
        boolean cancelled = asyncTaskService.cancelTask(taskId, userId);
        
        if (cancelled) {
            return ResponseEntity.ok("Task cancelled successfully");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Task could not be cancelled");
        }
    }
    
    /**
     * Clean up old tasks (admin endpoint)
     */
    @DeleteMapping("/cleanup")
    public ResponseEntity<String> cleanupOldTasks(@RequestParam(defaultValue = "7") int daysToKeep) {
        log.info("Cleaning up tasks older than {} days", daysToKeep);
        
        asyncTaskService.cleanupOldTasks(daysToKeep);
        return ResponseEntity.ok("Cleanup completed");
    }
} 