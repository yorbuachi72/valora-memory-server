# Nginx Production Architecture for Valora

## 🏗️ **Why nginx + Node.js?**

### **✅ Recommended Architecture**
```
Internet → nginx (reverse proxy) → Node.js Valora Server → Database
```

### **❌ Not Recommended**
```
Internet → nginx only (no application logic)
```

## 🎯 **Why This Architecture?**

### **1. nginx as Reverse Proxy** 🔄
- **Load Balancing**: Distribute traffic across multiple Node.js instances
- **SSL/TLS Termination**: Handle HTTPS certificates and encryption
- **Static File Serving**: Serve static assets efficiently
- **Rate Limiting**: Additional layer of rate limiting
- **Caching**: Cache responses and reduce load on Node.js
- **Security**: Additional security headers and DDoS protection

### **2. Node.js for Application Logic** ⚙️
- **MCP Protocol**: Handle Memory Container Protocol operations
- **API Key Management**: Your custom authentication system
- **Integration Logic**: Validr sync, webhooks, plugins
- **Real-time Features**: WebSocket connections for live updates
- **Database Operations**: Memory storage and retrieval

## 🚀 **Production Setup**

### **1. Quick Deployment**
```bash
# Make deployment script executable
chmod +x deploy-production.sh

# Deploy to production
./deploy-production.sh
```

### **2. Manual Setup**
```bash
# Create directories
mkdir -p nginx ssl logs/nginx logs/valora monitoring

# Generate SSL certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/valora.key -out ssl/valora.crt \
    -subj "/C=US/ST=State/L=City/O=Valora/CN=valora.localhost"

# Start production stack
docker-compose -f docker-compose.production.yml up -d
```

## 🔧 **Nginx Configuration Features**

### **Load Balancing**
```nginx
upstream valora_backend {
    server 127.0.0.1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

### **Rate Limiting**
```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

# Apply to endpoints
location /api-keys {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://valora_backend;
}
```

### **Security Headers**
```nginx
# Security Headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
```

### **SSL/TLS Configuration**
```nginx
# SSL Configuration
ssl_certificate /etc/ssl/certs/valora.crt;
ssl_certificate_key /etc/ssl/private/valora.key;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

## 📊 **Production Services**

### **1. Nginx Reverse Proxy**
- **Port**: 80 (HTTP) → 443 (HTTPS)
- **Load Balancing**: 3 Node.js instances
- **SSL Termination**: HTTPS certificates
- **Rate Limiting**: Per-endpoint limits
- **Security Headers**: Comprehensive protection

### **2. Valora MCP Servers (3 instances)**
- **Ports**: 3000, 3001, 3002
- **Health Checks**: Automatic monitoring
- **Auto-restart**: On failure
- **Logging**: Centralized logs

### **3. Redis Cache**
- **Session Storage**: API key sessions
- **Rate Limiting**: Distributed rate limiting
- **Caching**: Response caching

### **4. PostgreSQL Database**
- **Persistent Storage**: Memory data
- **Backup**: Automated backups
- **Monitoring**: Health checks

### **5. Monitoring Stack**
- **Prometheus**: Metrics collection
- **Grafana**: Dashboard visualization
- **Alerting**: Performance monitoring

## 🔍 **Endpoint Routing**

### **Health Check (No Rate Limiting)**
```nginx
location /health {
    proxy_pass http://valora_backend;
    access_log off;
}
```

### **API Key Management (Strict Rate Limiting)**
```nginx
location /api-keys {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://valora_backend;
}
```

### **Memory Operations (Standard Rate Limiting)**
```nginx
location /memory {
    limit_req zone=api burst=50 nodelay;
    proxy_pass http://valora_backend;
}
```

### **Integration Endpoints (Standard Rate Limiting)**
```nginx
location /integrations {
    limit_req zone=api burst=30 nodelay;
    proxy_pass http://valora_backend;
}
```

### **Validr Integration (Specific Rate Limiting)**
```nginx
location /integrations/validr {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://valora_backend;
}
```

