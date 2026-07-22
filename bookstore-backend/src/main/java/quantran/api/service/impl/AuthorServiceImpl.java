package quantran.api.service.impl;

import quantran.api.dto.AuthorRequestDto;
import quantran.api.dto.AuthorResponseDto;
import quantran.api.dto.BookResponseDto;
import quantran.api.entity.AuthorEntity;
import quantran.api.entity.BookEntity;
import quantran.api.page.Paginate;
import quantran.api.repository.AuthorRepository;
import quantran.api.service.AuthorService;
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
public class AuthorServiceImpl extends AbstractBaseService<AuthorEntity, Long, AuthorRepository> implements AuthorService {

    @Autowired
    public AuthorServiceImpl(AuthorRepository authorRepository) {
        super(authorRepository);
    }

    @Override
    public Optional<AuthorEntity> getAuthorByName(String name) {
        return repository.findByNameIgnoreCase(name);
    }

    @Override
    public AuthorResponseDto createAuthor(AuthorRequestDto request) {
        AuthorEntity author = new AuthorEntity();
        author.setName(request.getName());
        author.setBiography(request.getBiography());
        author.setBirthDate(request.getBirthDate());
        author.setCountry(request.getCountry());
        author.setWebsite(request.getWebsite());
        
        AuthorEntity savedAuthor = create(author);
        return convertToResponseDto(savedAuthor);
    }

    @Override
    public Optional<AuthorResponseDto> findAuthorById(Long id) {
        return repository.findById(id).map(this::convertToResponseDto);
    }

    @Override
    public AuthorResponseDto updateAuthor(Long id, AuthorRequestDto request) {
        AuthorEntity author = ValidationUtil.validateEntityExists(
            repository.findById(id), id, "Author"
        );
        
        author.setName(request.getName());
        author.setBiography(request.getBiography());
        author.setBirthDate(request.getBirthDate());
        author.setCountry(request.getCountry());
        author.setWebsite(request.getWebsite());
        
        AuthorEntity updatedAuthor = update(id, author);
        return convertToResponseDto(updatedAuthor);
    }

    @Override
    public void deleteAuthor(Long id) {
        delete(id);
    }

    @Override
    public Paginate<AuthorResponseDto> findAuthors(String name, String country, Boolean isAlive, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuthorEntity> authorPage = repository.findAuthorsWithSearch(name, country, isAlive, pageable);
        
        List<AuthorResponseDto> responseDtos = authorPage.getContent().stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
        
        return new Paginate<>(responseDtos, (int) authorPage.getTotalElements());
    }

    @Override
    public Optional<AuthorResponseDto> findAuthorByName(String name) {
        return repository.findByNameIgnoreCase(name).map(this::convertToResponseDto);
    }

    @Override
    public List<AuthorResponseDto> findAuthorsByCountry(String country) {
        return repository.findByCountryIgnoreCase(country).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<AuthorResponseDto> findAuthorsByBirthYearRange(int startYear, int endYear) {
        return repository.findByBirthYearRange(startYear, endYear).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<AuthorResponseDto> findAuthorsByBookGenre(String genreName) {
        return repository.findByBookGenre(genreName).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<AuthorResponseDto> findAuthorsByBookPublisher(String publisherName) {
        return repository.findByBookPublisher(publisherName).stream()
            .map(this::convertToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    public List<BookResponseDto> findBooksByAuthor(Long authorId) {
        AuthorEntity author = ValidationUtil.validateEntityExists(
            repository.findById(authorId), authorId, "Author"
        );
        
        return author.getBooks().stream()
            .map(this::convertBookToResponseDto)
            .collect(Collectors.toList());
    }

    @Override
    protected void validateBeforeCreate(AuthorEntity author) {
        ValidationUtil.validateNameDoesNotExist(
            author.getName(),
            repository.findByNameIgnoreCase(author.getName()),
            "Author"
        );
    }

    @Override
    protected void validateBeforeDelete(AuthorEntity author) {
        ValidationUtil.validateEntityCanBeDeleted(
            !author.getBooks().isEmpty(),
            "Author",
            "books"
        );
    }

    @Override
    protected void updateEntityFields(AuthorEntity target, AuthorEntity source) {
        target.setName(source.getName());
        target.setBiography(source.getBiography());
        target.setBirthDate(source.getBirthDate());
        target.setCountry(source.getCountry());
    }

    @Override
    protected Long getEntityId(AuthorEntity entity) {
        return entity.getId();
    }

    @Override
    protected String getEntityTypeName() {
        return "Author";
    }

    // Legacy methods (deprecated for backward compatibility)
    @Override
    @Deprecated
    public AuthorEntity createAuthor(AuthorEntity author) {
        return create(author);
    }

    @Override
    @Deprecated
    public AuthorEntity updateAuthor(Long id, AuthorEntity author) {
        return update(id, author);
    }

    @Override
    @Deprecated
    public void deleteAuthorLegacy(Long id) {
        delete(id);
    }

    @Override
    @Deprecated
    public Paginate<AuthorEntity> getAuthors(String searchName, String searchCountry, Boolean isAlive, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<AuthorEntity> authorPage = repository.findAuthorsWithSearch(searchName, searchCountry, isAlive, pageable);
        return new Paginate<>(authorPage.getContent(), (int) authorPage.getTotalElements());
    }

    @Override
    @Deprecated
    public List<AuthorEntity> getAuthorsByCountry(String country) {
        return repository.findByCountryIgnoreCase(country);
    }

    @Override
    @Deprecated
    public List<AuthorEntity> getAuthorsByBirthYearRange(int startYear, int endYear) {
        return repository.findByBirthYearRange(startYear, endYear);
    }

    @Override
    @Deprecated
    public List<AuthorEntity> getAuthorsByBookGenre(String genreName) {
        return repository.findByBookGenre(genreName);
    }

    @Override
    @Deprecated
    public List<AuthorEntity> getAuthorsByBookPublisher(String publisherName) {
        return repository.findByBookPublisher(publisherName);
    }

    @Override
    @Deprecated
    public List<BookResponseDto> getBooksByAuthor(Long authorId) {
        return findBooksByAuthor(authorId);
    }

    // Helper methods for DTO conversion
    private AuthorResponseDto convertToResponseDto(AuthorEntity author) {
        return AuthorResponseDto.builder()
            .id(author.getId())
            .name(author.getName())
            .biography(author.getBiography())
            .birthDate(author.getBirthDate())
            .country(author.getCountry())
            .website(author.getWebsite())
            .bookCount(author.getBookCount())
            .isAlive(author.getBirthDate() == null || author.getBirthDate().getYear() < 2024)
            .build();
    }

    private BookResponseDto convertBookToResponseDto(BookEntity book) {
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