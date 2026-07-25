package quantran.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import quantran.api.dto.BookRequestDto;
import quantran.api.dto.BookResponseDto;
import quantran.api.exception.GlobalExceptionHandler;
import quantran.api.page.Paginate;
import quantran.api.service.BookService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
class BookControllerTest {

    @Mock
    private BookService bookService;

    @InjectMocks
    private BookController bookController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(bookController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void createBook_Success() throws Exception {
        // Given
        BookRequestDto request = BookRequestDto.builder()
                .id("BOOK001")
                .title("Test Book")
                .author("Test Author")
                .bookType("Fiction")
                .publisherId(1L)
                .price(new BigDecimal("29.99"))
                .stockQuantity(10)
                .build();

        BookResponseDto response = BookResponseDto.builder()
                .id("BOOK001")
                .title("Test Book")
                .price(new BigDecimal("29.99"))
                .build();

        when(bookService.createBook(any(BookRequestDto.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/v1/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("BOOK001"))
                .andExpect(jsonPath("$.title").value("Test Book"));

        verify(bookService).createBook(any(BookRequestDto.class));
    }

    @Test
    void createBook_ValidationError() throws Exception {
        // Given
        BookRequestDto request = BookRequestDto.builder()
                .id("") // Invalid ID
                .title("") // Invalid title
                .build();

        // When & Then
        mockMvc.perform(post("/api/v1/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void findBookById_Success() throws Exception {
        // Given
        BookResponseDto book = BookResponseDto.builder()
                .id("BOOK001")
                .title("Test Book")
                .price(new BigDecimal("29.99"))
                .build();

        when(bookService.findBookById("BOOK001")).thenReturn(Optional.of(book));

        // When & Then
        mockMvc.perform(get("/api/v1/books/BOOK001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("BOOK001"))
                .andExpect(jsonPath("$.title").value("Test Book"));

        verify(bookService).findBookById("BOOK001");
    }

    @Test
    void findBookById_NotFound() throws Exception {
        // Given
        when(bookService.findBookById("NONEXISTENT")).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/v1/books/NONEXISTENT"))
                .andExpect(status().isNotFound());

        verify(bookService).findBookById("NONEXISTENT");
    }

    @Test
    void findBookById_InvalidId() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/books/invalid-id"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void findBooks_Success() throws Exception {
        // Given
        BookResponseDto book1 = BookResponseDto.builder()
                .id("BOOK001")
                .title("Test Book 1")
                .price(new BigDecimal("29.99"))
                .build();

        BookResponseDto book2 = BookResponseDto.builder()
                .id("BOOK002")
                .title("Test Book 2")
                .price(new BigDecimal("39.99"))
                .build();

        Paginate<BookResponseDto> paginatedResult = new Paginate<>(Arrays.asList(book1, book2), 2);

        when(bookService.findBooks(anyString(), anyString(), anyString(), anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(paginatedResult);

        // When & Then
        mockMvc.perform(get("/api/v1/books")
                .param("title", "Test")
                .param("author", "Author")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.data[0].id").value("BOOK001"))
                .andExpect(jsonPath("$.data[1].id").value("BOOK002"));

        verify(bookService).findBooks("Test", "Author", null, null, null, 0, 10);
    }

    @Test
    void findBooks_InvalidPagination() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/books")
                .param("page", "-1")
                .param("size", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateBook_Success() throws Exception {
        // Given
        BookRequestDto request = BookRequestDto.builder()
                .id("BOOK001")
                .title("Updated Book")
                .author("Updated Author")
                .bookType("Fiction")
                .publisherId(1L)
                .price(new BigDecimal("39.99"))
                .stockQuantity(15)
                .build();

        BookResponseDto response = BookResponseDto.builder()
                .id("BOOK001")
                .title("Updated Book")
                .price(new BigDecimal("39.99"))
                .build();

        when(bookService.updateBook(eq("BOOK001"), any(BookRequestDto.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(put("/api/v1/books/BOOK001")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("BOOK001"))
                .andExpect(jsonPath("$.title").value("Updated Book"));

        verify(bookService).updateBook("BOOK001", any(BookRequestDto.class));
    }

    @Test
    void deleteBook_Success() throws Exception {
        // Given
        doNothing().when(bookService).deleteBook("BOOK001");

        // When & Then
        mockMvc.perform(delete("/api/v1/books/BOOK001"))
                .andExpect(status().isNoContent());

        verify(bookService).deleteBook("BOOK001");
    }

    @Test
    void findBookByIsbn_Success() throws Exception {
        // Given
        BookResponseDto book = BookResponseDto.builder()
                .id("BOOK001")
                .title("Test Book")
                .isbn("1234567890")
                .build();

        when(bookService.findBookByIsbn("1234567890")).thenReturn(Optional.of(book));

        // When & Then
        mockMvc.perform(get("/api/v1/books/isbn/1234567890"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isbn").value("1234567890"));

        verify(bookService).findBookByIsbn("1234567890");
    }

    @Test
    void findBooksByPriceRange_Success() throws Exception {
        // Given
        BookResponseDto book = BookResponseDto.builder()
                .id("BOOK001")
                .title("Test Book")
                .price(new BigDecimal("29.99"))
                .build();

        when(bookService.findBooksByPriceRange(any(BigDecimal.class), any(BigDecimal.class)))
                .thenReturn(Arrays.asList(book));

        // When & Then
        mockMvc.perform(get("/api/v1/books/price-range")
                .param("minPrice", "20.00")
                .param("maxPrice", "50.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("BOOK001"));

        verify(bookService).findBooksByPriceRange(new BigDecimal("20.00"), new BigDecimal("50.00"));
    }

    @Test
    void findBooksByPriceRange_InvalidPrice() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/books/price-range")
                .param("minPrice", "-10.00")
                .param("maxPrice", "50.00"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void processBookUpload_Success() throws Exception {
        // Given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "books.csv",
                "text/csv",
                "id,title,author\nBOOK001,Test Book,Test Author".getBytes()
        );

        doNothing().when(bookService).processBookUpload(any());

        // When & Then
        mockMvc.perform(multipart("/api/v1/books/upload")
                .file(file))
                .andExpect(status().isOk());

        verify(bookService).processBookUpload(any());
    }

    @Test
    void processBookUpload_NoFile() throws Exception {
        // When & Then
        mockMvc.perform(multipart("/api/v1/books/upload"))
                .andExpect(status().isBadRequest());
    }
} 