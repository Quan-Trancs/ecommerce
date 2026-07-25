package quantran.api.asyncProcessingBackgroundWorker.impl;

import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import quantran.api.asyncProcessingBackgroundWorker.AsyncProcessingBackgroundWorker;
import quantran.api.asyncProcessingBackgroundWorker.task.Task;
import quantran.api.service.TaskService;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

@Log4j2
@Service
public class AsyncProcessingBackgroundWorkerImpl implements AsyncProcessingBackgroundWorker {
    private final TaskService taskService;
    private final ExecutorService executorService;
    private static final int WORKER_COUNT = 2;
    private Queue<Task> requestQueue = new ConcurrentLinkedQueue<>();
    private Queue<String> resultQueue = new ConcurrentLinkedQueue<>();
    private final Object LOCK = new Object();
    private volatile boolean workersStarted = false;
    private final AtomicBoolean shutdownRequested = new AtomicBoolean(false);

    public void addToRequestQueue(Task task) {
        if (shutdownRequested.get()) {
            log.warn("Cannot add task to queue - shutdown requested");
            return;
        }
        requestQueue.add(task);
        if (!workersStarted) {
            startWorkers();
        }
    }
    public void addToResultQueue(String status) {
        resultQueue.add(status);
    }
    public Task getFromRequestQueue() {
        return requestQueue.poll();
    }
    public String getFromResultQueue() {
        return resultQueue.poll();
    }

    public AsyncProcessingBackgroundWorkerImpl(TaskService taskService) {
        this.executorService = Executors.newFixedThreadPool(WORKER_COUNT);
        this.taskService = taskService;
    }
    public void startWorkers() {
        for (int i = 0; i < WORKER_COUNT; i++) {
            final int workerId = i;
            executorService.execute(() -> {
                log.info("Worker {} started", workerId);
                while (!shutdownRequested.get()) {
                    Task task;
                    synchronized (LOCK) {
                        task = getFromRequestQueue();
                        while (task == null && !shutdownRequested.get()) {
                            // No task available, wait for notification
                            waiting(1000);
                            task = getFromRequestQueue();
                        }
                    }

                    if (task != null) {
                        try {
                            log.info("Worker {} processing task: {}", workerId, task.getRequest());
                            taskService.runTask(task);
                            log.info("Worker {} completed task: {}", workerId, task.getRequest());
                        } catch (Exception e) {
                            log.error("Worker {} failed to process task: {}", workerId, task.getRequest(), e);
                            // Add error status to result queue
                            addToResultQueue("ERROR: " + e.getMessage());
                        }
                    }
                }
                log.info("Worker {} stopped", workerId);
            });
        }
        workersStarted = true;
    }

    public void shutdown() {
        log.info("Shutting down background workers...");
        shutdownRequested.set(true);
        
        // Wait for all tasks to complete
        try {
            Thread.sleep(5000); // Wait up to 5 seconds for tasks to complete
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
        log.info("Background workers shutdown complete");
    }

    // Simulate command execution with a delay
    private void waiting(int time) {
        try {
            Thread.sleep(time);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}