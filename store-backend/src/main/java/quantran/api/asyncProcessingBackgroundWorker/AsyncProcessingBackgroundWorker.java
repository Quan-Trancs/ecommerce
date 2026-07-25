package quantran.api.asyncProcessingBackgroundWorker;

import quantran.api.asyncProcessingBackgroundWorker.task.Task;

public interface AsyncProcessingBackgroundWorker {
    void addToRequestQueue(Task task);
    void addToResultQueue(String status);
    Task getFromRequestQueue();
    String getFromResultQueue();
    void startWorkers();
    void shutdown();
}
