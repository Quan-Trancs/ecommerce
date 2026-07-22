package quantran.api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AsyncTaskResponseDto {
    private String taskId;
    private String requestType;
    private String userId;
    private LocalDateTime createdAt;
    private String status;
    private String result;
    private LocalDateTime completedAt;
    private int progress;
    private String estimatedCompletionTime;
    private String statusMessage;
    
    // Additional metadata
    private boolean cancellable;
    private String errorDetails;
    private Map<String, Object> metadata;
    
    public static AsyncTaskResponseDto fromAsyncTaskRequest(AsyncTaskRequest request) {
        return AsyncTaskResponseDto.builder()
                .taskId(request.getTaskId())
                .requestType(request.getRequestType())
                .userId(request.getUserId())
                .createdAt(request.getCreatedAt())
                .status(request.getStatus().name())
                .result(request.getResult())
                .completedAt(request.getCompletedAt())
                .progress(request.getProgress())
                .cancellable(request.getStatus() == AsyncTaskRequest.TaskStatus.PENDING)
                .statusMessage(getStatusMessage(request.getStatus()))
                .build();
    }
    
    private static String getStatusMessage(AsyncTaskRequest.TaskStatus status) {
        switch (status) {
            case PENDING:
                return "Task is queued and waiting to be processed";
            case PROCESSING:
                return "Task is currently being processed";
            case COMPLETED:
                return "Task completed successfully";
            case FAILED:
                return "Task failed during processing";
            case TIMEOUT:
                return "Task timed out";
            case CANCELLED:
                return "Task was cancelled by user";
            default:
                return "Unknown status";
        }
    }
} 