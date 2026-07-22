package quantran.api.service;

import quantran.api.asyncProcessingBackgroundWorker.task.Task;

public interface TaskService {
    void runTask(Task task);
}
