package quantran.api.service.impl;

import quantran.api.dto.BookResponseDto;
import quantran.api.dto.PublisherRequestDto;
import quantran.api.dto.PublisherResponseDto;
import quantran.api.entity.PublisherEntity;
import quantran.api.page.Paginate;
import quantran.api.repository.PublisherRepository;
import quantran.api.service.PublisherService;
import quantran.api.service.AbstractBaseService;
import quantran.api.util.ValidationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PublisherServiceImpl extends AbstractBaseService<PublisherEntity, Long, PublisherRepository> implements PublisherService {

    @Autowired
    public PublisherServiceImpl(PublisherRepository publisherRepository) {
        super(publisherRepository);
    }



    @Override
    protected void validateBeforeCreate(PublisherEntity publisher) {
        ValidationUtil.validateNameDoesNotExist(
            publisher.getName(),
            repository.findByNameIgnoreCase(publisher.getName()),
            "Publisher"
        );
    }

    @Override
    protected void validateBeforeDelete(PublisherEntity publisher) {
        ValidationUtil.validateEntityCanBeDeleted(
            !publisher.getBooks().isEmpty(),
            "Publisher",
            "books"
        );
    }

    @Override
    protected void updateEntityFields(PublisherEntity target, PublisherEntity source) {
        target.setName(source.getName());
        target.setDescription(source.getDescription());
        target.setCountry(source.getCountry());
        target.setCity(source.getCity());
        target.setWebsite(source.getWebsite());
        target.setFoundedYear(source.getFoundedYear());
    }

    @Override
    protected Long getEntityId(PublisherEntity entity) {
        return entity.getId();
    }

    @Override
    protected String getEntityTypeName() {
        return "Publisher";
    }

    // Standardized methods
    @Override
    public PublisherResponseDto createPublisher(PublisherRequestDto request) {
        PublisherEntity publisher = new PublisherEntity();
        publisher.setName(request.getName());
        publisher.setDescription(request.getDescription());
        publisher.setCountry(request.getCountry());
        publisher.setCity(request.getCity());
        publisher.setWebsite(request.getWebsite());
        publisher.setFoundedYear(request.getFoundedYear());
        
        PublisherEntity savedPublisher = create(publisher);
        return convertToResponseDto(savedPublisher);
    }

    @Override
    public Optional<PublisherResponseDto> findPublisherById(Long id) {
        return getById(id).map(this::convertToResponseDto);
    }

    @Override
    public PublisherResponseDto updatePublisher(Long id, PublisherRequestDto request) {
        PublisherEntity publisher = ValidationUtil.validateEntityExists(
            repository.findById(id), id, "Publisher"
        );
        
        publisher.setName(request.getName());
        publisher.setDescription(request.getDescription());
        publisher.setCountry(request.getCountry());
        publisher.setCity(request.getCity());
        publisher.setWebsite(request.getWebsite());
        publisher.setFoundedYear(request.getFoundedYear());
        
        PublisherEntity updatedPublisher = update(id, publisher);
        return convertToResponseDto(updatedPublisher);
    }

    @Override
    public void deletePublisher(Long id) {
        delete(id);
    }

    @Override
    public Paginate<PublisherResponseDto> findPublishers(String name, String country, String city, Boolean isActive, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PublisherEntity> publisherPage = repository.findPublishersWithSearch(name, country, city, isActive, pageable);
        
        List<PublisherResponseDto> responseDtos = publisherPage.getContent().stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
        
        return new Paginate<>(responseDtos, (int) publisherPage.getTotalElements());
    }

    @Override
    public Optional<PublisherResponseDto> findPublisherByName(String name) {
        return repository.findByNameIgnoreCase(name).map(this::convertToResponseDto);
    }

    @Override
    public List<PublisherResponseDto> findPublishersByCountry(String country) {
        return repository.findByCountryIgnoreCase(country).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<PublisherResponseDto> findPublishersByCity(String city) {
        return repository.findByCityIgnoreCase(city).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<PublisherResponseDto> findPublishersByFoundedYear(Integer foundedYear) {
        return repository.findByFoundedYear(foundedYear).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<PublisherResponseDto> findPublishersFoundedBefore(Integer year) {
        return repository.findByFoundedYearBefore(year).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<PublisherResponseDto> findPublishersFoundedAfter(Integer year) {
        return repository.findByFoundedYearAfter(year).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<PublisherResponseDto> findPublishersByBookGenre(String genreName) {
        return repository.findByBookGenre(genreName).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<PublisherResponseDto> findPublishersByBookAuthor(String authorName) {
        return repository.findByBookAuthor(authorName).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<BookResponseDto> findBooksByPublisher(Long publisherId) {
        PublisherEntity publisher = ValidationUtil.validateEntityExists(
            repository.findById(publisherId), publisherId, "Publisher"
        );
        
        return publisher.getBooks().stream()
            .map(this::convertBookToResponseDto)
            .collect(Collectors.toList());
    }

    // Legacy methods (deprecated for backward compatibility)
    @Override
    @Deprecated
    public PublisherEntity createPublisher(PublisherEntity publisher) {
        return create(publisher);
    }

    @Override
    @Deprecated
    public PublisherEntity updatePublisher(Long id, PublisherEntity publisher) {
        return update(id, publisher);
    }

    @Override
    @Deprecated
    public void deletePublisherLegacy(Long id) {
        delete(id);
    }

    @Override
    @Deprecated
    public Paginate<PublisherEntity> getPublishers(String searchName, String searchCountry, String searchCity, Boolean isActive, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<PublisherEntity> publisherPage = repository.findPublishersWithSearch(searchName, searchCountry, searchCity, isActive, pageable);
        return new Paginate<>(publisherPage.getContent(), (int) publisherPage.getTotalElements());
    }

    @Override
    @Deprecated
    public Optional<PublisherEntity> getPublisherByName(String name) {
        return repository.findByNameIgnoreCase(name);
    }

    @Override
    @Deprecated
    public List<PublisherEntity> getPublishersByCountry(String country) {
        return repository.findByCountryIgnoreCase(country);
    }

    @Override
    @Deprecated
    public List<PublisherEntity> getPublishersByCity(String city) {
        return repository.findByCityIgnoreCase(city);
    }

    @Override
    @Deprecated
    public List<PublisherEntity> getPublishersByFoundedYear(Integer foundedYear) {
        return repository.findByFoundedYear(foundedYear);
    }

    @Override
    @Deprecated
    public List<PublisherEntity> getPublishersFoundedBefore(Integer year) {
        return repository.findByFoundedYearBefore(year);
    }

    @Override
    @Deprecated
    public List<PublisherEntity> getPublishersFoundedAfter(Integer year) {
        return repository.findByFoundedYearAfter(year);
    }

    @Override
    @Deprecated
    public List<PublisherEntity> getPublishersByBookGenre(String genreName) {
        return repository.findByBookGenre(genreName);
    }

    @Override
    @Deprecated
    public List<PublisherEntity> getPublishersByBookAuthor(String authorName) {
        return repository.findByBookAuthor(authorName);
    }

    @Override
    @Deprecated
    public List<BookResponseDto> getBooksByPublisher(Long publisherId) {
        return findBooksByPublisher(publisherId);
    }

    // Helper methods for DTO conversion
    private PublisherResponseDto convertToResponseDto(PublisherEntity publisher) {
        return PublisherResponseDto.builder()
            .id(publisher.getId())
            .name(publisher.getName())
            .description(publisher.getDescription())
            .country(publisher.getCountry())
            .city(publisher.getCity())
            .website(publisher.getWebsite())
            .foundedYear(publisher.getFoundedYear())
            .bookCount(publisher.getBookCount())
            .isActive(publisher.getFoundedYear() != null && publisher.getFoundedYear() > 1900)
            .build();
    }

    private BookResponseDto convertBookToResponseDto(quantran.api.entity.BookEntity book) {
        return BookResponseDto.builder()
            .id(book.getId())
            .title(book.getTitle())
            .subtitle(book.getSubtitle())
            .isbn(book.getIsbn())
            .isbn13(book.getIsbn13())
            .description(book.getDescription())
            .pageCount(book.getPageCount())
            .language(book.getLanguage())
            .publicationDate(book.getPublicationDate())
            .edition(book.getEdition())
            .format(book.getFormat())
            .price(book.getPrice())
            .originalPrice(book.getOriginalPrice())
            .discountedPrice(book.getDiscountedPrice())
            .discountPercentage(book.getDiscountPercentage())
            .stockQuantity(book.getStockQuantity())
            .availableQuantity(book.getAvailableQuantity())
            .reservedQuantity(book.getReservedQuantity())
            .reorderPoint(book.getReorderPoint())
            .maxStock(book.getMaxStock())
            .isLowStock(book.isLowStock())
            .isOutOfStock(book.isOutOfStock())
            .createdAt(book.getCreatedAt())
            .updatedAt(book.getUpdatedAt())
            .build();
    }
} 