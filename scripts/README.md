# Valora Scripts Directory

This directory contains all shell scripts for Valora MCP Server management, organized by category.

## 📁 Directory Structure

```
scripts/
├── deployment/          # Deployment and setup scripts
├── testing/            # Testing and validation scripts
├── monitoring/         # Health check and monitoring scripts
├── maintenance/        # Backup and maintenance scripts
└── README.md          # This file
```

## 🚀 Deployment Scripts

### **`deployment/deploy-production.sh`**
**Purpose**: Complete production deployment with nginx, Docker, and monitoring
**Usage**:
```bash
./scripts/deployment/deploy-production.sh
```
**Features**:
- ✅ Automated production setup
- ✅ SSL certificate generation
- ✅ Docker Compose deployment
- ✅ Health checks and validation
- ✅ Environment configuration

### **`deployment/deploy-development.sh`**
**Purpose**: Quick development environment setup
**Usage**:
```bash
./scripts/deployment/deploy-development.sh
```
**Features**:
- ✅ Development server setup
- ✅ Environment configuration
- ✅ Basic testing
- ✅ Development mode features

## 🧪 Testing Scripts

### **`testing/test-integrations.sh`**
**Purpose**: Test integration endpoints and webhooks
**Usage**:
```bash
./scripts/testing/test-integrations.sh
```
**Features**:
- ✅ Integration endpoint testing
- ✅ Webhook registration testing
- ✅ Validr sync testing
- ✅ Authentication testing

### **`testing/test-production.sh`**
**Purpose**: Comprehensive production feature testing
**Usage**:
```bash
./scripts/testing/test-production.sh
```
**Features**:
- ✅ Production security testing
- ✅ API key management testing
- ✅ Rate limiting testing
- ✅ Error handling testing

### **`testing/test-all.sh`**
**Purpose**: Run all tests comprehensively
**Usage**:
```bash
./scripts/testing/test-all.sh
```
**Features**:
- ✅ All test suites combined
- ✅ Server health checks
- ✅ API endpoint validation
- ✅ Security checks
- ✅ Performance checks

## 📊 Monitoring Scripts

### **`monitoring/health-check.sh`**
**Purpose**: Comprehensive health monitoring
**Usage**:
```bash
./scripts/monitoring/health-check.sh
```
**Features**:
- ✅ Service health checks
- ✅ API endpoint monitoring
- ✅ Docker container monitoring
- ✅ Response time monitoring
- ✅ System resource monitoring

## 🔧 Maintenance Scripts

### **`maintenance/backup.sh`**
**Purpose**: Backup and maintenance tasks
**Usage**:
```bash
# Regular backup
./scripts/maintenance/backup.sh

# Backup with service restart
./scripts/maintenance/backup.sh --restart
```
**Features**:
- ✅ Configuration backup
- ✅ Database backup
- ✅ Log backup
- ✅ Cleanup tasks
- ✅ Service restart

## 🎯 Quick Start Commands

### **Development Setup**
```bash
# Start development environment
./scripts/deployment/deploy-development.sh

# Run all tests
./scripts/testing/test-all.sh

# Check health
./scripts/monitoring/health-check.sh
```

### **Production Setup**
```bash
# Deploy to production
./scripts/deployment/deploy-production.sh

# Test production features
./scripts/testing/test-production.sh

# Monitor production health
./scripts/monitoring/health-check.sh

# Backup and maintenance
./scripts/maintenance/backup.sh
```

### **Daily Operations**
```bash
# Health check
./scripts/monitoring/health-check.sh

# Run tests
./scripts/testing/test-all.sh

# Backup (weekly)
./scripts/maintenance/backup.sh
```

## 🔧 Script Features

### **✅ Common Features**
- **Color-coded output**: Green for success, red for errors, yellow for warnings
- **Comprehensive logging**: Detailed status messages
- **Error handling**: Graceful failure handling
- **Progress tracking**: Test counters and summaries
- **Cross-platform**: Works on macOS, Linux, and Windows (with WSL)

### **✅ Security Features**
- **Environment validation**: Check required variables
- **SSL certificate validation**: Verify certificates
- **Authentication testing**: Test API key security
- **Rate limiting validation**: Verify rate limiting

### **✅ Monitoring Features**
- **Service health checks**: Verify all services are running
- **Response time monitoring**: Track performance
- **Resource monitoring**: Check disk space, memory usage
- **Log monitoring**: Verify log files and sizes

### **✅ Maintenance Features**
- **Automated backups**: Configuration, database, logs
- **Cleanup tasks**: Remove old files and logs
- **Service restart**: Graceful service management
- **Disk space monitoring**: Prevent disk space issues

## 📋 Script Requirements

### **System Requirements**
- **Bash**: All scripts require bash shell
- **curl**: For HTTP requests and testing
- **Docker**: For production deployment (optional)
- **Node.js**: For development and testing
- **npm**: For package management

### **Environment Variables**
```bash
# Required for all scripts
export VALORA_API_KEY="your-api-key"
export VALORA_SECRET_KEY="your-secret-key"

# Optional for production
export NODE_ENV="production"
export VALIDR_API_URL="https://your-validr-api.com"
export VALIDR_API_KEY="your-validr-api-key"
```

## 🎯 Usage Examples

### **Development Workflow**
```bash
# 1. Start development environment
./scripts/deployment/deploy-development.sh

# 2. Run tests
./scripts/testing/test-all.sh

# 3. Check health
./scripts/monitoring/health-check.sh

# 4. Make changes and test again
./scripts/testing/test-integrations.sh
```

### **Production Workflow**
```bash
# 1. Deploy to production
./scripts/deployment/deploy-production.sh

# 2. Test production features
./scripts/testing/test-production.sh

# 3. Monitor health
./scripts/monitoring/health-check.sh

# 4. Regular maintenance
./scripts/maintenance/backup.sh
```

### **CI/CD Integration**
```bash
# In your CI/CD pipeline
./scripts/testing/test-all.sh
./scripts/monitoring/health-check.sh
```

## 🔍 Troubleshooting

### **Common Issues**

#### **1. Permission Denied**
```bash
# Make scripts executable
chmod +x scripts/**/*.sh
```

#### **2. Script Not Found**
```bash
# Run from project root
cd /path/to/valora
./scripts/deployment/deploy-production.sh
```

#### **3. Environment Variables Missing**
```bash
# Set required variables
export VALORA_API_KEY="your-api-key"
export VALORA_SECRET_KEY="your-secret-key"
```

#### **4. Docker Not Available**
```bash
# Install Docker or use development mode
./scripts/deployment/deploy-development.sh
```

### **Debug Mode**
```bash
# Run with debug output
bash -x ./scripts/testing/test-all.sh
```

## 📚 Script Documentation

### **Adding New Scripts**
1. Place in appropriate category directory
2. Make executable: `chmod +x script.sh`
3. Add documentation to this README
4. Test thoroughly

### **Script Standards**
- Use color-coded output
- Include comprehensive error handling
- Add progress tracking
- Provide clear usage instructions
- Follow bash best practices

## 🎉 Conclusion

The scripts directory provides comprehensive automation for:
- ✅ **Deployment**: Development and production setup
- ✅ **Testing**: Comprehensive test suites
- ✅ **Monitoring**: Health checks and monitoring
- ✅ **Maintenance**: Backup and cleanup tasks

**All scripts are production-ready and follow best practices for reliability and maintainability!** 🚀
