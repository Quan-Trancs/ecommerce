package quantran.api.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponseDto {
    private String id;
    private String name;
    private String slug;
    private String description;
    private String parentId;
    private String imageUrl;
    private Integer sortOrder;
    private Boolean isActive;
    @Builder.Default
    private List<CategoryResponseDto> children = new ArrayList<>();
}
