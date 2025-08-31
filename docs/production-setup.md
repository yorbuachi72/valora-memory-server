# Valora Production Setup Guide

## Overview

This guide covers setting up Valora MCP Server for production use with enhanced security, API key management, and integration features.

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Create production environment file
cp .env.example .env.production

# Set production environment variables
export NODE_ENV=production
export VALORA_API_KEY="your-secure-production-api-key"
export VALORA_SECRET_KEY="your-secure-production-secret-key"
export VALIDR_API_URL="https://your-validr-api.com"
export VALIDR_API_KEY="your-validr-api-key"
```

### 2. Start Production Server

```bash
# Start the production server
node production-valora.js
```

### 3. Run Production Tests

```bash
# Test all production features
./test-production.sh
```

## 🔧 Production Features

### Enhanced Security

#### **API Key Management**
- ✅ **Secure Key Generation**: Cryptographically secure API keys
- ✅ **Permission-Based Access**: Granular permissions (read, write, integrations, admin)
- ✅ **Rate Limiting**: Configurable per-minute and per-hour limits
- ✅ **Usage Tracking**: Detailed usage statistics and monitoring
- ✅ **Key Expiration**: Automatic cleanup of expired keys

#### **Authentication & Authorization**
```typescript
// Permission-based middleware
app.get('/memory/:id', enhancedApiKeyAuth, requireRead, (req, res) => {})
app.post('/memory', enhancedApiKeyAuth, requireWrite, (req, res) => {})
app.get('/integrations/status', enhancedApiKeyAuth, requireIntegrations, (req, res) => {})
```

#### **Audit Logging**
```typescript
// All operations are logged with context
🔍 AUDIT: Default API Key (abc123) performed read memory on /memory/test-id - Status: 200
🔍 AUDIT: Default API Key (abc123) performed create memory on /memory - Status: 201
```

### API Key Management Endpoints

#### **Create API Key (Admin Only)**
```bash
curl -X POST http://localhost:3000/api-keys \
  -H "Authorization: Bearer admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Validr Integration Key",
    "permissions": ["read", "write", "integrations"],
    "rateLimit": {
      "requestsPerMinute": 100,
      "requestsPerHour": 1000
    }
  }'
```

#### **List API Keys (Admin Only)**
```bash
curl -X GET http://localhost:3000/api-keys \
  -H "Authorization: Bearer admin-api-key"
```

#### **Get API Key Statistics**
```bash
curl -X GET http://localhost:3000/api-keys/me/stats \
  -H "Authorization: Bearer your-api-key"
```

### Memory Operations with Permissions

#### **Read Memory (Requires 'read' permission)**
```bash
curl -X GET http://localhost:3000/memory/memory-id \
  -H "Authorization: Bearer your-api-key"
```

#### **Create Memory (Requires 'write' permission)**
```bash
curl -X POST http://localhost:3000/memory \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "New memory content",
    "tags": ["important", "work"]
  }'
```

### Integration Endpoints

#### **Integration Status (Requires 'integrations' permission)**
```bash
curl -X GET http://localhost:3000/integrations/status \
  -H "Authorization: Bearer your-api-key"
```

#### **Validr Sync (Requires 'integrations' permission)**
```bash
curl -X POST http://localhost:3000/integrations/validr/sync \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "memory": {
      "id": "memory-123",
      "content": "validation rule content",
      "tags": ["validation", "rule"]
    }
  }'
```

## 🔒 Security Features

### **API Key Security**
- **Secure Generation**: Uses crypto.randomBytes for key generation
- **Key Masking**: API keys are masked in responses (except on creation)
- **Expiration**: Support for key expiration dates
- **Rate Limiting**: Per-key rate limiting with configurable limits

### **Permission System**
```typescript
// Available permissions
const permissions = [
  'read',        // Read memories
  'write',       // Create/update memories
  'integrations', // Access integration endpoints
  'admin'        // Full access including API key management
];
```

### **Rate Limiting**
```typescript
// Default rate limits per API key
{
  requestsPerMinute: 100,
  requestsPerHour: 1000
}
```

### **Error Handling**
```json
{
  "error": "Insufficient permissions. Required: admin",
  "code": "INSUFFICIENT_PERMISSIONS",
  "required": "admin",
  "available": ["read", "write", "integrations"]
}
```

## 📊 Monitoring & Analytics

### **Usage Statistics**
```bash
# Get your API key usage stats
curl -X GET http://localhost:3000/api-keys/me/stats \
  -H "Authorization: Bearer your-api-key"
