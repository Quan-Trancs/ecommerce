# BookStore Backend - Production Deployment Guide

## 🚀 Overview

This guide provides step-by-step instructions for deploying the BookStore Backend API to production with all security, monitoring, and performance optimizations.

## 📋 Prerequisites

### System Requirements
- **Java**: OpenJDK 8 or higher
- **Database**: PostgreSQL 12 or higher
- **Memory**: Minimum 2GB RAM, Recommended 4GB+
- **Storage**: Minimum 10GB free space
- **Network**: HTTPS support (SSL/TLS certificates)

### Software Dependencies
- PostgreSQL database server
- Java Runtime Environment (JRE)
- Nginx (for reverse proxy and SSL termination)
- Docker (optional, for containerized deployment)

## 🔧 Step 1: Database Setup

### 1.1 Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 1.2 Create Database and User
```bash
# Connect as postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE bookstore;
CREATE USER bookstore_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bookstore TO bookstore_user;
\q
```

### 1.3 Initialize Database Schema
```bash
# Connect to the bookstore database
psql -h localhost -U bookstore_user -d bookstore -f src/main/resources/db/init.sql
```

### 1.4 Configure PostgreSQL Security
Edit `/etc/postgresql/12/main/postgresql.conf`:
```conf
# Connection settings
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
```

Edit `/etc/postgresql/12/main/pg_hba.conf`:
```conf
# Local connections
local   all             postgres                                peer
local   all             bookstore_user                          md5
host    all             bookstore_user          127.0.0.1/32    md5
host    all             bookstore_user          ::1/128         md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## 🔐 Step 2: Security Configuration

### 2.1 Create Application User
```bash
# Create a dedicated user for the application
sudo useradd -r -s /bin/false bookstore
sudo mkdir -p /opt/bookstore
sudo chown bookstore:bookstore /opt/bookstore
```

### 2.2 Environment Variables
Create `/opt/bookstore/.env`:
```bash
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/bookstore
DB_USERNAME=bookstore_user
DB_PASSWORD=your_secure_password

# Server Configuration
SERVER_PORT=8082
SERVER_SERVLET_CONTEXT_PATH=/api

# Security Configuration
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Monitoring Configuration
SPRING_PROFILES_ACTIVE=prod
LOGGING_LEVEL_ROOT=WARN
LOGGING_LEVEL_QUANTRAN_API=INFO

# Rate Limiting
APP_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE=100
APP_RATE_LIMIT_ENABLED=true

# Async Processing
APP_ASYNC_TASK_CLEANUP_DAYS_TO_KEEP=7
APP_ASYNC_TASK_TIMEOUT_MINUTES=30
```

Set proper permissions:
```bash
sudo chown bookstore:bookstore /opt/bookstore/.env
sudo chmod 600 /opt/bookstore/.env
```

## 🏗️ Step 3: Application Deployment

### 3.1 Build the Application
```bash
# Clone the repository
git clone https://github.com/yourusername/BookStoreBackEnd.git
cd BookStoreBackEnd

# Build with production profile
./gradlew clean build -x test
```

### 3.2 Deploy Application
```bash
# Copy JAR file to application directory
sudo cp build/libs/BookStoreBackEnd-0.0.1-SNAPSHOT.jar /opt/bookstore/bookstore-backend.jar
sudo chown bookstore:bookstore /opt/bookstore/bookstore-backend.jar

# Create logs directory
sudo mkdir -p /opt/bookstore/logs
sudo chown bookstore:bookstore /opt/bookstore/logs
```

### 3.3 Create Systemd Service
Create `/etc/systemd/system/bookstore-backend.service`:
```ini
[Unit]
Description=BookStore Backend API
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=bookstore
Group=bookstore
WorkingDirectory=/opt/bookstore
ExecStart=/usr/bin/java -Xms512m -Xmx2g -jar bookstore-backend.jar
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bookstore-backend

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/bookstore/logs

# Environment
EnvironmentFile=/opt/bookstore/.env

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable bookstore-backend
sudo systemctl start bookstore-backend
sudo systemctl status bookstore-backend
```

## 🌐 Step 4: Nginx Configuration

### 4.1 Install Nginx
```bash
sudo apt install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4.2 SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 4.3 Nginx Configuration
Create `/etc/nginx/sites-available/bookstore`:
```nginx
upstream bookstore_backend {
    server 127.0.0.1:8082;
    keepalive 32;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Logging
    access_log /var/log/nginx/bookstore_access.log;
    error_log /var/log/nginx/bookstore_error.log;

    # API Routes
    location /api/ {
        proxy_pass http://bookstore_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Health Check (public)
    location /api/health {
        proxy_pass http://bookstore_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Actuator endpoints (protected)
    location /api/actuator/ {
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
        proxy_pass http://bookstore_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (if any)
    location / {
        return 404;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/bookstore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Step 5: Monitoring Setup

### 5.1 Log Rotation
Create `/etc/logrotate.d/bookstore-backend`:
```
/opt/bookstore/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 bookstore bookstore
    postrotate
        systemctl reload bookstore-backend
    endscript
}
```

### 5.2 Health Check Script
Create `/opt/bookstore/health-check.sh`:
```bash
#!/bin/bash
HEALTH_URL="https://yourdomain.com/api/health"
LOG_FILE="/opt/bookstore/logs/health-check.log"

