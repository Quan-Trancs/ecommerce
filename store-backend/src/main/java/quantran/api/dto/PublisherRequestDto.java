package quantran.api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.validation.constraints.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublisherRequestDto {
    
    @NotBlank(message = "Publisher name is required")
    @Size(min = 1, max = 255, message = "Publisher name must be between 1 and 255 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-\\.,'\"()&]+$", message = "Publisher name contains invalid characters")
    private String name;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
    
    @Size(max = 100, message = "Country must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Country contains invalid characters")
    private String country;
    
    @Size(max = 100, message = "City must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "City contains invalid characters")
    private String city;
    
    @Size(max = 500, message = "Website URL must not exceed 500 characters")
    @Pattern(regexp = "^(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})([/\\w .-]*)*/?$", 
             message = "Website must be a valid URL")
    private String website;
    
    @PastOrPresent(message = "Founded year cannot be in the future")
    private Integer foundedYear;
    
    @Email(message = "Email must be a valid email address")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;
    
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone number must be a valid international format")
    private String phoneNumber;
    
    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;
    
    @Size(max = 20, message = "Postal code must not exceed 20 characters")
    @Pattern(regexp = "^[A-Z0-9\\s\\-]+$", message = "Postal code contains invalid characters")
    private String postalCode;
    
    @Size(max = 100, message = "Contact person must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Contact person contains invalid characters")
    private String contactPerson;
    
    @Min(value = 0, message = "Number of employees cannot be negative")
    @Max(value = 100000, message = "Number of employees must not exceed 100,000")
    private Integer numberOfEmployees;
    
    @Size(max = 100, message = "Industry must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Industry contains invalid characters")
    private String industry;
    
    @AssertTrue(message = "Founded year must be reasonable")
    public boolean isFoundedYearValid() {
        if (foundedYear == null) {
            return true;
        }
        int currentYear = LocalDate.now().getYear();
        return foundedYear >= 1400 && foundedYear <= currentYear;
    }
} 