## 🧪 **Testing Production Setup**

### **1. Health Check**
```bash
curl -X GET https://localhost/health
```

### **2. API Key Authentication**
```bash
# Should return 401 without auth
curl -X GET https://localhost/api-keys/test

# Should return 200 with valid auth
curl -X GET https://localhost/api-keys/test \
  -H "Authorization: Bearer your-api-key"
```

### **3. Memory Operations**
```bash
# Read memory
curl -X GET https://localhost/memory/test-id \
  -H "Authorization: Bearer your-api-key"

# Create memory
curl -X POST https://localhost/memory \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"content": "test memory"}'
```

### **4. Integration Endpoints**
```bash
# Integration status
curl -X GET https://localhost/integrations/status \
  -H "Authorization: Bearer your-api-key"

# Validr sync
curl -X POST https://localhost/integrations/validr/sync \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"memory": {"id": "test", "content": "validation rule"}}'
```

## 📈 **Performance Benefits**

### **1. Load Distribution**
- **3 Node.js instances**: Handle 3x more traffic
- **Automatic failover**: If one instance fails
- **Health monitoring**: Automatic restart on failure

### **2. Caching & Compression**
- **Gzip compression**: Faster response times
- **Static file caching**: Reduced server load
- **Response caching**: Cache frequently accessed data

### **3. Security**
- **SSL termination**: Handle encryption at nginx level
- **Rate limiting**: Prevent abuse
- **Security headers**: Comprehensive protection
- **DDoS protection**: Built-in protection

### **4. Monitoring**
- **Prometheus metrics**: Detailed performance data
- **Grafana dashboards**: Visual monitoring
- **Health checks**: Automatic service monitoring
- **Log aggregation**: Centralized logging

## 🔧 **Management Commands**

### **View Service Status**
```bash
docker-compose -f docker-compose.production.yml ps
```

### **View Logs**
```bash
# All services
docker-compose -f docker-compose.production.yml logs

# Specific service
docker-compose -f docker-compose.production.yml logs nginx
docker-compose -f docker-compose.production.yml logs valora-1
```

### **Restart Services**
```bash
# All services
docker-compose -f docker-compose.production.yml restart

# Specific service
docker-compose -f docker-compose.production.yml restart valora-1
```

### **Scale Services**
```bash
# Scale Valora instances
docker-compose -f docker-compose.production.yml up -d --scale valora-1=2
```

### **Update Configuration**
```bash
# Update nginx config
docker-compose -f docker-compose.production.yml restart nginx

# Update application
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

## 🎯 **Production Checklist**

### **✅ Security**
- [ ] SSL certificates configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] API key authentication working
- [ ] DDoS protection enabled

### **✅ Performance**
- [ ] Load balancing working
- [ ] Gzip compression enabled
- [ ] Caching configured
- [ ] Health checks passing
- [ ] Monitoring active

### **✅ Reliability**
- [ ] Multiple Node.js instances
- [ ] Auto-restart on failure
- [ ] Database backups configured
- [ ] Log aggregation working
- [ ] Error handling tested

### **✅ Monitoring**
- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards configured
- [ ] Health checks passing
- [ ] Logs being collected
- [ ] Alerting configured

## 🚀 **Next Steps**

### **1. Domain Configuration**
```bash
# Update nginx configuration
sed -i 's/valora.yourdomain.com/your-actual-domain.com/g' nginx/valora.conf
```

### **2. SSL Certificates**
```bash
# Replace self-signed with real certificates
cp your-real-cert.crt ssl/valora.crt
cp your-real-key.key ssl/valora.key
```

### **3. Environment Variables**
```bash
# Update production environment
nano .env.production
```

### **4. Monitoring Setup**
```bash
# Access Grafana
open http://localhost:3000

# Access Prometheus
open http://localhost:9090
```

---

**Your Valora MCP Server is now production-ready with enterprise-grade nginx architecture!** 🚀



