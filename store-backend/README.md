# Store Backend API

Commercial catalog API for the ecommerce monorepo (`store-backend/`), paired with the Next.js storefront.

Provides products, hierarchical categories, brands, filterable attributes, inventory, and Amazon-style faceted search — plus legacy book endpoints still present for compatibility.

## Features

### Core Functionality
- **Product catalog**: CRUD + faceted search (`/api/v1/products`)
- **Category tree**: hierarchical browse taxonomy (`/api/v1/categories`)
- **Brands & attributes**: dynamic filter criteria (color, size, material, …)
- **Inventory**: stock tracking on products
- **User Authentication**: login with password hashing and roles
- **Pricing**: USD-based pricing

### Advanced Features
- **Async Processing**: Background task processing with status tracking
- **Rate Limiting**: API rate limiting for security
- **Health Monitoring**: Actuator health checks and metrics
- **Caching**: Caffeine + Redis
- **Security**: Input validation, CORS, environment-based configuration

### Production Ready
- **Monitoring**: Spring Boot Actuator with health checks and metrics
- **Logging**: Structured logging with file rotation
- **Performance**: Optimized database queries and connection pooling
- **Security**: Rate limiting, input validation, and secure defaults
- **Scalability**: Async processing and background workers

## 🛠️ Technology Stack

- **Java 8**
- **Spring Boot 2.7.4**
- **Spring Data JPA**
- **PostgreSQL 12+**
- **Lombok**
- **Gradle**
- **Spring Boot Actuator**
- **Caffeine Cache**
- **JWT (for future token-based auth)**
- **Frontend Currency Conversion** (ExchangeRate-API, Fixer.io)

## 📋 Prerequisites

- Java 8 or higher
- PostgreSQL 12 or higher
- Gradle (or use the included wrapper)
- Docker (optional, for containerized deployment)

## 🔧 Quick Start

### 1. Database Setup

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE bookstore;
CREATE USER bookstore_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bookstore TO bookstore_user;
\q

# Initialize schema
psql -h localhost -U bookstore_user -d bookstore -f src/main/resources/db/init.sql
```

### 2. Environment Configuration

Create `.env` file in the project root:
```bash
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/bookstore
DB_USERNAME=bookstore_user
DB_PASSWORD=your_secure_password

# Server Configuration
SERVER_PORT=8082
SERVER_SERVLET_CONTEXT_PATH=/api

# Security Configuration
CORS_ALLOWED_ORIGINS=*
APP_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE=100
APP_RATE_LIMIT_ENABLED=true
```

### 3. Run the Application

```bash
# Using Gradle
./gradlew bootRun

# Or build and run JAR
./gradlew build
java -jar build/libs/BookStoreBackEnd-0.0.1-SNAPSHOT.jar
```

The application will start on `http://localhost:8082/api`

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Set environment variables
export DB_PASSWORD=your_secure_password

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f bookstore-backend
```

### Manual Docker Build

```bash
# Build image
docker build -t bookstore-backend .

# Run container
docker run -d \
  --name bookstore-backend \
  -p 8082:8082 \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/bookstore \
  -e DB_USERNAME=bookstore_user \
  -e DB_PASSWORD=your_secure_password \
  bookstore-backend
