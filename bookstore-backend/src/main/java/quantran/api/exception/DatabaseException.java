package quantran.api.exception;

import lombok.Getter;

@Getter
public class DatabaseException extends RuntimeException {
    
    private final String errorCode;
    private final String operation;
    
    public DatabaseException(String message) {
        super(message);
        this.errorCode = "DATABASE_ERROR";
        this.operation = "UNKNOWN";
    }
    
    public DatabaseException(String message, String operation) {
        super(message);
        this.errorCode = "DATABASE_ERROR";
        this.operation = operation;
    }
    
    public DatabaseException(String message, String errorCode, String operation) {
        super(message);
        this.errorCode = errorCode;
        this.operation = operation;
    }
    
    public DatabaseException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "DATABASE_ERROR";
        this.operation = "UNKNOWN";
    }
    
    public DatabaseException(String message, String operation, Throwable cause) {
        super(message, cause);
        this.errorCode = "DATABASE_ERROR";
        this.operation = operation;
    }
    
    public DatabaseException(String message, String errorCode, String operation, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.operation = operation;
    }
} 