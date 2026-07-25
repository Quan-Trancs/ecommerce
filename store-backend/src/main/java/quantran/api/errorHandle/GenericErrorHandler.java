package quantran.api.errorHandle;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import javax.validation.ConstraintViolation;
import java.util.Set;

@Component
public class GenericErrorHandler {
    
    /**
     * Generic error handler for constraint violations
     * @param violations Set of constraint violations
     * @param <T> Type of the model being validated
     * @return ResponseEntity with error message
     */
    public static <T> ResponseEntity<String> errorHandle(Set<ConstraintViolation<T>> violations) {
        StringBuilder errorMessage = new StringBuilder();
        errorMessage.append(HttpStatus.BAD_REQUEST).append(": \n");
        
        for (ConstraintViolation<T> violation : violations) {
            errorMessage.append(violation.getMessage()).append(". \n");
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessage.toString());
    }
} 