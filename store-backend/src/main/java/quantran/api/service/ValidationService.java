package quantran.api.service;

import quantran.api.exception.ValidationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class ValidationService {
    
    // Regex patterns for validation
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[1-9]\\d{1,14}$");
    private static final Pattern URL_PATTERN = Pattern.compile("^(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})([/\\w .-]*)*/?$");
    private static final Pattern ISBN_PATTERN = Pattern.compile("^(?:\\d{10}|\\d{13})$");
    private static final Pattern ISBN13_PATTERN = Pattern.compile("^\\d{3}-\\d{10}$");
    private static final Pattern BOOK_ID_PATTERN = Pattern.compile("^[A-Z0-9]{3,20}$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z][a-zA-Z0-9]{7,14}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,20}$");
    
    // File validation constants
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_FILE_TYPES = {".csv", ".txt"};
    
    /**
     * Validate file upload
     */
    public void validateFile(MultipartFile file) {
        Map<String, String> errors = new HashMap<>();
        
        if (file == null || file.isEmpty()) {
            errors.put("file", "File is required");
        } else {
            // Check file size
            if (file.getSize() > MAX_FILE_SIZE) {
                errors.put("file", "File size must not exceed 10MB");
            }
            
            // Check file type
            String originalFilename = file.getOriginalFilename();
            if (originalFilename != null) {
                boolean validType = false;
                for (String allowedType : ALLOWED_FILE_TYPES) {
                    if (originalFilename.toLowerCase().endsWith(allowedType)) {
                        validType = true;
                        break;
                    }
                }
                if (!validType) {
                    errors.put("file", "File type must be CSV or TXT");
                }
            }
        }
        
        if (!errors.isEmpty()) {
            throw new ValidationException("File validation failed", errors);
        }
    }
    
    /**
     * Validate email format
     */
    public void validateEmail(String email) {
        if (email != null && !email.trim().isEmpty() && !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ValidationException("Invalid email format: " + email);
        }
    }
    
    /**
     * Validate phone number format
     */
    public void validatePhoneNumber(String phoneNumber) {
        if (phoneNumber != null && !phoneNumber.trim().isEmpty() && !PHONE_PATTERN.matcher(phoneNumber).matches()) {
            throw new ValidationException("Invalid phone number format: " + phoneNumber);
        }
    }
    
    /**
     * Validate URL format
     */
    public void validateUrl(String url) {
        if (url != null && !url.trim().isEmpty() && !URL_PATTERN.matcher(url).matches()) {
            throw new ValidationException("Invalid URL format: " + url);
        }
    }
    
    /**
     * Validate ISBN format
     */
    public void validateIsbn(String isbn) {
        if (isbn != null && !isbn.trim().isEmpty() && !ISBN_PATTERN.matcher(isbn).matches()) {
            throw new ValidationException("Invalid ISBN format: " + isbn);
        }
    }
    
    /**
     * Validate ISBN-13 format
     */
    public void validateIsbn13(String isbn13) {
        if (isbn13 != null && !isbn13.trim().isEmpty() && !ISBN13_PATTERN.matcher(isbn13).matches()) {
            throw new ValidationException("Invalid ISBN-13 format: " + isbn13);
        }
    }
    
    /**
     * Validate book ID format
     */
    public void validateBookId(String bookId) {
        if (bookId != null && !bookId.trim().isEmpty() && !BOOK_ID_PATTERN.matcher(bookId).matches()) {
            throw new ValidationException("Invalid book ID format: " + bookId);
        }
    }
    
    /**
     * Validate username format
     */
    public void validateUsername(String username) {
        if (username != null && !username.trim().isEmpty() && !USERNAME_PATTERN.matcher(username).matches()) {
            throw new ValidationException("Invalid username format: " + username);
        }
    }
    
    /**
     * Validate password strength
     */
    public void validatePassword(String password) {
        if (password != null && !password.trim().isEmpty() && !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new ValidationException("Password does not meet security requirements");
        }
    }
    
    /**
     * Validate string length
     */
    public void validateStringLength(String value, String fieldName, int minLength, int maxLength) {
        if (value != null && (value.length() < minLength || value.length() > maxLength)) {
            throw new ValidationException(fieldName + " must be between " + minLength + " and " + maxLength + " characters");
        }
    }
    
    /**
     * Validate numeric range
     */
    public void validateNumericRange(Number value, String fieldName, Number min, Number max) {
        if (value != null) {
            double doubleValue = value.doubleValue();
            if (doubleValue < min.doubleValue() || doubleValue > max.doubleValue()) {
                throw new ValidationException(fieldName + " must be between " + min + " and " + max);
            }
        }
    }
    
    /**
     * Validate required field
     */
    public void validateRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new ValidationException(fieldName + " is required");
        }
    }
    
    /**
     * Validate required field for non-string types
     */
    public void validateRequired(Object value, String fieldName) {
        if (value == null) {
            throw new ValidationException(fieldName + " is required");
        }
    }
    
    /**
     * Sanitize string input
     */
    public String sanitizeString(String input) {
        if (input == null) {
            return null;
        }
        return input.trim().replaceAll("[<>\"']", "");
    }
    
    /**
     * Validate and sanitize search parameters
     */
    public String validateAndSanitizeSearchParam(String searchParam, String paramName) {
        if (searchParam == null) {
            return null;
        }
        
        String sanitized = sanitizeString(searchParam);
        
        // Check for SQL injection patterns
        if (sanitized != null && (sanitized.toLowerCase().contains("select") || 
                                 sanitized.toLowerCase().contains("insert") ||
                                 sanitized.toLowerCase().contains("update") ||
                                 sanitized.toLowerCase().contains("delete") ||
                                 sanitized.toLowerCase().contains("drop") ||
                                 sanitized.toLowerCase().contains("union"))) {
            throw new ValidationException("Invalid search parameter: " + paramName);
        }
        
        return sanitized;
    }
} 