```

## 📚 API Endpoints

### Authentication
- `POST /api/user/login` - User login

### Books
- `GET /api/v1/books` - Get books with search and pagination
- `GET /api/v1/books/{id}` - Get book by ID
- `POST /api/v1/books` - Create a new book
- `PUT /api/v1/books/{id}` - Update a book (synchronous)
- `PATCH /api/v1/books/{id}` - Update a book (asynchronous)
- `DELETE /api/v1/books/{id}` - Delete a book
- `GET /api/v1/books/types` - Get book types/genres
- `POST /api/v1/books/upload` - Upload books from CSV
- `GET /api/v1/books/download` - Download books as CSV

### Authors
- `GET /api/v1/authors` - Get authors with search and pagination
- `GET /api/v1/authors/{id}` - Get author by ID
- `POST /api/v1/authors` - Create a new author
- `PUT /api/v1/authors/{id}` - Update an author
- `DELETE /api/v1/authors/{id}` - Delete an author

### Publishers
- `GET /api/v1/publishers` - Get publishers with search and pagination
- `GET /api/v1/publishers/{id}` - Get publisher by ID
- `POST /api/v1/publishers` - Create a new publisher
- `PUT /api/v1/publishers/{id}` - Update a publisher
- `DELETE /api/v1/publishers/{id}` - Delete a publisher

### Async Tasks
- `GET /api/v1/books/tasks/{taskId}` - Get task status
- `DELETE /api/v1/books/tasks/{taskId}` - Cancel a task

### Health & Monitoring
- `GET /api/health` - Application health check
- `GET /api/actuator/health` - Detailed health information
- `GET /api/actuator/metrics` - Application metrics
- `GET /api/actuator/prometheus` - Prometheus metrics

## 🔐 Security Features

### Password Security
- SHA-256 hashing with salt
- Secure random salt generation
- Environment variable configuration

### API Security
- Rate limiting (100 requests/minute per IP)
- Input validation with Bean Validation
- CORS configuration
- Request logging

### Environment Security
- No hardcoded credentials
- Environment variable support
- Secure defaults

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Application Health**: `/api/health`
- **Database Health**: `/api/actuator/health`
- **Detailed Metrics**: `/api/actuator/metrics`

### Metrics Available
- HTTP request metrics
- Database connection metrics
- JVM metrics
- Custom business metrics

### Logging
- Structured logging with Log4j2
- File rotation (100MB max, 30 days retention)
- Console and file output
- Request/response logging

## 🧪 Testing

### Run Tests
```bash
# Run all tests
./gradlew test

# Run with coverage
./gradlew test jacocoTestReport

# Run integration tests
./gradlew integrationTest
```

### Test Coverage
- Unit tests for all service layers
- Integration tests for controllers
- Database integration tests
- Async processing tests

## 🚀 Production Deployment

For detailed production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

### Key Production Features
- **Health Monitoring**: Comprehensive health checks
- **Rate Limiting**: API protection
- **Logging**: Structured logging with rotation
- **Backup Strategy**: Automated database backups
- **Security**: Firewall and fail2ban configuration
- **Performance**: Optimized JVM and database settings

## 📝 Usage Examples

### Login
```bash
curl -X POST "http://localhost:8082/api/user/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "userName=admin&password=admin123&role=admin"
```

### Get Books
```bash
curl "http://localhost:8082/api/v1/books?page=0&size=10&searchName=Harry"
```

### Create Book
```bash
curl -X POST "http://localhost:8082/api/v1/books" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "BOOK001",
    "title": "Sample Book",
    "author": "John Doe",
    "price": "25.50 USD",
    "bookType": "Fiction"
  }'
```

### Upload Books CSV
```bash
curl -X POST "http://localhost:8082/api/v1/books/upload" \
  -F "file=@books.csv"
```

### Check Health
```bash
curl "http://localhost:8082/api/health"
```

## 📊 Database Schema

### Core Tables
- `book` - Book information with inventory (prices in USD)
- `authors` - Author profiles
- `publishers` - Publisher information
- `book_type` - Genre categorization
- `user2` - User accounts
- `user_role` - User roles
- `async_tasks` - Async task tracking

### Relationships
- Books ↔ Authors (Many-to-Many)
- Books ↔ Genres (Many-to-Many)
- Books ↔ Publisher (Many-to-One)
- Users ↔ Roles (Many-to-One)

## 🔧 Configuration

### Application Properties
Key configuration options in `application.properties`:
- Database connection settings
- Server configuration
- Logging levels
- Cache settings
- Rate limiting
- Async processing

### Environment Variables
All sensitive configuration can be set via environment variables:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `SERVER_PORT`, `SERVER_SERVLET_CONTEXT_PATH`
- `CORS_ALLOWED_ORIGINS`
- `APP_RATE_LIMIT_*`
- `APP_ASYNC_TASK_*`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Database Schema](docs/DATABASE.md)
- [Frontend Currency Guide](FRONTEND_CURRENCY_GUIDE.md)

### Issues
For bugs and feature requests, please create an issue in the repository.

### Contact
- **Email**: support@bookstore.com
- **Documentation**: [docs/](docs/)

---

**Note**: This is a production-ready application with comprehensive security, monitoring, and deployment features. For production deployment, please follow the detailed guide in [DEPLOYMENT.md](DEPLOYMENT.md). 