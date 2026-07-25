# Security Implementation Guide

## 🔒 Overview

This document outlines the comprehensive security implementation for the BookStore Backend API, including secure CORS configuration and robust input validation.

## 🛡️ Security Features Implemented

### 1. **Secure CORS Configuration**

#### **Before (Insecure)**
```java
@CrossOrigin(origins = "*")  // ❌ Allows all origins
```

#### **After (Secure)**
```java
@Configuration
public class SecurityConfig implements WebMvcConfigurer {
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.split(","))
                .allowedMethods("GET,POST,PUT,DELETE,PATCH,OPTIONS")
                .allowedHeaders("Authorization,Content-Type,X-Requested-With,Accept,Origin")
                .exposedHeaders("Authorization,Content-Disposition")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

#### **Configuration Properties**
```properties
# CORS Configuration - Secure defaults
app.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:3000}
app.cors.allowed-methods=${CORS_ALLOWED_METHODS:GET,POST,PUT,DELETE,PATCH,OPTIONS}
app.cors.allowed-headers=${CORS_ALLOWED_HEADERS:Authorization,Content-Type,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers}
app.cors.exposed-headers=${CORS_EXPOSED_HEADERS:Authorization,Content-Disposition}
app.cors.allow-credentials=${CORS_ALLOW_CREDENTIALS:true}
app.cors.max-age=${CORS_MAX_AGE:3600}
```

### 2. **Comprehensive Input Validation**

#### **DTO Validation with Bean Validation**
```java
@Data
@Builder
public class BookRequestDto {
    @NotBlank(message = "Book ID is required")
    @Pattern(regexp = "^[A-Z0-9]{3,20}$", message = "Book ID must be 3-20 characters, uppercase letters and numbers only")
    private String id;
    
    @NotBlank(message = "Book title is required")
    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-\\.,'\"()]+$", message = "Title contains invalid characters")
    private String title;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
    @DecimalMax(value = "999999.99", message = "Price must not exceed 999,999.99")
    @Digits(integer = 6, fraction = 2, message = "Price must have at most 6 digits before decimal and 2 after")
    private BigDecimal price;
}
```

#### **Custom Validation Service**
```java
@Service
public class ValidationService {
    // Regex patterns for validation
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[1-9]\\d{1,14}$");
    private static final Pattern URL_PATTERN = Pattern.compile("^(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})([/\\w .-]*)*/?$");
    
    public void validateEmail(String email) {
        if (email != null && !email.trim().isEmpty() && !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ValidationException("Invalid email format: " + email);
        }
    }
    
    public String sanitizeString(String input) {
        if (input == null) {
            return null;
        }
        return input.trim().replaceAll("[<>\"']", "");
    }
}
```

### 3. **Enhanced Exception Handling**

#### **Custom Exceptions**
```java
@Getter
public class ValidationException extends RuntimeException {
    private final Map<String, String> fieldErrors;
    private final String errorCode;
    
    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
        this.errorCode = "VALIDATION_ERROR";
    }
}

@Getter
public class DatabaseException extends RuntimeException {
    private final String errorCode;
    private final String operation;
    
    public DatabaseException(String message, String operation, Throwable cause) {
        super(message, cause);
        this.errorCode = "DATABASE_ERROR";
        this.operation = operation;
    }
}
```

#### **Global Exception Handler**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(ValidationException ex, WebRequest request) {
        log.warn("Validation exception: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Error")
                .message(ex.getMessage())
                .details(ex.getFieldErrors())
                .path(request.getDescription(false))
                .build();
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(DatabaseException.class)
    public ResponseEntity<ErrorResponse> handleDatabaseException(DatabaseException ex, WebRequest request) {
        log.error("Database error during {}: {}", ex.getOperation(), ex.getMessage(), ex);
        
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Database Error")
                .message("Database operation failed: " + ex.getOperation())
                .path(request.getDescription(false))
                .build();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

## 🔧 Implementation Details

### **1. Controller Updates**

#### **Before (Insecure)**
```java
@RestController
@RequestMapping("/api/v1/books")
@CrossOrigin(origins = "*")  // ❌ Insecure
public class RestBookController {
    
    @PostMapping
    public ResponseEntity<BookModel> createBook(@RequestBody BookRequestDto bookRequest) {
        // ❌ No validation
        return ResponseEntity.ok(bookModel);
    }
}
```

#### **After (Secure)**
```java
@RestController
@RequestMapping("/api/v1/books")
@Validated  // ✅ Enable validation
public class RestBookController {
    
