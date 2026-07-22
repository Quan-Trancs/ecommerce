package quantran.api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRequestDto {
    
    @NotBlank(message = "Username is required")
    @Size(min = 8, max = 15, message = "Username must be between 8 and 15 characters")
    @Pattern(regexp = "^[a-zA-Z][a-zA-Z0-9]{7,14}$", message = "Username must start with a letter and contain only letters and numbers")
    private String username;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 20, message = "Password must be between 8 and 20 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,20}$", 
             message = "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character")
    private String password;
    
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(admin|manager|customer)$", message = "Role must be one of: admin, manager, customer")
    private String role;
    
    @Email(message = "Email must be a valid email address")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;
    
    @Size(max = 100, message = "First name must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "First name contains invalid characters")
    private String firstName;
    
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Last name contains invalid characters")
    private String lastName;
    
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone number must be a valid international format")
    private String phoneNumber;
    
    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;
    
    @Size(max = 100, message = "City must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "City contains invalid characters")
    private String city;
    
    @Size(max = 100, message = "Country must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Country contains invalid characters")
    private String country;
    
    @Pattern(regexp = "^[A-Z]{2}$", message = "Country code must be 2 uppercase letters")
    private String countryCode;
} 