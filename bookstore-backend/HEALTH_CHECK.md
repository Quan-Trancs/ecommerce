# Health Check Documentation

## 📊 Overview

The BookStore Backend API provides comprehensive health monitoring through multiple endpoints that check different aspects of the application's health and performance.

## 🔍 Available Health Endpoints

### 1. Basic Health Check
**Endpoint**: `GET /api/health`  
**Purpose**: Quick application status check  
**Response**: Basic application information

```bash
curl http://localhost:8082/api/health
```

**Expected Response**:
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00",
  "application": "BookStore Backend API",
  "version": "1.0.0"
}
```

### 2. Detailed Health Check
**Endpoint**: `GET /api/health/detailed`  
**Purpose**: Comprehensive system health with detailed metrics  
**Response**: Complete system information including database, memory, and runtime stats

```bash
curl http://localhost:8082/api/health/detailed
```

**Expected Response**:
```json
{
  "status": "UP",
  "timestamp": "2024-01-15T10:30:00",
  "application": "BookStore Backend API",
  "version": "1.0.0",
  "database": {
    "status": "UP",
    "type": "PostgreSQL"
  },
  "system": {
    "os": "Linux 5.4.0-42-generic",
    "architecture": "amd64",
    "processors": 8,
    "systemLoad": 0.25,
    "memory": {
      "max": "2.0 GB",
      "used": "512.0 MB",
      "free": "1.5 GB",
      "usagePercentage": 25
    }
  },
  "runtime": {
    "uptime": "2h 15m 30s",
    "totalMemory": "1.0 GB",
    "freeMemory": "750.0 MB",
    "threads": 45
  }
}
```

### 3. Database Health Check
**Endpoint**: `GET /api/health/database`  
**Purpose**: Database connectivity and health  
**Response**: Database connection status

```bash
curl http://localhost:8082/api/health/database
```

**Success Response**:
```json
{
  "status": "UP",
  "database": "PostgreSQL",
  "message": "Database connection successful",
  "timestamp": "2024-01-15T10:30:00"
}
```

**Failure Response**:
```json
{
  "status": "DOWN",
  "database": "PostgreSQL",
  "error": "Connection failed",
  "timestamp": "2024-01-15T10:30:00"
}
```

### 4. Readiness Check
**Endpoint**: `GET /api/health/ready`  
**Purpose**: Kubernetes readiness probe  
**Response**: Application readiness status

```bash
curl http://localhost:8082/api/health/ready
```

**Expected Response**:
```json
{
  "status": "READY",
  "timestamp": "2024-01-15T10:30:00",
  "message": "Application is ready to serve requests"
}
```

### 5. Liveness Check
**Endpoint**: `GET /api/health/live`  
**Purpose**: Kubernetes liveness probe  
**Response**: Application liveness status

```bash
curl http://localhost:8082/api/health/live
```

**Expected Response**:
```json
{
  "status": "ALIVE",
  "timestamp": "2024-01-15T10:30:00",
  "message": "Application is alive and responding"
}
```

### 6. Async Processing Health Check
**Endpoint**: `GET /api/health/async`  
**Purpose**: Background worker health  
**Response**: Async processing status

```bash
curl http://localhost:8082/api/health/async
```

**Expected Response**:
```json
{
  "status": "UP",
  "component": "Async Processing",
  "message": "Background workers are operational",
  "timestamp": "2024-01-15T10:30:00"
}
```

## 🔧 Spring Boot Actuator Health Endpoints

### 7. Actuator Health Check
**Endpoint**: `GET /api/actuator/health`  
**Purpose**: Spring Boot's built-in health check  
**Response**: Detailed health information from all health indicators

```bash
curl http://localhost:8082/api/actuator/health
```

**Expected Response**:
```json
{
  "status": "UP",
  "components": {
    "database": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "status": "Connected"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 107374182400,
        "free": 53687091200,
        "threshold": 10485760
      }
    }
  }
}
```

### 8. Actuator Health Details (Authorized)
**Endpoint**: `GET /api/actuator/health`  
**Headers**: `Authorization: Basic <credentials>`  
**Purpose**: Detailed health information (when authorized)

```bash
curl -H "Authorization: Basic <base64-encoded-credentials>" \
     http://localhost:8082/api/actuator/health
```

## 🧪 Health Check Verification Script

Create a verification script to test all health endpoints:

```bash
#!/bin/bash
# health-check-verification.sh

BASE_URL="http://localhost:8082"
TIMEOUT=10

