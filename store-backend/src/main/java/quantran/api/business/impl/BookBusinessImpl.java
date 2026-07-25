package quantran.api.business.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import quantran.api.repository.BookRepository;
import quantran.api.repository.BookTypeRepository;
import quantran.api.entity.BookTypeEntity;
import quantran.api.business.BookBusiness;
import quantran.api.entity.BookEntity;
import quantran.api.model.BookModel;
import quantran.api.page.Paginate;
import quantran.api.exception.BookNotFoundException;
import quantran.api.exception.DuplicateBookException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class BookBusinessImpl implements BookBusiness {
    private final BookRepository bookRepository;
    private final BookTypeRepository bookTypeRepository;
    
    @Override
    public List<BookTypeEntity> getBookType() {
        log.info("Start getBookType()");
        List<BookTypeEntity> bookTypes = bookTypeRepository.findAll();
        log.info("End getBookType(), found {} types", bookTypes.size());
        return bookTypes;
    }
    
    @Override
    public Paginate<BookModel> getBook(String searchId, String searchName, String searchAuthor, String searchGenre, String searchPublisher, int page, int pageSize) {
        log.info("Start getBook() - searchId: {}, searchName: {}, searchAuthor: {}, searchGenre: {}, searchPublisher: {}, page: {}, pageSize: {}", 
                searchId, searchName, searchAuthor, searchGenre, searchPublisher, page, pageSize);
        
        // Normalize search parameters
        String normalizedSearchId = searchId != null && !searchId.trim().isEmpty() ? searchId.trim() : null;
        String normalizedSearchName = searchName != null && !searchName.trim().isEmpty() ? searchName.trim() : null;
        String normalizedSearchAuthor = searchAuthor != null && !searchAuthor.trim().isEmpty() ? searchAuthor.trim() : null;
        String normalizedSearchGenre = searchGenre != null && !searchGenre.trim().isEmpty() ? searchGenre.trim() : null;
        String normalizedSearchPublisher = searchPublisher != null && !searchPublisher.trim().isEmpty() ? searchPublisher.trim() : null;
        
        Pageable currentPage = PageRequest.of(page, pageSize);
        Page<BookEntity> bookEntitiesPage = bookRepository.findBooksWithSearch(
                normalizedSearchName, normalizedSearchAuthor, normalizedSearchId, normalizedSearchGenre, normalizedSearchPublisher, currentPage);
        
        List<BookModel> bookModels = bookEntitiesPage.getContent().stream()
                .map(BookModel::new)
                .collect(Collectors.toList());
        
        int totalPages = bookEntitiesPage.getTotalPages();
        Paginate<BookModel> paginate = new Paginate<>(bookModels, totalPages);
        
        log.info("End getBook(), found {} books, total pages: {}", bookModels.size(), totalPages);
        return paginate;
    }
    
    @Override
    public String downloadBook() {
        log.info("Start downloadBook()");
        List<BookEntity> bookEntities = bookRepository.findAll();
        String csvContent = bookEntities.stream()
                .map(BookModel::new)
                .map(bookModel -> String.format("%s,%s,%s,%s,%s", 
                        bookModel.getId(), 
                        bookModel.getName(), 
                        bookModel.getAuthor(), 
                        bookModel.getBookType(), 
                        bookModel.getPrice()))
                .collect(Collectors.joining(System.lineSeparator()));
        
        log.info("End downloadBook(), exported {} books", bookEntities.size());
        return csvContent;
    }
    
    @Override
    public void uploadBook(List<BookModel> bookModels) {
        log.info("Start uploadBook() with {} books", bookModels.size());
        
        List<BookEntity> bookEntities = bookModels.stream()
                .map(BookEntity::new)
                .collect(Collectors.toList());
        
        bookRepository.saveAll(bookEntities);
        log.info("End uploadBook(), successfully uploaded {} books", bookEntities.size());
    }
    
    @Override
    public void addBook(BookModel bookModel) {
        log.info("Start addBook() - ID: {}", bookModel.getId());
        
        // Check if book already exists by ID
        if (bookRepository.existsById(bookModel.getId())) {
            throw new DuplicateBookException("Book with ID " + bookModel.getId() + " already exists");
        }
        
        // Check if book already exists by title and author
        if (bookRepository.existsByTitleAndAuthor(bookModel.getName(), bookModel.getAuthor())) {
            throw new DuplicateBookException("Book with title '" + bookModel.getName() + "' by author '" + bookModel.getAuthor() + "' already exists");
        }
        
        BookEntity bookEntity = new BookEntity(bookModel);
        bookRepository.save(bookEntity);
        log.info("End addBook(), successfully added book with ID: {}", bookModel.getId());
    }
    
    @Override
    public void delBook(String delId) {
        log.info("Start delBook() - ID: {}", delId);
        
        if (!bookRepository.existsById(delId)) {
            throw new BookNotFoundException("Book with ID " + delId + " not found");
        }
        
        bookRepository.deleteById(delId);
        log.info("End delBook(), successfully deleted book with ID: {}", delId);
    }
    
    @Override
    public void updateBook(BookModel bookModel) {
        log.info("Start updateBook() - ID: {}", bookModel.getId());
        
        if (!bookRepository.existsById(bookModel.getId())) {
            throw new BookNotFoundException("Book with ID " + bookModel.getId() + " not found");
        }
        
        BookEntity bookEntity = new BookEntity(bookModel);
        bookRepository.save(bookEntity);
        log.info("End updateBook(), successfully updated book with ID: {}", bookModel.getId());
    }
}
