package quantran.api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublisherResponseDto {
    private Long id;
    private String name;
    private String description;
    private String country;
    private String city;
    private String website;
    private String email;
    private String phone;
    private Integer foundedYear;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Computed fields
    private Integer bookCount;
    
    // Helper methods
    public Integer getYearsInBusiness() {
        if (foundedYear == null) {
            return null;
        }
        return java.time.Year.now().getValue() - foundedYear;
    }
    
    public Integer getBookCount() {
        return bookCount != null ? bookCount : 0;
    }
} 