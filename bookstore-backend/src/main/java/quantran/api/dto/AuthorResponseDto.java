package quantran.api.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorResponseDto {
    private Long id;
    private String name;
    private String biography;
    private LocalDate birthDate;
    private LocalDate deathDate;
    private String country;
    private String website;
    private String email;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Computed fields
    private Integer bookCount;
    @SuppressWarnings("unused")
    private Boolean isAlive;
    
    // Helper methods
    public Boolean getIsAlive() {
        if (deathDate != null) {
            return false;
        }
        return birthDate != null; // If we have birth date but no death date, assume alive
    }
    
    public Integer getAge() {
        if (birthDate == null || deathDate != null) {
            return null;
        }
        return LocalDate.now().getYear() - birthDate.getYear();
    }
    
    public Integer getBookCount() {
        return bookCount != null ? bookCount : 0;
    }
} 