```

**Response:**
```json
{
  "totalRequests": 1250,
  "requestsLastHour": 45,
  "requestsLastDay": 320,
  "averageResponseTime": 45.2,
  "errorRate": 0.02
}
```

### **Audit Logging**
All operations are logged with:
- API key ID and name
- Operation performed
- Endpoint accessed
- Response status
- Timestamp

## 🚀 Deployment

### **Environment Variables**
```bash
# Required
NODE_ENV=production
VALORA_API_KEY=your-secure-api-key
VALORA_SECRET_KEY=your-secure-secret-key

# Optional
PORT=3000
VALIDR_API_URL=https://your-validr-api.com
VALIDR_API_KEY=your-validr-api-key
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "production-valora.js"]
```

### **PM2 Deployment**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start production-valora.js --name "valora-mcp"

# Monitor
pm2 monit
```

## 🔧 Configuration

### **API Key Configuration**
```typescript
// Create API key with specific permissions
const apiKey = await apiKeyManager.createAPIKey({
  name: 'Validr Integration',
  permissions: ['read', 'write', 'integrations'],
  rateLimit: {
    requestsPerMinute: 200,
    requestsPerHour: 2000
  },
  expiresAt: new Date('2024-12-31') // Optional expiration
});
```

### **Rate Limiting Configuration**
```typescript
// Custom rate limits
{
  requestsPerMinute: 100,  // Max 100 requests per minute
  requestsPerHour: 1000    // Max 1000 requests per hour
}
```

## 🧪 Testing

### **Run Production Tests**
```bash
# Test all production features
./test-production.sh
```

### **Manual Testing**
```bash
# Test API key creation (requires admin key)
curl -X POST http://localhost:3000/api-keys \
  -H "Authorization: Bearer admin-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Key", "permissions": ["read"]}'

# Test memory operations
curl -X GET http://localhost:3000/memory/test-id \
  -H "Authorization: Bearer your-api-key"

# Test integration endpoints
curl -X GET http://localhost:3000/integrations/status \
  -H "Authorization: Bearer your-api-key"
```

## 🔍 Troubleshooting

### **Common Issues**

#### **1. API Key Not Working**
```bash
# Check if key is valid
curl -X GET http://localhost:3000/api-keys/test \
  -H "Authorization: Bearer your-api-key"
```

#### **2. Permission Denied**
```bash
# Check your permissions
curl -X GET http://localhost:3000/api-keys/me \
  -H "Authorization: Bearer your-api-key"
```

#### **3. Rate Limit Exceeded**
```bash
# Check your usage stats
curl -X GET http://localhost:3000/api-keys/me/stats \
  -H "Authorization: Bearer your-api-key"
```

### **Debug Mode**
```bash
# Enable debug logging
export DEBUG=valora:*
node production-valora.js
```

## 📈 Performance

### **Optimization Tips**
1. **Use appropriate rate limits** for your use case
2. **Monitor usage statistics** regularly
3. **Clean up expired API keys** automatically
4. **Use request IDs** for tracking issues
5. **Implement proper error handling** in your clients

### **Monitoring**
- Track API key usage patterns
- Monitor response times
- Watch for rate limit violations
- Check error rates regularly

## 🎯 Next Steps

1. **Set up real API keys** with appropriate permissions
2. **Configure Validr integration** with actual endpoints
3. **Implement monitoring** and alerting
4. **Set up backup and recovery** procedures
5. **Plan for scaling** as usage grows

## 🔐 Security Best Practices

1. **Use strong API keys** (32+ characters)
2. **Rotate keys regularly** (every 90 days)
3. **Use HTTPS** in production
4. **Monitor for suspicious activity**
5. **Implement proper logging** and monitoring
6. **Regular security audits**

---

**Valora MCP Server is now production-ready with enterprise-grade security features!** 🚀



