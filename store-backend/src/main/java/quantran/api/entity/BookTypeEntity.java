package quantran.api.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "bookType", indexes = {
    @Index(name = "idx_booktype_name", columnList = "name"),
    @Index(name = "idx_booktype_parent", columnList = "parent_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookTypeEntity {
    
    @Id
    @Column(name = "id", length = 50)
    @NotBlank(message = "Book type ID is required")
    private String id;
    
    @Column(name = "name", nullable = false, length = 100)
    @NotBlank(message = "Book type name is required")
    @Size(min = 1, max = 100, message = "Book type name must be between 1 and 100 characters")
    private String name;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "parent_id", length = 50)
    private String parentId; // For hierarchical categories
    
    @Column(name = "age_rating", length = 10)
    private String ageRating; // G, PG, PG-13, R, etc.
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToMany(mappedBy = "genres")
    @JsonBackReference
    private List<BookEntity> bookEntities;
    
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
} 