# Check application health
response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -eq 200 ]; then
    echo "$(date): Health check passed" >> $LOG_FILE
    exit 0
else
    echo "$(date): Health check failed with status $response" >> $LOG_FILE
    # Restart service if health check fails
    systemctl restart bookstore-backend
    exit 1
fi
```

Make it executable:
```bash
sudo chmod +x /opt/bookstore/health-check.sh
sudo chown bookstore:bookstore /opt/bookstore/health-check.sh
```

### 5.3 Cron Job for Health Checks
```bash
# Add to crontab
sudo crontab -e

# Add this line to run health check every 5 minutes
*/5 * * * * /opt/bookstore/health-check.sh
```

## 🔄 Step 6: Backup Strategy

### 6.1 Database Backup Script
Create `/opt/bookstore/backup-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/opt/bookstore/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bookstore_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U bookstore_user -d bookstore > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Database backup completed: $BACKUP_FILE.gz"
```

### 6.2 Application Backup Script
Create `/opt/bookstore/backup-app.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/opt/bookstore/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/app_$DATE.tar.gz"

# Create backup of application files
tar -czf $BACKUP_FILE -C /opt/bookstore .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: $BACKUP_FILE"
```

### 6.3 Automated Backup Schedule
```bash
# Add to crontab
sudo crontab -e

# Database backup daily at 2 AM
0 2 * * * /opt/bookstore/backup-db.sh

# Application backup weekly on Sunday at 3 AM
0 3 * * 0 /opt/bookstore/backup-app.sh
```

## 🚨 Step 7: Security Hardening

### 7.1 Firewall Configuration
```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 7.2 Fail2ban Configuration
```bash
# Install Fail2ban
sudo apt install fail2ban

# Create custom jail for API
sudo tee /etc/fail2ban/jail.local << EOF
[bookstore-api]
enabled = true
port = http,https
filter = bookstore-api
logpath = /var/log/nginx/bookstore_access.log
maxretry = 5
bantime = 3600
findtime = 600
EOF

# Create filter
sudo tee /etc/fail2ban/filter.d/bookstore-api.conf << EOF
[Definition]
failregex = ^<HOST>.*"POST /api/.*" 429
ignoreregex =
EOF

# Restart Fail2ban
sudo systemctl restart fail2ban
```

## 📈 Step 8: Performance Optimization

### 8.1 JVM Tuning
Update the systemd service with optimized JVM parameters:
```ini
ExecStart=/usr/bin/java \
    -Xms1g \
    -Xmx2g \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+UseStringDeduplication \
    -XX:+OptimizeStringConcat \
    -Djava.security.egd=file:/dev/./urandom \
    -jar bookstore-backend.jar
```

### 8.2 Database Optimization
Add to PostgreSQL configuration:
```conf
# Memory settings
shared_buffers = 512MB
effective_cache_size = 2GB
work_mem = 4MB
maintenance_work_mem = 256MB

# WAL settings
wal_buffers = 16MB
checkpoint_completion_target = 0.9
wal_writer_delay = 200ms

# Query optimization
random_page_cost = 1.1
effective_io_concurrency = 200
```

## ✅ Step 9: Verification

### 9.1 Health Check
```bash
# Check application health
curl -f https://yourdomain.com/api/health

# Check database connection
curl -f https://yourdomain.com/api/actuator/health

# Check metrics
curl -f https://yourdomain.com/api/actuator/metrics
```

### 9.2 Load Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Run load test
ab -n 1000 -c 10 https://yourdomain.com/api/health
```

### 9.3 Security Scan
```bash
# Install security scanner
sudo apt install nikto

# Run security scan
nikto -h yourdomain.com
```

## 🔧 Step 10: Maintenance

### 10.1 Update Process
```bash
# Stop service
sudo systemctl stop bookstore-backend

# Backup current version
sudo cp /opt/bookstore/bookstore-backend.jar /opt/bookstore/bookstore-backend.jar.backup

# Deploy new version
sudo cp new-version.jar /opt/bookstore/bookstore-backend.jar
sudo chown bookstore:bookstore /opt/bookstore/bookstore-backend.jar

# Start service
sudo systemctl start bookstore-backend

# Verify health
curl -f https://yourdomain.com/api/health
```

### 10.2 Log Monitoring
```bash
# Monitor application logs
sudo journalctl -u bookstore-backend -f

# Monitor nginx logs
sudo tail -f /var/log/nginx/bookstore_access.log
sudo tail -f /var/log/nginx/bookstore_error.log

# Monitor database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 📞 Support

### Emergency Contacts
- **System Administrator**: admin@yourdomain.com
- **Database Administrator**: dba@yourdomain.com
- **On-call Engineer**: oncall@yourdomain.com

### Emergency Procedures
1. **Service Down**: Check logs and restart service
2. **Database Issues**: Check PostgreSQL logs and connection
3. **Security Breach**: Isolate system and contact security team
4. **Performance Issues**: Check resource usage and optimize

### Monitoring Alerts
- CPU usage > 80%
- Memory usage > 85%
- Disk usage > 90%
- Database connections > 80%
- Response time > 2 seconds
- Error rate > 5%

---

**Note**: This deployment guide assumes a Linux environment (Ubuntu/Debian). Adjust commands and paths for your specific operating system and requirements. 