package quantran.api.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsyncTaskRequest {
    private String taskId;
    private String requestType;
    private Object data; // Generic data object
    private String userId;
    private LocalDateTime createdAt;
    private TaskStatus status;
    private String result;
    private LocalDateTime completedAt;
    private int progress; // Progress percentage (0-100)
    
    public enum TaskStatus {
        PENDING, PROCESSING, COMPLETED, FAILED, TIMEOUT, CANCELLED
    }
    
    public static AsyncTaskRequest create(String requestType, Object data, String userId) {
        return AsyncTaskRequest.builder()
                .taskId(UUID.randomUUID().toString())
                .requestType(requestType)
                .data(data)
                .userId(userId)
                .createdAt(LocalDateTime.now())
                .status(TaskStatus.PENDING)
                .progress(0)
                .build();
    }
} 