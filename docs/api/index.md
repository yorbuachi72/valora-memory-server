# Valora MCP Server API Documentation

## 📚 Documentation Index

Welcome to the Valora MCP Server API documentation. This comprehensive guide covers all aspects of the API, from basic usage to advanced integrations.

## 🚀 Quick Start

### 1. **API Overview** - [README.md](./README.md)
Complete API documentation with examples, authentication, and usage guides.

### 2. **Interactive Explorer** - [api-explorer.html](./api-explorer.html)
Interactive API explorer with Swagger UI for testing endpoints directly in your browser.

### 3. **OpenAPI Specification** - [openapi.yaml](./openapi.yaml)
Machine-readable API specification for code generation and integration.

## 📋 Documentation Structure

### **Core Documentation**
- **[README.md](./README.md)** - Complete API reference with examples
- **[openapi.yaml](./openapi.yaml)** - OpenAPI 3.0 specification
- **[api-explorer.html](./api-explorer.html)** - Interactive Swagger UI

### **Development Tools**
- **[serve-api-docs.sh](../../scripts/documentation/serve-api-docs.sh)** - Local documentation server

## 🔧 Getting Started

### **1. Start Local Documentation Server**
```bash
# Start documentation server on default port (8080)
./scripts/documentation/serve-api-docs.sh

# Start with custom port
./scripts/documentation/serve-api-docs.sh -p 3001

# Start and open browser automatically
./scripts/documentation/serve-api-docs.sh -o

# Validate documentation files only
./scripts/documentation/serve-api-docs.sh -v
```

### **2. Access Documentation**
Once the server is running, visit:
- **API Documentation**: http://localhost:8080/README.md
- **Interactive Explorer**: http://localhost:8080/api-explorer.html
- **OpenAPI Spec**: http://localhost:8080/openapi.yaml

## 📖 API Sections

### **System Endpoints**
- Health checks and system status
- Server information and version details

### **Authentication**
- API key management and validation
- Permission-based access control
- Usage statistics and monitoring

### **Memory Management**
- Create, read, update, delete memories
- Search and filter capabilities
- Tag-based organization

### **Chat Continuity**
- Import conversations from various formats
- Export conversations for AI agents
- Cross-platform compatibility

### **Integrations**
- Webhook management and configuration
- Plugin system for custom integrations
- Validr platform integration

## 🛠️ Development

### **API Testing**
```bash
# Test health endpoint
curl -X GET http://localhost:3000/health

# Test API key authentication
curl -X GET http://localhost:3000/api-keys/test \
  -H "Authorization: Bearer your-api-key"
```

### **Code Examples**
The documentation includes complete examples in:
- **JavaScript/Node.js** - Axios-based examples
- **Python** - Requests-based examples
- **cURL** - Command-line examples

### **Error Handling**
Comprehensive error documentation with:
- HTTP status codes
- Error response formats
- Common error scenarios
- Troubleshooting guides

## 🔗 Related Documentation

### **Project Documentation**
- **[../README.md](../README.md)** - Project overview and quick start
- **[../installation.md](../installation.md)** - Installation guide
- **[../configuration.md](../configuration.md)** - Configuration options

### **Development Guides**
- **[../integration-testing.md](../integration-testing.md)** - Integration testing
- **[../production-setup.md](../production-setup.md)** - Production deployment
- **[../error-handling.md](../error-handling.md)** - Error handling guide

### **Scripts**
- **[../../scripts/README.md](../../scripts/README.md)** - Scripts documentation
- **[../../scripts/testing/](../../scripts/testing/)** - Testing scripts
- **[../../scripts/deployment/](../../scripts/deployment/)** - Deployment scripts

## 🎯 API Features

### **✅ Implemented Features**
- **Authentication**: API key-based authentication with permissions
- **Memory Management**: Full CRUD operations with search
- **Chat Continuity**: Import/export conversations
- **Integrations**: Webhook and plugin system
- **Security**: Rate limiting, input validation, audit logging
- **Monitoring**: Health checks and usage statistics

### **🔄 Planned Features**
- **Real-time**: WebSocket support for live updates
- **GraphQL**: Alternative API layer
- **Advanced Caching**: Redis-based caching strategies
- **Analytics**: Comprehensive metrics dashboard
- **Advanced Security**: 2FA, OAuth integration

## 📊 API Statistics

### **Endpoint Coverage**
- **System**: 1 endpoint (health check)
- **Authentication**: 3 endpoints (test, info, stats)
- **Memory**: 3 endpoints (CRUD, search)
- **Chat**: 2 endpoints (import, export)
- **Integrations**: 8 endpoints (webhooks, plugins, status)

### **Total Endpoints**: 17 endpoints

### **Authentication Methods**
- API Key (Bearer token)
- Permission-based access control
- Rate limiting per key

### **Response Formats**
- JSON (primary)
- Error responses with detailed messages
- Rate limit headers included

## 🆘 Support

### **Documentation Issues**
- **GitHub Issues**: https://github.com/valora/mcp-server/issues
- **Documentation**: https://docs.valora.com
- **Email**: support@valora.com

### **API Support**
- **Interactive Explorer**: Test endpoints directly
- **Code Examples**: Ready-to-use examples
- **Error Documentation**: Comprehensive error handling

## 🚀 Quick Links

### **Essential Documentation**
- **[Complete API Reference](./README.md)** - Full API documentation
- **[Interactive Explorer](./api-explorer.html)** - Test endpoints
- **[OpenAPI Spec](./openapi.yaml)** - Machine-readable spec

### **Development Tools**
- **[Documentation Server](../../scripts/documentation/serve-api-docs.sh)** - Local development
- **[Testing Scripts](../../scripts/testing/)** - API testing
- **[Deployment Scripts](../../scripts/deployment/)** - Production setup

---

**The Valora MCP Server API provides comprehensive functionality with enterprise-grade security, performance, and developer experience!** 🚀

**Start exploring the API with the interactive explorer or dive into the complete documentation!** 📚