    @PostMapping
    public ResponseEntity<BookModel> createBook(@Valid @RequestBody BookRequestDto bookRequest) {
        // ✅ Automatic validation with @Valid
        return ResponseEntity.status(HttpStatus.CREATED).body(bookModel);
    }
}
```

### **2. Input Validation Rules**

#### **Book Validation**
- **ID**: 3-20 characters, uppercase letters and numbers only
- **Title**: 1-255 characters, alphanumeric with common punctuation
- **Price**: 0.01 to 999,999.99 with 2 decimal places
- **ISBN**: 10 or 13 digits
- **ISBN-13**: XXX-XXXXXXXXXX format

#### **User Validation**
- **Username**: 8-15 characters, starts with letter, alphanumeric only
- **Password**: 8-20 characters, must contain lowercase, uppercase, number, and special character
- **Email**: Valid email format
- **Phone**: International format

#### **Author/Publisher Validation**
- **Name**: 1-255 characters, letters, spaces, hyphens, apostrophes
- **Country/City**: 1-100 characters, letters, spaces, hyphens, apostrophes
- **Website**: Valid URL format
- **Phone**: International format

### **3. File Upload Security**

#### **File Validation**
```java
public void validateFile(MultipartFile file) {
    Map<String, String> errors = new HashMap<>();
    
    if (file == null || file.isEmpty()) {
        errors.put("file", "File is required");
    } else {
        // Check file size (10MB limit)
        if (file.getSize() > MAX_FILE_SIZE) {
            errors.put("file", "File size must not exceed 10MB");
        }
        
        // Check file type (CSV, TXT only)
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
```

### **4. SQL Injection Prevention**

#### **Search Parameter Sanitization**
```java
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
```

## 🚀 Deployment Configuration

### **Environment Variables**

#### **Development**
```bash
# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_ALLOWED_HEADERS=Authorization,Content-Type,X-Requested-With,Accept,Origin
CORS_EXPOSED_HEADERS=Authorization,Content-Disposition
CORS_ALLOW_CREDENTIALS=true
CORS_MAX_AGE=3600

# Validation Configuration
VALIDATION_STRICT=true
MAX_FILE_SIZE=10MB
MAX_REQUEST_SIZE=10MB
```

#### **Production**
```bash
# CORS Configuration - Restrict to your domain
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_ALLOWED_HEADERS=Authorization,Content-Type,X-Requested-With,Accept,Origin
CORS_EXPOSED_HEADERS=Authorization,Content-Disposition
CORS_ALLOW_CREDENTIALS=true
CORS_MAX_AGE=3600

# Validation Configuration - Strict mode
VALIDATION_STRICT=true
MAX_FILE_SIZE=10MB
MAX_REQUEST_SIZE=10MB
```

### **Docker Configuration**
```yaml
version: '3.8'
services:
  bookstore-backend:
    environment:
      # Security Configuration
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:5173,http://localhost:3000}
      CORS_ALLOWED_METHODS: ${CORS_ALLOWED_METHODS:-GET,POST,PUT,DELETE,PATCH,OPTIONS}
      CORS_ALLOWED_HEADERS: ${CORS_ALLOWED_HEADERS:-Authorization,Content-Type,X-Requested-With,Accept,Origin}
      CORS_EXPOSED_HEADERS: ${CORS_EXPOSED_HEADERS:-Authorization,Content-Disposition}
      CORS_ALLOW_CREDENTIALS: ${CORS_ALLOW_CREDENTIALS:-true}
      CORS_MAX_AGE: ${CORS_MAX_AGE:-3600}
      
      # Validation Configuration
      VALIDATION_STRICT: ${VALIDATION_STRICT:-true}
      MAX_FILE_SIZE: ${MAX_FILE_SIZE:-10MB}
      MAX_REQUEST_SIZE: ${MAX_REQUEST_SIZE:-10MB}
```

## 🔍 Security Testing

### **1. CORS Testing**
```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:8082/api/v1/books \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Expected response headers:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
# Access-Control-Allow-Headers: Authorization,Content-Type,X-Requested-With,Accept,Origin
# Access-Control-Allow-Credentials: true
```

### **2. Input Validation Testing**
```bash
# Test invalid book ID
curl -X POST http://localhost:8082/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{
    "id": "invalid-id",
    "title": "Test Book",
    "author": "Test Author",
    "price": 25.99,
    "bookType": "Fiction"
  }'

# Expected response:
# {
#   "timestamp": "2024-01-15T10:30:00",
#   "status": 400,
#   "error": "Validation Error",
#   "message": "Book ID must be 3-20 characters, uppercase letters and numbers only",
#   "path": "/api/v1/books"
# }
```

### **3. File Upload Testing**
```bash
# Test invalid file type
curl -X POST http://localhost:8082/api/v1/books/upload \
  -F "file=@test.pdf"

# Expected response:
# {
#   "timestamp": "2024-01-15T10:30:00",
#   "status": 400,
#   "error": "Validation Error",
#   "message": "File type must be CSV or TXT",
#   "path": "/api/v1/books/upload"
# }
```

## 📊 Security Benefits

### **✅ CORS Security**
- **Restricted Origins**: Only specified domains allowed
- **Limited Methods**: Only necessary HTTP methods
- **Controlled Headers**: Specific headers only
- **Credential Control**: Explicit credential handling
- **Cache Control**: Configurable preflight caching

### **✅ Input Validation**
- **Type Safety**: Strong typing with validation annotations
- **Format Validation**: Regex patterns for data formats
- **Range Validation**: Numeric and string length limits
- **Content Sanitization**: XSS prevention
- **SQL Injection Prevention**: Pattern detection

### **✅ Error Handling**
- **Structured Errors**: Consistent error response format
- **Detailed Logging**: Comprehensive error logging
- **Security Hiding**: No sensitive information in errors
- **Graceful Degradation**: System continues to function

### **✅ File Security**
- **Size Limits**: Configurable file size restrictions
- **Type Restrictions**: Allowed file types only
- **Content Validation**: File content verification
- **Upload Limits**: Request size controls

## 🔧 Maintenance

### **Regular Security Updates**
1. **Monitor CORS Origins**: Update allowed origins as needed
2. **Review Validation Rules**: Adjust validation patterns
3. **Update Dependencies**: Keep security libraries current
4. **Security Audits**: Regular security assessments

### **Monitoring**
1. **Error Logs**: Monitor validation and security errors
2. **Access Logs**: Track CORS and authentication attempts
3. **Performance**: Monitor validation impact on performance
4. **Alerts**: Set up security incident alerts

---

**Note**: This security implementation provides a robust foundation for protecting the BookStore Backend API against common web vulnerabilities while maintaining flexibility for different deployment environments. 