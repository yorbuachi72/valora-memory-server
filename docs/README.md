# Valora Documentation

Welcome to the comprehensive documentation for Valora MCP Server, your sovereign memory container for AI interactions and knowledge artifacts. This enterprise-ready platform supports multi-tenancy, PostgreSQL backend, vector search, and comprehensive monitoring.

## 📚 Documentation Index

### Getting Started
- [Installation Guide](installation.md) - How to install and set up Valora
- [Quick Start Guide](quick-start.md) - Get up and running in minutes
- [Configuration](configuration.md) - Environment variables and settings

### Core Features
- [Memory Management](memory-management.md) - How to create, search, and manage memories
- [Chat Continuity](chat-continuity.md) - Import and export chat conversations
- [API Reference](api-reference.md) - Complete REST API documentation

### Advanced Topics
- [Configuration](configuration.md) - Environment variables and settings
- [Security](SECURITY.md) - Encryption and data protection
- [Deployment](deployment.md) - Production deployment guide
- [Production Setup](production-setup.md) - Production deployment guide
- [Error Handling](error-handling.md) - Common errors and solutions

### Development & Testing
- [Integration Testing](integration-testing.md) - Testing procedures and workflows
- [API Documentation](api/) - OpenAPI/Swagger documentation

## 🚀 Quick Navigation

### For New Users
1. Start with [Installation Guide](installation.md)
2. Follow the [Quick Start Guide](quick-start.md)
3. Learn about [Memory Management](memory-management.md)

### For Developers
1. Check the [API Reference](api-reference.md)
2. Review [Configuration](configuration.md)
3. See [Integration Testing](integration-testing.md)

### For Production
1. Read [Production Setup](production-setup.md)
2. Configure [Security](SECURITY.md)
3. Set up [Deployment](deployment.md)

## 📖 Documentation Structure

```
docs/
├── README.md                    # This file - documentation index
├── installation.md              # Installation and setup
├── quick-start.md              # Quick start guide
├── configuration.md             # Configuration options
├── memory-management.md         # Core memory features
├── chat-continuity.md          # Chat import/export workflow
├── api-reference.md            # Complete API documentation
├── error-handling.md           # Troubleshooting guide
├── deployment.md               # Production deployment
├── production-setup.md         # Production deployment guide
├── integration-testing.md      # Testing procedures and workflows
├── SECURITY.md                 # Security features and guidelines
├── INTEGRATION_TESTING_SUMMARY.md    # Integration testing summary
├── NGINX_PRODUCTION_SUMMARY.md       # Nginx production setup summary
├── PRODUCTION_IMPLEMENTATION_SUMMARY.md # Production implementation summary
├── SCRIPTS_ORGANIZATION_SUMMARY.md   # Scripts organization summary
└── api/                        # OpenAPI/Swagger documentation
    ├── index.md
    ├── openapi.yaml
    ├── swagger-ui.html
    └── README.md
```

## 🏗️ Architecture Overview

### Core Components
- **PostgreSQL Backend**: Production-ready database with pgvector extension
- **Multi-tenancy**: Isolated data per tenant with proper access controls
- **Vector Search**: Semantic similarity search using embeddings
- **JWT Authentication**: Secure user authentication and authorization
- **Monitoring**: Comprehensive health checks and metrics collection
- **API Key Management**: Granular permission-based API access

### Technology Stack
- **Runtime**: Node.js 20+ with ES Modules and TypeScript 5+
- **Framework**: Express.js with security middleware (Helmet, CORS, rate limiting)
- **Database**: PostgreSQL 15+ with pgvector extension and connection pooling
- **AI/ML**: @xenova/transformers for local, privacy-preserving embeddings
- **Security**: bcrypt, JWT, Helmet.js, CORS, rate limiting, brute force protection
- **Monitoring**: Custom metrics, health checks, Prometheus-compatible endpoints
- **Deployment**: Docker, Docker Compose, nginx reverse proxy, Redis caching
- **Development**: Jest testing, ESLint, TypeScript compiler

## 🔗 Related Resources

- [Main README](../README.md) - Project overview and quick start
- [GitHub Repository](https://github.com/your-username/valora) - Source code
- [Issues](https://github.com/your-username/valora/issues) - Bug reports and feature requests
- [Discussions](https://github.com/your-username/valora/discussions) - Community discussions
- [Docker Hub](https://hub.docker.com/r/valora/mcp-server) - Official Docker images

## 📝 Contributing to Documentation

If you find any issues with the documentation or want to contribute improvements:

1. Check the [Contributing Guidelines](contributing.md)
2. Submit a pull request with your changes
3. Follow the documentation style guide
4. Test documentation locally with `npm run docs:serve`

## 🆘 Getting Help

- **Documentation Issues**: Create an issue in the repository
- **Feature Requests**: Use the discussions or issues
- **Security Issues**: See [SECURITY.md](../SECURITY.md)
- **Community Support**: Join our Discord server

## 📊 Version Information

- **Current Version**: 2.0.0
- **Last Updated**: December 2024
- **Node.js**: v20.0.0+
- **PostgreSQL**: v15+
- **License**: MIT

## 📚 Additional Resources

### Implementation Summaries
- [Integration Testing Summary](INTEGRATION_TESTING_SUMMARY.md)
- [Nginx Production Summary](NGINX_PRODUCTION_SUMMARY.md)
- [Production Implementation Summary](PRODUCTION_IMPLEMENTATION_SUMMARY.md)
- [Scripts Organization Summary](SCRIPTS_ORGANIZATION_SUMMARY.md)

---

**Valora MCP Server Documentation**  
*Version 2.0.0 - Updated: December 2024*  
*Enterprise-ready with PostgreSQL backend, vector search, multi-tenancy, and comprehensive monitoring*
