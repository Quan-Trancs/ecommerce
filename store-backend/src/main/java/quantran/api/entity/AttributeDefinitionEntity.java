package quantran.api.entity;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attribute_definitions", indexes = {
        @Index(name = "idx_attr_code", columnList = "code", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeDefinitionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stable machine key used in facet query params, e.g. color, size, material */
    @Column(nullable = false, length = 50, unique = true)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    /** STRING | NUMBER | BOOLEAN */
    @Column(name = "data_type", nullable = false, length = 20)
    @Builder.Default
    private String dataType = "STRING";

    @Column(name = "is_filterable", nullable = false)
    @Builder.Default
    private Boolean isFilterable = true;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isFilterable == null) {
            isFilterable = true;
        }
        if (dataType == null) {
            dataType = "STRING";
        }
        if (sortOrder == null) {
            sortOrder = 0;
        }
    }
}
