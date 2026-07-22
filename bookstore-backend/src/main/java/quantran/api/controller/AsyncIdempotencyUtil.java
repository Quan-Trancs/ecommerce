package quantran.api.controller;

import org.springframework.http.ResponseEntity;
import quantran.api.dto.AsyncTaskRequest;
import quantran.api.dto.AsyncTaskResponseDto;
import quantran.api.service.AsyncTaskService;
import quantran.api.service.IdempotencyService;

import java.util.Optional;

public class AsyncIdempotencyUtil {
    private AsyncIdempotencyUtil() {}

    public static Optional<ResponseEntity<AsyncTaskResponseDto>> handleIdempotency(
            String userName,
            String idempotencyKey,
            IdempotencyService idempotencyService,
            AsyncTaskService asyncTaskService) {
        Optional<String> existingTaskId = idempotencyService.getTaskId(userName, idempotencyKey);
        if (existingTaskId.isPresent()) {
            Optional<AsyncTaskRequest> task = asyncTaskService.getTaskStatus(existingTaskId.get());
            if (task.isPresent()) {
                AsyncTaskResponseDto response = AsyncTaskResponseDto.fromAsyncTaskRequest(task.get());
                return Optional.of(ResponseEntity.accepted().body(response));
            }
        }
        return Optional.empty();
    }
} 