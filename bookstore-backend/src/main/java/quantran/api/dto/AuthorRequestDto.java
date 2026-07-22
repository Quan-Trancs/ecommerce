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
public class AuthorRequestDto {
    
    @NotBlank(message = "Author name is required")
    @Size(min = 1, max = 255, message = "Author name must be between 1 and 255 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Author name contains invalid characters")
    private String name;
    
    @Size(max = 2000, message = "Biography must not exceed 2000 characters")
    private String biography;
    
    @Past(message = "Birth date must be in the past")
    private LocalDate birthDate;
    
    @PastOrPresent(message = "Death date cannot be in the future")
    private LocalDate deathDate;
    
    @Size(max = 100, message = "Country must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Country contains invalid characters")
    private String country;
    
    @Size(max = 100, message = "City must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "City contains invalid characters")
    private String city;
    
    @Email(message = "Email must be a valid email address")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;
    
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone number must be a valid international format")
    private String phoneNumber;
    
    @Size(max = 500, message = "Website URL must not exceed 500 characters")
    @Pattern(regexp = "^(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})([/\\w .-]*)*/?$", 
             message = "Website must be a valid URL")
    private String website;
    
    @Size(max = 1000, message = "Awards must not exceed 1000 characters")
    private String awards;
    
    @Size(max = 100, message = "Nationality must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Nationality contains invalid characters")
    private String nationality;
    
    @Size(max = 50, message = "Language must not exceed 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Language contains invalid characters")
    private String primaryLanguage;
    
    @Min(value = 0, message = "Number of books cannot be negative")
    @Max(value = 10000, message = "Number of books must not exceed 10,000")
    private Integer numberOfBooks;
    
    @AssertTrue(message = "Death date must be after birth date")
    public boolean isDeathDateValid() {
        if (birthDate == null || deathDate == null) {
            return true;
        }
        return deathDate.isAfter(birthDate);
    }
} 