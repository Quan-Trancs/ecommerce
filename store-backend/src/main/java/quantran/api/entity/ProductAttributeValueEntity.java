package quantran.api.entity;

import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "product_attribute_values", indexes = {
        @Index(name = "idx_pav_product", columnList = "product_id"),
        @Index(name = "idx_pav_attribute", columnList = "attribute_id"),
        @Index(name = "idx_pav_value_string", columnList = "value_string")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductAttributeValueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attribute_id", nullable = false)
    private AttributeDefinitionEntity attribute;

    @Column(name = "value_string", length = 200)
    private String valueString;

    @Column(name = "value_number", precision = 12, scale = 2)
    private BigDecimal valueNumber;

    public String displayValue() {
        if (valueString != null && !valueString.isEmpty()) {
            return valueString;
        }
        if (valueNumber != null) {
            return valueNumber.stripTrailingZeros().toPlainString();
        }
        return "";
    }
}
