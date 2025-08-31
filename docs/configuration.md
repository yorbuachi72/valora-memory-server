# Configuration Guide

Complete guide to configuring Valora for different environments and use cases.

## Environment Variables

### Core Database Configuration

#### PostgreSQL Connection
**Required for production**: Database connection settings

```bash
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=valora
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=60000
```

#### Legacy lowdb (Development Only)
**Optional**: For development with file-based storage

```bash
# Legacy lowdb Configuration (not recommended for production)
MEMORY_CONTAINER_PATH=~/.valora
MEMORY_DB_FILE=db.json
MEMORY_BACKUP_ENABLED=true
MEMORY_BACKUP_INTERVAL=86400000
MEMORY_MAX_SIZE_MB=1000
```

### Authentication & Security

#### JWT Authentication
**Required**: JWT token configuration

```bash
# JWT Configuration
VALORA_JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=valora-mcp-server
JWT_AUDIENCE=valora-api
```

#### Legacy API Key (Backward Compatibility)
**Optional**: For legacy API key authentication

```bash
# Legacy API Key Authentication
VALORA_API_KEY="$(openssl rand -hex 32)"
VALORA_SECRET_KEY="$(openssl rand -base64 32)"
```

#### Multi-tenancy Configuration
**Optional**: For multi-tenant deployments

```bash
# Multi-tenancy
DEFAULT_TENANT_ID=default
TENANT_ISOLATION_LEVEL=strict  # strict, relaxed, none
TENANT_MAX_USERS=1000
TENANT_STORAGE_QUOTA_MB=5000
```

### Server Configuration

#### Basic Server Settings
**Required**: Core server configuration

```bash
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info
REQUEST_TIMEOUT=30000
PAYLOAD_SIZE_LIMIT=10mb
```

#### Branding Configuration
**Optional**: CLI and UI branding

```bash
# Branding
VALORA_BRAND=on  # on/off - toggle ASCII logo and branding
BRAND_COMPANY="Nkiru Technologies"
BRAND_TAGLINE="Enterprise Memory Container Protocol Server"
```

### Security Configuration

#### CORS Settings
**Optional**: Cross-Origin Resource Sharing

```bash
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-Tenant-ID
```

#### Rate Limiting
**Optional**: API rate limiting configuration

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_SKIP_FAILED_REQUESTS=false
RATE_LIMIT_MESSAGE="Too many requests, please try again later"
```

#### Brute Force Protection
**Optional**: Authentication brute force protection

```bash
# Brute Force Protection
BRUTE_FORCE_MAX_ATTEMPTS=5
BRUTE_FORCE_BLOCK_DURATION=900000
BRUTE_FORCE_WINDOW_MS=900000
BRUTE_FORCE_CLEANUP_INTERVAL=3600000
```

### AI/ML Configuration

#### Vector Search Settings
**Optional**: Vector database and embeddings configuration

```bash
# Vector Search Configuration
VECTOR_DB_DIMENSION=384
VECTOR_DB_METRIC=cosine
VECTOR_DB_INDEX_TYPE=ivf
VECTOR_SEARCH_THRESHOLD=0.7
VECTOR_BATCH_SIZE=32
```

#### Embedding Model Configuration
**Optional**: Local embedding model settings

```bash
# Embedding Model
EMBEDDING_MODEL=@xenova/transformers
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
EMBEDDING_BATCH_SIZE=32
EMBEDDING_CACHE_SIZE=1000
```

#### Tagging Service Configuration
**Optional**: Automatic tagging settings

```bash
# Tagging Service
TAGGING_ENABLED=true
TAGGING_MODEL_NAME=facebook/bart-large-mnli
TAGGING_CONFIDENCE_THRESHOLD=0.7
TAGGING_MAX_TAGS=10
TAGGING_CACHE_SIZE=500
```

### Monitoring & Observability

#### Health Check Configuration
**Optional**: Health monitoring settings

```bash
# Health Checks
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_MEMORY_THRESHOLD=80
HEALTH_CHECK_DISK_THRESHOLD=85
```

#### Metrics Configuration
**Optional**: Performance metrics collection

```bash
# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PATH=/metrics
METRICS_INTERVAL=60000
METRICS_RETENTION_HOURS=24
```

#### Logging Configuration
**Optional**: Logging and audit settings

```bash
# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=logs/valora.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
LOG_CONSOLE_ENABLED=true

