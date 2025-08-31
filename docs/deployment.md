# Deployment Guide

Complete guide to deploying Valora in production environments with security, scalability, and monitoring considerations.

## Prerequisites

- Node.js (v20 or later)
- Docker (optional)
- Reverse proxy (Nginx/Apache)
- SSL certificate
- Monitoring solution

## Production Checklist

### Security
- [ ] Strong encryption keys generated
- [ ] API keys rotated and secured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled

### Performance
- [ ] Node.js memory limits set
- [ ] Database optimized
- [ ] Caching configured
- [ ] Load balancing (if needed)
- [ ] Monitoring enabled

### Reliability
- [ ] Health checks configured
- [ ] Logging set up
- [ ] Backup strategy implemented
- [ ] Auto-restart configured
- [ ] Error handling tested

## Environment Setup

### Production Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=8080

# Security
VALORA_SECRET_KEY="your-production-secret-key-32-chars-minimum"
VALORA_API_KEY="your-production-api-key-32-chars-minimum"

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=warn
LOG_FORMAT=json
LOG_FILE=/var/log/valora/valora.log

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090

# Security Logging
SECURITY_LOG_ENABLED=true
SECURITY_LOG_FILE=/var/log/valora/security.log
```

### Generate Production Keys

```bash
# Generate encryption key
VALORA_SECRET_KEY="$(openssl rand -base64 32)"

# Generate API key
VALORA_API_KEY="$(openssl rand -hex 32)"

# Verify key strength
echo "Secret key length: ${#VALORA_SECRET_KEY}"
echo "API key length: ${#VALORA_API_KEY}"
```

## Deployment Methods

### Method 1: Direct Deployment

#### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create application user
sudo useradd -r -s /bin/false valora
sudo mkdir -p /opt/valora
sudo chown valora:valora /opt/valora
```

#### Step 2: Deploy Application

```bash
# Clone repository
sudo -u valora git clone https://github.com/your-username/valora.git /opt/valora

# Install dependencies
cd /opt/valora
sudo -u valora npm install

# Build application
sudo -u valora npm run build

# Create logs directory
sudo mkdir -p /var/log/valora
sudo chown valora:valora /var/log/valora
```

#### Step 3: Configure Environment

```bash
# Create production environment file
sudo -u valora tee /opt/valora/.env.production << EOF
NODE_ENV=production
PORT=8080
VALORA_SECRET_KEY="your-production-secret-key"
VALORA_API_KEY="your-production-api-key"
ALLOWED_ORIGINS=https://yourdomain.com
LOG_LEVEL=warn
LOG_FILE=/var/log/valora/valora.log
SECURITY_LOG_ENABLED=true
SECURITY_LOG_FILE=/var/log/valora/security.log
EOF
```

#### Step 4: Configure PM2

```bash
# Create PM2 ecosystem file
sudo -u valora tee /opt/valora/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'valora',
    script: 'build/cli/index.js',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    env_file: '.env.production',
    log_file: '/var/log/valora/pm2.log',
    out_file: '/var/log/valora/out.log',
    error_file: '/var/log/valora/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096'
  }]
};
EOF
```

#### Step 5: Start Application

```bash
# Start with PM2
cd /opt/valora
sudo -u valora pm2 start ecosystem.config.js

# Save PM2 configuration
sudo -u valora pm2 save

# Setup PM2 startup script
sudo -u valora pm2 startup
```

### Method 2: Docker Deployment

#### Step 1: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S valora -u 1001

# Change ownership
RUN chown -R valora:nodejs /usr/src/app
USER valora

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "build/cli/index.js", "start"]
```

#### Step 2: Create Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  valora:
    build: .
    ports:
      - "8080:3000"
    environment:
      - NODE_ENV=production
      - VALORA_SECRET_KEY=${VALORA_SECRET_KEY}
      - VALORA_API_KEY=${VALORA_API_KEY}
      - PORT=3000
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    volumes:
      - valora-data:/usr/src/app/data
      - valora-logs:/usr/src/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  valora-data:
    driver: local
  valora-logs:
    driver: local
```

#### Step 3: Deploy with Docker

```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f valora

# Check health
docker-compose exec valora curl http://localhost:3000/health
```

