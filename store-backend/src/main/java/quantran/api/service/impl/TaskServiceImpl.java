package quantran.api.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import quantran.api.asyncProcessingBackgroundWorker.task.Task;
import quantran.api.dto.AsyncTaskRequest;
import quantran.api.dto.BookRequestDto;
import quantran.api.model.BookModel;
import quantran.api.service.BookService;
import quantran.api.service.TaskService;
import quantran.api.service.AsyncTaskService;
import quantran.api.util.RandomUtil;

import java.math.BigDecimal;

@Service
@Log4j2
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {
    private final BookService bookService;
    private final AsyncTaskService asyncTaskService;
    
    @Override
    public void runTask(Task task) {
        log.info("Start runTask() - taskId: {}", task.getId());
        
        try {
            // Update task status to PROCESSING
            asyncTaskService.updateTaskStatus(task.getId(), AsyncTaskRequest.TaskStatus.PROCESSING, "Processing task");
            
            String request = task.getRequest();
            BookModel bookModel = task.getBookModel();
            
            // Simulate complex async processing
            String requestResult = processTaskWithComplexOperations(task, request, bookModel);
            
            // Update task status based on result
            if ("202".equals(requestResult)) {
                asyncTaskService.updateTaskStatus(task.getId(), AsyncTaskRequest.TaskStatus.COMPLETED, "Task completed successfully");
            } else {
                asyncTaskService.updateTaskStatus(task.getId(), AsyncTaskRequest.TaskStatus.FAILED, "Task failed: " + requestResult);
            }
            
            log.info("End runTask() - taskId: {}, result: {}", task.getId(), requestResult);
            
        } catch (Exception e) {
            log.error("Error processing task - taskId: {}", task.getId(), e);
            asyncTaskService.updateTaskStatus(task.getId(), AsyncTaskRequest.TaskStatus.FAILED, "Task failed with error: " + e.getMessage());
        }
    }

    private String processTaskWithComplexOperations(Task task, String request, BookModel bookModel) {
        try {
            // Simulate progress updates
            asyncTaskService.updateTaskProgress(task.getId(), 10);
            
            // Step 1: Validate inventory availability (simulate external API call)
            log.info("Checking inventory availability for book: {}", bookModel.getId());
            waiting(1000); // Simulate API call
            if (!checkInventoryAvailability(bookModel.getId())) {
                return "404"; // Inventory not available
            }
            
            asyncTaskService.updateTaskProgress(task.getId(), 30);
            
            // Step 2: Calculate dynamic pricing (simulate complex calculation)
            log.info("Calculating dynamic pricing for book: {}", bookModel.getId());
            waiting(800);
            BigDecimal adjustedPrice = calculateDynamicPricing(bookModel);
            bookModel.setPrice(adjustedPrice.toString() + "VND");
            
            asyncTaskService.updateTaskProgress(task.getId(), 60);
            
            // Step 3: Update book information
            log.info("Updating book information: {}", bookModel.getId());
            waiting(500);
            String requestResult = requestCommand(request, bookModel);
            
            asyncTaskService.updateTaskProgress(task.getId(), 90);
            
            // Step 4: Send notifications (simulate external service)
            log.info("Sending update notifications for book: {}", bookModel.getId());
            waiting(300);
            sendUpdateNotifications(bookModel);
            
            asyncTaskService.updateTaskProgress(task.getId(), 100);
            
            return requestResult;
            
        } catch (Exception e) {
            log.error("Error in complex task processing", e);
            return "500";
        }
    }

    public String requestCommand(String request, BookModel bookModel) {
        switch (request) {
            case "update":
                BookRequestDto requestDto = convertBookModelToRequestDto(bookModel);
                bookService.updateBook(bookModel.getId(), requestDto);
                return "202";
            case "add":
                BookRequestDto createDto = convertBookModelToRequestDto(bookModel);
                bookService.createBook(createDto);
                return "202";
            default:
                log.warn("Unknown request type: {}", request);
                return "404";
        }
    }
    
    private BookRequestDto convertBookModelToRequestDto(BookModel bookModel) {
        BookRequestDto dto = new BookRequestDto();
        dto.setId(bookModel.getId());
        dto.setTitle(bookModel.getName());
        dto.setAuthor(bookModel.getAuthor());
        dto.setBookType(bookModel.getBookType());
        
        // Convert price string to BigDecimal
        try {
            String priceStr = bookModel.getPrice().replaceAll("(?i)(vnd|usd|eur)$", "").trim();
            dto.setPrice(new BigDecimal(priceStr));
        } catch (Exception e) {
            log.warn("Error converting price, using default value", e);
            dto.setPrice(BigDecimal.ZERO);
        }
        
        return dto;
    }
    
    // Simulate inventory check
    private boolean checkInventoryAvailability(String bookId) {
        // Simulate 95% success rate
        return RandomUtil.nextInt(100) < 95;
    }
    
    // Simulate dynamic pricing calculation
    private BigDecimal calculateDynamicPricing(BookModel bookModel) {
        try {
            String priceStr = bookModel.getPrice().replaceAll("(?i)(vnd|usd|eur)$", "").trim();
            BigDecimal basePrice = new BigDecimal(priceStr);
            
            // Apply dynamic pricing factors (demand, seasonality, etc.)
            double demandFactor = 0.9 + (RandomUtil.nextDouble() * 0.3); // 0.9 to 1.2
            double seasonalityFactor = 1.0 + (Math.sin(System.currentTimeMillis() / 1000000.0) * 0.1);
            
            return basePrice.multiply(BigDecimal.valueOf(demandFactor * seasonalityFactor))
                           .setScale(2, BigDecimal.ROUND_HALF_UP);
        } catch (Exception e) {
            log.warn("Error calculating dynamic pricing, using original price", e);
            return new BigDecimal(bookModel.getPrice().replaceAll("(?i)(vnd|usd|eur)$", "").trim());
        }
    }
    
    // Simulate notification service
    private void sendUpdateNotifications(BookModel bookModel) {
        // Simulate sending notifications to subscribers, inventory systems, etc.
        log.info("Sending notifications for book update: {}", bookModel.getId());
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
