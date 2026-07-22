package quantran.api.util;

import org.springframework.stereotype.Component;
import quantran.api.exception.ResourceConflictException;
import quantran.api.exception.ResourceNotFoundException;

import java.util.Optional;

/**
 * Utility class for common validation patterns across services
 */
@Component
public class ValidationUtil {
    
    /**
     * Validate that an entity with the given name doesn't already exist
     * @param entityName The name to check
     * @param existingEntity Optional containing existing entity if found
     * @param entityType The type of entity (e.g., "Author", "Publisher")
     * @throws ResourceConflictException if entity already exists
     */
    public static <T> void validateNameDoesNotExist(String entityName, Optional<T> existingEntity, String entityType) {
        if (existingEntity.isPresent()) {
            throw new ResourceConflictException(
                String.format("%s with name '%s' already exists", entityType, entityName)
            );
        }
    }
    
    /**
     * Validate that an entity exists
     * @param entity Optional containing the entity
     * @param entityId The ID of the entity
     * @param entityType The type of entity (e.g., "Author", "Publisher")
     * @return The entity if it exists
     * @throws ResourceNotFoundException if entity doesn't exist
     */
    public static <T> T validateEntityExists(Optional<T> entity, Object entityId, String entityType) {
        return entity.orElseThrow(() -> 
            new ResourceNotFoundException(
                String.format("%s not found with id: %s", entityType, entityId)
            )
        );
    }
    
    /**
     * Validate that an entity can be deleted (no dependent relationships)
     * @param hasDependencies Whether the entity has dependencies
     * @param entityType The type of entity
     * @param dependencyType The type of dependency (e.g., "books")
     * @throws ResourceConflictException if entity has dependencies
     */
    public static void validateEntityCanBeDeleted(boolean hasDependencies, String entityType, String dependencyType) {
        if (hasDependencies) {
            throw new ResourceConflictException(
                String.format("Cannot delete %s with existing %s. Remove %s first.", 
                    entityType, dependencyType, dependencyType)
            );
        }
    }
    
    /**
     * Validate that a string parameter is not null or empty
     * @param value The value to validate
     * @param paramName The name of the parameter for error messages
     * @throws IllegalArgumentException if value is null or empty
     */
    public static void validateRequiredString(String value, String paramName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(paramName + " is required");
        }
    }
    
    /**
     * Validate that a numeric parameter is positive
     * @param value The value to validate
     * @param paramName The name of the parameter for error messages
     * @throws IllegalArgumentException if value is not positive
     */
    public static void validatePositiveNumber(Number value, String paramName) {
        if (value == null || value.doubleValue() <= 0) {
            throw new IllegalArgumentException(paramName + " must be positive");
        }
    }
} 