## Reverse Proxy Configuration

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/valora
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy Configuration
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health Check
    location /health {
        access_log off;
        proxy_pass http://localhost:8080/health;
    }
}
```

### Apache Configuration

```apache
# /etc/apache2/sites-available/valora.conf
<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    # Security Headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    
    # Proxy Configuration
    ProxyPreserveHost On
    ProxyPass / http://localhost:8080/
    ProxyPassReverse / http://localhost:8080/
    
    # Timeouts
    ProxyTimeout 60
    ProxyBadHeader Ignore
</VirtualHost>
```

## SSL Certificate Setup

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring Setup

### Health Checks

```bash
# Create health check script
sudo tee /opt/valora/health-check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:8080/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "Health check passed"
    exit 0
else
    echo "Health check failed: HTTP $RESPONSE"
    exit 1
fi
EOF

sudo chmod +x /opt/valora/health-check.sh

# Add to crontab
sudo crontab -e
# Add: */5 * * * * /opt/valora/health-check.sh
```

### Log Monitoring

```bash
# Install log monitoring
sudo apt install logwatch

# Configure logwatch
sudo tee /etc/logwatch/conf/logwatch.conf << EOF
LogDir = /var/log
TmpDir = /tmp
MailTo = admin@yourdomain.com
MailFrom = logwatch@yourdomain.com
Detail = 10
EOF
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor application
sudo -u valora pm2 monit
```

## Backup Strategy

### Automated Backups

```bash
# Create backup script
sudo tee /opt/valora/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/valora"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="valora_backup_$DATE.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application data
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    /opt/valora/data \
    /opt/valora/.env.production \
    /var/log/valora

# Keep only last 7 days of backups
find $BACKUP_DIR -name "valora_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

sudo chmod +x /opt/valora/backup.sh

# Add to crontab
sudo crontab -e
# Add: 0 2 * * * /opt/valora/backup.sh
```

## Security Hardening

### Firewall Configuration

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

### System Updates

```bash
# Create update script
sudo tee /opt/valora/update.sh << 'EOF'
#!/bin/bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js if needed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Restart application
sudo -u valora pm2 restart valora

echo "System update completed"
EOF

sudo chmod +x /opt/valora/update.sh

# Add to crontab
sudo crontab -e
# Add: 0 4 * * 0 /opt/valora/update.sh
```

## Performance Optimization

### Node.js Optimization

```bash
# Set Node.js memory limits
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable garbage collection logging
export NODE_OPTIONS="$NODE_OPTIONS --trace-gc"
```

### Database Optimization

```bash
# Optimize file system
sudo tune2fs -O has_journal /dev/sda1

# Set I/O scheduler
echo 'deadline' | sudo tee /sys/block/sda/queue/scheduler
```

## Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check logs
sudo -u valora pm2 logs valora

# Check environment
sudo -u valora pm2 env valora

# Restart application
sudo -u valora pm2 restart valora
```

**High memory usage:**
```bash
# Check memory usage
sudo -u valora pm2 monit

# Increase memory limit
sudo -u valora pm2 restart valora --max-memory-restart 2G
```

**SSL certificate issues:**
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test configuration
sudo nginx -t
```

### Log Analysis

```bash
# Check application logs
tail -f /var/log/valora/valora.log

# Check security logs
tail -f /var/log/valora/security.log

# Check system logs
sudo journalctl -u valora -f
```

## Scaling Considerations

### Load Balancing

For high-traffic deployments, consider:

1. **Multiple instances** behind a load balancer
2. **Database clustering** for shared storage
3. **CDN** for static assets
4. **Redis** for session storage

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  valora:
    build: .
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
    volumes:
      - valora-data:/usr/src/app/data
```

## Maintenance

### Regular Maintenance Tasks

1. **Weekly**: System updates and security patches
2. **Monthly**: Log rotation and cleanup
3. **Quarterly**: SSL certificate renewal
4. **Annually**: Security audit and key rotation

### Monitoring Alerts

Set up alerts for:
- High CPU/memory usage
- Application errors
- SSL certificate expiration
- Disk space usage
- Backup failures

---

*Last updated: January 2024*



