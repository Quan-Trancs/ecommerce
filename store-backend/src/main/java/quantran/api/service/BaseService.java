package quantran.api.service;

import quantran.api.page.Paginate;

import java.util.Optional;

/**
 * Base service interface defining common CRUD operations
 * @param <T> The entity type
 * @param <ID> The ID type
 */
public interface BaseService<T, ID> {
    
    /**
     * Get all entities with pagination and search
     * @param page Page number (0-based)
     * @param size Page size
     * @return Paginated results
     */
    Paginate<T> getAll(int page, int size);
    
    /**
     * Get entity by ID
     * @param id The entity ID
     * @return Optional containing the entity
     */
    Optional<T> getById(ID id);
    
    /**
     * Create a new entity
     * @param entity The entity to create
     * @return The created entity
     */
    T create(T entity);
    
    /**
     * Update an existing entity
     * @param id The entity ID
     * @param entity The updated entity data
     * @return The updated entity
     */
    T update(ID id, T entity);
    
    /**
     * Delete an entity
     * @param id The entity ID
     */
    void delete(ID id);
    
    /**
     * Check if entity exists
     * @param id The entity ID
     * @return true if entity exists
     */
    boolean exists(ID id);
    
    /**
     * Get total count of entities
     * @return Total count
     */
    long getTotalCount();
} 