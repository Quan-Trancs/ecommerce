package quantran.api.exception;

import lombok.Getter;

import java.util.Map;

@Getter
public class ValidationException extends RuntimeException {
    
    private final Map<String, String> fieldErrors;
    private final String errorCode;
    
    public ValidationException(String message) {
        super(message);
        this.fieldErrors = null;
        this.errorCode = "VALIDATION_ERROR";
    }
    
    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
        this.errorCode = "VALIDATION_ERROR";
    }
    
    public ValidationException(String message, String errorCode) {
        super(message);
        this.fieldErrors = null;
        this.errorCode = errorCode;
    }
    
    public ValidationException(String message, Map<String, String> fieldErrors, String errorCode) {
        super(message);
        this.fieldErrors = fieldErrors;
        this.errorCode = errorCode;
    }
    
    public ValidationException(String message, Throwable cause) {
        super(message, cause);
        this.fieldErrors = null;
        this.errorCode = "VALIDATION_ERROR";
    }
} 