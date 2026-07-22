# Multi-stage build for optimized production image
FROM openjdk:8-jdk-alpine AS builder

# Set working directory
WORKDIR /app

# Copy gradle files
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Make gradlew executable
RUN chmod +x gradlew

# Download dependencies
RUN ./gradlew dependencies --no-daemon

# Copy source code
COPY src src

# Build the application
RUN ./gradlew clean build -x test --no-daemon

# Production stage
FROM openjdk:8-jre-alpine

# Install necessary packages
RUN apk add --no-cache \
    curl \
    bash \
    tzdata

# Create application user
RUN addgroup -g 1001 -S bookstore && \
    adduser -u 1001 -S bookstore -G bookstore

# Set timezone
ENV TZ=UTC

# Create application directory
WORKDIR /app

# Copy built JAR from builder stage
COPY --from=builder /app/build/libs/BookStoreBackEnd-0.0.1-SNAPSHOT.jar app.jar

# Create logs directory
RUN mkdir -p /app/logs && \
    chown -R bookstore:bookstore /app

# Switch to non-root user
USER bookstore

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8082/api/health || exit 1

# JVM options for production
ENV JAVA_OPTS="-Xms512m -Xmx1g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication -Djava.security.egd=file:/dev/./urandom"

# Start the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"] 