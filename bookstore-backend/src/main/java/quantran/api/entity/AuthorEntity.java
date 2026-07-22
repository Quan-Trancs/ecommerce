package quantran.api.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "authors", indexes = {
    @Index(name = "idx_author_name", columnList = "name"),
    @Index(name = "idx_author_country", columnList = "country"),
    @Index(name = "idx_author_birth_date", columnList = "birth_date"), // For birth year range queries
    @Index(name = "idx_author_death_date", columnList = "death_date") // For living/deceased queries
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", nullable = false, length = 255)
    @NotBlank(message = "Author name is required")
    @Size(min = 1, max = 255, message = "Author name must be between 1 and 255 characters")
    private String name;
    
    @Column(name = "biography", columnDefinition = "TEXT")
    private String biography;
    
    @Column(name = "birth_date")
    private LocalDate birthDate;
    
    @Column(name = "death_date")
    private LocalDate deathDate;
    
    @Column(name = "country", length = 100)
    private String country;
    
    @Column(name = "website", length = 500)
    private String website;
    
    @Column(name = "email", length = 255)
    private String email;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Relationships
    @ManyToMany(mappedBy = "authors", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<BookEntity> books = new HashSet<>();
    
    // Computed fields
    @Transient
    private Integer bookCount;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Helper methods
    public boolean isAlive() {
        return deathDate == null;
    }
    
    public Integer getAge() {
        if (birthDate == null || deathDate != null) {
            return null;
        }
        return LocalDate.now().getYear() - birthDate.getYear();
    }
    
    public Integer getBookCount() {
        return bookCount != null ? bookCount : (books != null ? books.size() : 0);
    }
    
    public void setBookCount(Integer bookCount) {
        this.bookCount = bookCount;
    }
} 