# Security Logging
SECURITY_LOG_ENABLED=true
SECURITY_LOG_LEVEL=warn
SECURITY_LOG_FILE=logs/security.log
SECURITY_LOG_EVENTS=authentication,rate_limit,brute_force,unauthorized
```

### Integration & Webhooks

#### Webhook Configuration
**Optional**: External integration settings

```bash
# Webhooks
WEBHOOK_ENABLED=true
WEBHOOK_TIMEOUT=10000
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5000
WEBHOOK_SIGNATURE_SECRET="$(openssl rand -hex 32)"
```

#### External Services
**Optional**: Third-party service integrations

```bash
# External Services
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
CACHE_ENABLED=true
CACHE_TTL=3600
```

### Optional Variables

#### PORT
**Default**: 3000
- **Type**: Number
- **Purpose**: Server port for HTTP requests

```bash
PORT=8080
```

#### NODE_ENV
**Default**: development
- **Type**: String
- **Values**: development, production, test
- **Purpose**: Sets Node.js environment

```bash
NODE_ENV=production
```

#### ALLOWED_ORIGINS
**Default**: http://localhost:3000
- **Type**: String (comma-separated)
- **Purpose**: CORS allowed origins

```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## Configuration Profiles

### Development Configuration

```bash
# .env.development
VALORA_SECRET_KEY="your-dev-secret-key"
VALORA_API_KEY="your-dev-api-key"
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Production Configuration

```bash
# .env.production
VALORA_SECRET_KEY="your-production-secret-key"
VALORA_API_KEY="your-production-api-key"
PORT=8080
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Testing Configuration

```bash
# .env.test
VALORA_SECRET_KEY="test-secret-key"
VALORA_API_KEY="test-api-key"
PORT=3001
NODE_ENV=test
ALLOWED_ORIGINS=http://localhost:3001
```

## Security Configuration

### Rate Limiting

Configure rate limiting for different endpoints:

```bash
# Rate limiting configuration
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_SKIP_FAILED_REQUESTS=false
```

### Brute Force Protection

Configure brute force protection for authentication:

```bash
# Brute force protection
BRUTE_FORCE_MAX_ATTEMPTS=5
BRUTE_FORCE_BLOCK_DURATION=900000  # 15 minutes
BRUTE_FORCE_WINDOW_MS=900000  # 15 minutes
```

### CORS Configuration

```bash
# CORS settings
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
ALLOWED_METHODS=GET,POST,PUT,DELETE
ALLOWED_HEADERS=Content-Type,Authorization
CREDENTIALS=true
```

## Storage Configuration

### Memory Container Settings

```bash
# Memory container configuration
MEMORY_CONTAINER_PATH=~/.valora
MEMORY_DB_FILE=db.json
MEMORY_BACKUP_ENABLED=true
MEMORY_BACKUP_INTERVAL=86400000  # 24 hours
MEMORY_MAX_SIZE_MB=1000  # 1GB max
```

### Vector Database Settings

```bash
# Vector database configuration
VECTOR_DB_PATH=~/.valora/vectors
VECTOR_DB_DIMENSION=384
VECTOR_DB_METRIC=cosine
VECTOR_DB_INDEX_TYPE=ivf
```

## AI/ML Configuration

### Embedding Model Settings

```bash
# Embedding model configuration
EMBEDDING_MODEL=@xenova/transformers
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
EMBEDDING_BATCH_SIZE=32
```

### Tagging Model Settings

```bash
# Tagging model configuration
TAGGING_MODEL=@xenova/transformers
TAGGING_MODEL_NAME=facebook/bart-large-mnli
TAGGING_CONFIDENCE_THRESHOLD=0.7
TAGGING_MAX_TAGS=10
```

## Logging Configuration

### Log Levels

```bash
# Logging configuration
LOG_LEVEL=info  # debug, info, warn, error
LOG_FORMAT=json  # json, simple
LOG_FILE=logs/valora.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
```

### Security Logging

```bash
# Security logging
SECURITY_LOG_ENABLED=true
SECURITY_LOG_LEVEL=warn
SECURITY_LOG_FILE=logs/security.log
SECURITY_LOG_EVENTS=authentication,rate_limit,brute_force
```

