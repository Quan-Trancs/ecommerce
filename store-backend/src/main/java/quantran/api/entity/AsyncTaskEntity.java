package quantran.api.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "async_tasks", indexes = {
    @Index(name = "idx_task_user", columnList = "user_id"),
    @Index(name = "idx_task_status", columnList = "status"),
    @Index(name = "idx_task_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AsyncTaskEntity {
    
    @Id
    @Column(name = "task_id", length = 36)
    @NotBlank(message = "Task ID is required")
    private String taskId;
    
    @Column(name = "request_type", nullable = false, length = 50)
    @NotBlank(message = "Request type is required")
    private String requestType;
    
    @Column(name = "data", columnDefinition = "TEXT")
    private String data; // JSON serialized data
    
    @Column(name = "user_id", nullable = false, length = 100)
    @NotBlank(message = "User ID is required")
    private String userId;
    
    @Column(name = "created_at", nullable = false)
    @NotNull(message = "Created at is required")
    private LocalDateTime createdAt;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @NotNull(message = "Status is required")
    private TaskStatus status;
    
    @Column(name = "result", columnDefinition = "TEXT")
    private String result;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Column(name = "progress")
    private Integer progress;
    
    @Version
    @Column(name = "version")
    private Long version;
    
    public enum TaskStatus {
        PENDING, PROCESSING, COMPLETED, FAILED, TIMEOUT, CANCELLED
    }
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = TaskStatus.PENDING;
        }
        if (progress == null) {
            progress = 0;
        }
    }
} 