package quantran.api.service;

import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import quantran.api.page.Paginate;
import quantran.api.util.ValidationUtil;

import java.util.Optional;

/**
 * Abstract base service implementation providing common CRUD operations
 * @param <T> The entity type
 * @param <ID> The ID type
 * @param <R> The repository type
 */
@Log4j2
public abstract class AbstractBaseService<T, ID, R extends JpaRepository<T, ID>> implements BaseService<T, ID> {
    
    protected final R repository;
    
    protected AbstractBaseService(R repository) {
        this.repository = repository;
    }
    
    @Override
    public Paginate<T> getAll(int page, int size) {
        log.debug("Getting all entities - page: {}, size: {}", page, size);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<T> pageResult = repository.findAll(pageable);
        
        return new Paginate<>(pageResult.getContent(), (int) pageResult.getTotalElements());
    }
    
    @Override
    public Optional<T> getById(ID id) {
        log.debug("Getting entity by ID: {}", id);
        return repository.findById(id);
    }
    
    @Override
    public T create(T entity) {
        log.info("Creating new entity: {}", entity);
        
        // Validate entity before creation
        validateBeforeCreate(entity);
        
        T savedEntity = repository.save(entity);
        log.info("Entity created successfully with ID: {}", getEntityId(savedEntity));
        
        return savedEntity;
    }
    
    @Override
    public T update(ID id, T entity) {
        log.info("Updating entity with ID: {}", id);
        
        // Validate entity exists
        T existingEntity = ValidationUtil.validateEntityExists(
            repository.findById(id), id, getEntityTypeName()
        );
        
        // Validate entity before update
        validateBeforeUpdate(id, entity);
        
        // Update entity fields
        updateEntityFields(existingEntity, entity);
        
        T savedEntity = repository.save(existingEntity);
        log.info("Entity updated successfully with ID: {}", id);
        
        return savedEntity;
    }
    
    @Override
    public void delete(ID id) {
        log.info("Deleting entity with ID: {}", id);
        
        // Validate entity exists
        T entity = ValidationUtil.validateEntityExists(
            repository.findById(id), id, getEntityTypeName()
        );
        
        // Validate entity can be deleted
        validateBeforeDelete(entity);
        
        repository.delete(entity);
        log.info("Entity deleted successfully with ID: {}", id);
    }
    
    @Override
    public boolean exists(ID id) {
        return repository.existsById(id);
    }
    
    @Override
    public long getTotalCount() {
        return repository.count();
    }
    
    /**
     * Validate entity before creation
     * Override in subclasses to add specific validation logic
     * @param entity The entity to validate
     */
    protected void validateBeforeCreate(T entity) {
        // Default implementation - override in subclasses
    }
    
    /**
     * Validate entity before update
     * Override in subclasses to add specific validation logic
     * @param id The entity ID
     * @param entity The entity to validate
     */
    protected void validateBeforeUpdate(ID id, T entity) {
        // Default implementation - override in subclasses
    }
    
    /**
     * Validate entity before deletion
     * Override in subclasses to add specific validation logic
     * @param entity The entity to validate
     */
    protected void validateBeforeDelete(T entity) {
        // Default implementation - override in subclasses
    }
    
    /**
     * Update entity fields from source entity
     * Override in subclasses to implement specific field updates
     * @param target The target entity to update
     * @param source The source entity with new values
     */
    protected abstract void updateEntityFields(T target, T source);
    
    /**
     * Get the entity ID
     * Override in subclasses to implement ID extraction
     * @param entity The entity
     * @return The entity ID
     */
    protected abstract ID getEntityId(T entity);
    
    /**
     * Get the entity type name for error messages
     * @return The entity type name
     */
    protected abstract String getEntityTypeName();
} 