## Performance Configuration

### Memory Settings

```bash
# Node.js memory settings
NODE_OPTIONS="--max-old-space-size=4096"
```

### Database Settings

```bash
# Database performance
DB_WRITE_BUFFER_SIZE=8192
DB_READ_BUFFER_SIZE=4096
DB_MAX_OPEN_FILES=1000
```

## Monitoring Configuration

### Health Check Settings

```bash
# Health check configuration
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000  # 30 seconds
HEALTH_CHECK_TIMEOUT=5000  # 5 seconds
```

### Metrics Settings

```bash
# Metrics configuration
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PATH=/metrics
```

## Docker Configuration

### Docker Environment Variables

```dockerfile
# Dockerfile environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Database Configuration
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_NAME=valora
ENV DB_USER=postgres
ENV DB_PASSWORD=${DB_PASSWORD}

# Authentication
ENV VALORA_JWT_SECRET=${VALORA_JWT_SECRET}
ENV VALORA_API_KEY=${VALORA_API_KEY}

# Multi-tenancy
ENV DEFAULT_TENANT_ID=default
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  valora:
    build: .
    ports:
      - "3000:3000"
    environment:
      # Server Configuration
      - NODE_ENV=production
      - PORT=3000
      - LOG_LEVEL=info

      # Database Configuration
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=valora
      - DB_USER=postgres
      - DB_PASSWORD=${DB_PASSWORD}

      # Authentication
      - VALORA_JWT_SECRET=${VALORA_JWT_SECRET}
      - VALORA_API_KEY=${VALORA_API_KEY}

      # Multi-tenancy
      - DEFAULT_TENANT_ID=default

      # Monitoring
      - METRICS_ENABLED=true
      - HEALTH_CHECK_ENABLED=true

      # Branding
      - VALORA_BRAND=on
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=valora
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./src/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d valora"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/valora.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - valora
    restart: unless-stopped

  pgadmin:
    image: dpage/pgadmin4
    environment:
      - PGADMIN_DEFAULT_EMAIL=${PGADMIN_EMAIL}
      - PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASSWORD}
    volumes:
      - pgadmin-data:/var/lib/pgadmin
    ports:
      - "5050:80"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
  pgadmin-data:
```

## Environment-Specific Configurations

### Local Development with Docker

```bash
# .env.local
# Server Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=valora
DB_USER=postgres
DB_PASSWORD=local_dev_password

# Authentication
VALORA_JWT_SECRET="$(openssl rand -base64 32)"
VALORA_API_KEY="$(openssl rand -hex 32)"

# Multi-tenancy
DEFAULT_TENANT_ID=default
TENANT_ISOLATION_LEVEL=relaxed

# Security (relaxed for development)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5050
RATE_LIMIT_MAX_REQUESTS=10000
BRUTE_FORCE_MAX_ATTEMPTS=10

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true

# Branding
VALORA_BRAND=on
```

### Staging Environment

```bash
# .env.staging
# Server Configuration
NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# Database Configuration
DB_HOST=staging-postgres.yourdomain.com
DB_PORT=5432
DB_NAME=valora_staging
DB_USER=valora_staging
DB_PASSWORD=${STAGING_DB_PASSWORD}
DB_SSL=true

# Authentication
VALORA_JWT_SECRET=${STAGING_JWT_SECRET}
VALORA_API_KEY=${STAGING_API_KEY}

# Multi-tenancy
DEFAULT_TENANT_ID=staging
TENANT_ISOLATION_LEVEL=strict

# Security
ALLOWED_ORIGINS=https://staging.yourdomain.com
RATE_LIMIT_MAX_REQUESTS=500
BRUTE_FORCE_MAX_ATTEMPTS=5

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
SECURITY_LOG_ENABLED=true

# Branding
VALORA_BRAND=on
```

### Production Environment

