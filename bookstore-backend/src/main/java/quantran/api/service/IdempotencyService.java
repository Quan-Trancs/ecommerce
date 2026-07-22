package quantran.api.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IdempotencyService {
    // In production, use Redis or a persistent store with TTL/expiration
    private final Map<String, String> store = new ConcurrentHashMap<>();

    // Securely get a taskId for a user/key pair
    public Optional<String> getTaskId(String user, String key) {
        return Optional.ofNullable(store.get(user + ":" + key));
    }

    // Securely save a taskId for a user/key pair
    public void saveTaskId(String user, String key, String taskId) {
        store.put(user + ":" + key, taskId);
        // In production, set a TTL/expiration for this entry
    }
} 