echo "🔍 BookStore Backend Health Check Verification"
echo "=============================================="
echo "Base URL: $BASE_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo "Testing: $description"
    echo "Endpoint: $endpoint"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json --max-time $TIMEOUT "$BASE_URL$endpoint")
    status_code=$?
    
    if [ $status_code -eq 0 ] && [ "$response" = "$expected_status" ]; then
        echo "✅ Status: UP (HTTP $response)"
        echo "Response:"
        cat /tmp/response.json | jq '.' 2>/dev/null || cat /tmp/response.json
    else
        echo "❌ Status: DOWN"
        if [ $status_code -ne 0 ]; then
            echo "Error: Connection failed (curl exit code: $status_code)"
        else
            echo "Error: Unexpected HTTP status code: $response"
        fi
    fi
    echo ""
}

# Test all endpoints
test_endpoint "/api/health" "Basic Health Check"
test_endpoint "/api/health/detailed" "Detailed Health Check"
test_endpoint "/api/health/database" "Database Health Check"
test_endpoint "/api/health/ready" "Readiness Check"
test_endpoint "/api/health/live" "Liveness Check"
test_endpoint "/api/health/async" "Async Processing Health Check"
test_endpoint "/api/actuator/health" "Spring Boot Actuator Health"

echo "🏁 Health check verification completed!"
```

## 📊 Health Check Monitoring

### Kubernetes Probes

For Kubernetes deployment, use these health check configurations:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bookstore-backend
spec:
  template:
    spec:
      containers:
      - name: bookstore-backend
        image: bookstore-backend:latest
        ports:
        - containerPort: 8082
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 8082
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 8082
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /api/health
            port: 8082
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 30
```

### Docker Health Check

The Dockerfile includes a health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8082/api/health || exit 1
```

### Systemd Service Health Check

For systemd deployment, create a health check script:

```bash
#!/bin/bash
# /opt/bookstore/health-check.sh

HEALTH_URL="http://localhost:8082/api/health"
LOG_FILE="/opt/bookstore/logs/health-check.log"

response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 $HEALTH_URL)

if [ $response -eq 200 ]; then
    echo "$(date): Health check passed" >> $LOG_FILE
    exit 0
else
    echo "$(date): Health check failed with status $response" >> $LOG_FILE
    systemctl restart bookstore-backend
    exit 1
fi
```

Add to crontab:
```bash
*/5 * * * * /opt/bookstore/health-check.sh
```

## 🚨 Health Check Alerts

### Monitoring Integration

Integrate with monitoring systems:

#### Prometheus
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'bookstore-backend'
    static_configs:
      - targets: ['localhost:8082']
    metrics_path: '/api/actuator/prometheus'
    scrape_interval: 30s
```

#### Grafana Dashboard
Create alerts based on:
- Health check status changes
- Response time increases
- Memory usage thresholds
- Database connection failures

#### Alert Rules
```yaml
# alertmanager.yml
groups:
  - name: bookstore-backend
    rules:
      - alert: HealthCheckDown
        expr: up{job="bookstore-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "BookStore Backend is down"
          description: "Health check failed for {{ $labels.instance }}"
      
      - alert: HighMemoryUsage
        expr: jvm_memory_used_bytes{job="bookstore-backend"} / jvm_memory_max_bytes{job="bookstore-backend"} > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
```

## 🔧 Troubleshooting

### Common Health Check Issues

1. **Database Connection Failed**
   - Check PostgreSQL service status
   - Verify database credentials
   - Check network connectivity
   - Review connection pool settings

2. **High Memory Usage**
   - Monitor JVM heap usage
   - Check for memory leaks
   - Adjust JVM parameters
   - Review application logs

3. **Slow Response Times**
   - Check database query performance
   - Monitor system resources
   - Review application logs
   - Check for blocking operations

4. **Health Check Timeout**
   - Increase timeout values
   - Check system load
   - Review network connectivity
   - Monitor application performance

### Debug Commands

```bash
# Check application logs
journalctl -u bookstore-backend -f

# Check database connectivity
psql -h localhost -U bookstore_user -d bookstore -c "SELECT 1;"

# Check system resources
top
free -h
df -h

# Check network connectivity
netstat -tlnp | grep 8082
curl -v http://localhost:8082/api/health
```

## 📈 Health Metrics

### Key Metrics to Monitor

1. **Response Time**: < 200ms for health checks
2. **Memory Usage**: < 85% of heap
3. **Database Connections**: < 80% of pool
4. **Error Rate**: < 1% of requests
5. **Uptime**: > 99.9%

### Performance Baselines

- **Health Check Response Time**: < 100ms
- **Database Health Check**: < 50ms
- **Memory Usage**: < 70% of max heap
- **Thread Count**: < 100 active threads
- **Disk Space**: > 1GB free

---

**Note**: All health check endpoints return JSON responses with consistent structure including status, timestamp, and relevant details. Monitor these endpoints regularly to ensure application health and performance. 