```bash
# .env.production
# Server Configuration
NODE_ENV=production
PORT=8080
LOG_LEVEL=warn
HOST=0.0.0.0

# Database Configuration
DB_HOST=production-postgres.yourdomain.com
DB_PORT=5432
DB_NAME=valora_production
DB_USER=valora_prod
DB_PASSWORD=${PRODUCTION_DB_PASSWORD}
DB_SSL=true
DB_MAX_CONNECTIONS=50
DB_IDLE_TIMEOUT=60000

# Authentication
VALORA_JWT_SECRET=${PRODUCTION_JWT_SECRET}
VALORA_API_KEY=${PRODUCTION_API_KEY}

# Multi-tenancy
DEFAULT_TENANT_ID=production
TENANT_ISOLATION_LEVEL=strict
TENANT_MAX_USERS=10000
TENANT_STORAGE_QUOTA_MB=100000

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
RATE_LIMIT_MAX_REQUESTS=1000
BRUTE_FORCE_MAX_ATTEMPTS=3
BRUTE_FORCE_BLOCK_DURATION=1800000

# Monitoring & Observability
METRICS_ENABLED=true
METRICS_PORT=9090
HEALTH_CHECK_ENABLED=true
SECURITY_LOG_ENABLED=true
SECURITY_LOG_EVENTS=authentication,rate_limit,brute_force,unauthorized,webhook

# AI/ML Configuration
VECTOR_SEARCH_THRESHOLD=0.8
TAGGING_ENABLED=true
EMBEDDING_CACHE_SIZE=2000

# Integration
WEBHOOK_ENABLED=true
REDIS_URL=${REDIS_URL}
CACHE_ENABLED=true

# Branding
VALORA_BRAND=on
BRAND_COMPANY="Your Company Name"
BRAND_TAGLINE="Enterprise Memory Container Protocol Server"
```

### High-Availability Production Setup

```bash
# .env.production-ha
# Server Configuration
NODE_ENV=production
PORT=8080
LOG_LEVEL=warn
HOST=0.0.0.0

# Database Configuration (Connection Pooling)
DB_HOST=production-postgres-cluster.yourdomain.com
DB_PORT=5432
DB_NAME=valora_production
DB_USER=valora_prod
DB_PASSWORD=${PRODUCTION_DB_PASSWORD}
DB_SSL=true
DB_MAX_CONNECTIONS=100
DB_IDLE_TIMEOUT=60000
DB_CONNECTION_TIMEOUT=30000

# Redis Cluster for Caching & Sessions
REDIS_URL=redis://production-redis-cluster.yourdomain.com:6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# Load Balancer Configuration
LB_HEALTH_CHECK_PATH=/health
LB_HEALTH_CHECK_INTERVAL=30s

# CDN Configuration
CDN_URL=https://cdn.yourdomain.com
STATIC_ASSETS_CACHE_TTL=31536000

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090
PROMETHEUS_PUSH_GATEWAY_URL=https://prometheus.yourdomain.com

# Logging (Centralized)
LOG_FORMAT=json
LOG_FILE=/dev/stdout
CENTRALIZED_LOGGING_URL=https://logs.yourdomain.com
LOG_SHIPPING_ENABLED=true

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=valora-production-backups
```

## Configuration Validation

### Validate Configuration

```bash
# Check if required variables are set
node -e "
const required = ['VALORA_SECRET_KEY', 'VALORA_API_KEY'];
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}
console.log('Configuration validation passed');
"
```

### Configuration Test

```bash
# Test configuration with curl
curl -X GET http://localhost:3000/health

curl -X GET http://localhost:3000/auth/status \
  -H "Authorization: Bearer $VALORA_API_KEY"
```

## Troubleshooting Configuration

### Common Issues

**Missing required variables:**
```bash
# Check environment variables
env | grep VALORA

# Set missing variables
export VALORA_SECRET_KEY="your-secret-key"
export VALORA_API_KEY="your-api-key"
```

**Invalid configuration:**
```bash
# Validate configuration
npm run validate-config

# Check logs for errors
tail -f logs/valora.log
```

**Port conflicts:**
```bash
# Check port usage
lsof -i :3000

# Change port
export PORT=3001
npm start
```

## Best Practices

### Security

1. **Use strong, unique keys** for each environment
2. **Never commit secrets** to version control
3. **Rotate keys regularly** in production
4. **Use environment-specific configurations**

### Performance

1. **Monitor memory usage** and adjust Node.js settings
2. **Configure appropriate rate limits** for your use case
3. **Enable metrics** in production for monitoring
4. **Use production-grade logging** in production

### Development

1. **Use different keys** for development and production
2. **Enable debug logging** in development
3. **Test configuration** before deployment
4. **Document environment-specific settings**

---

*Last updated: January 2024*
