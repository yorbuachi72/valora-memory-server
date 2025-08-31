# Valora Integration Testing Guide

## Overview

This guide covers how to test the Valora integration system, including webhooks, plugins, and API endpoints.

## Environment Setup

### Required Environment Variables

```bash
# Core Valora Configuration
export VALORA_API_KEY="your-secure-api-key"
export VALORA_SECRET_KEY="your-secure-secret-key-for-encryption"

# Validr Integration (Optional)
export VALIDR_API_URL="https://api.validr.com"
export VALIDR_API_KEY="your-validr-api-key"
```

### Starting the Test Server

```bash
# Start the minimal test server
node minimal-valora.js
```

## API Endpoints

### Health Check (No Authentication Required)

```bash
curl -X GET http://localhost:3000/health
```

**Response:**
```json
{
  "status": "Valora MCP Server is running.",
  "timestamp": "2025-08-07T22:42:35.447Z",
  "version": "1.0.0"
}
```

### Authentication Test

```bash
curl -X GET http://localhost:3000/auth/status \
  -H "Authorization: Bearer your-secure-api-key"
```

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "type": "api-key",
    "id": "api-user"
  },
  "timestamp": "2025-08-07T22:43:05.126Z"
}
```

## Integration Endpoints

### Get Integration Status

```bash
curl -X GET http://localhost:3000/integrations/status \
  -H "Authorization: Bearer your-secure-api-key"
```

**Response:**
```json
{
  "webhooks": {
    "total": 0,
    "enabled": 0,
    "disabled": 0
  },
  "plugins": {
    "total": 0,
    "enabled": 0,
    "disabled": 0
  },
  "events": [
    "memory.created",
    "memory.updated",
    "memory.deleted",
    "chat.imported",
    "search.performed",
    "export.completed"
  ]
}
```

### Register Webhook

```bash
curl -X POST http://localhost:3000/integrations/webhooks \
  -H "Authorization: Bearer your-secure-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.validr.com/webhooks/valora",
    "events": ["memory.created", "chat.imported"],
    "enabled": true,
    "headers": {
      "X-Custom-Header": "value"
    },
    "retryPolicy": {
      "maxRetries": 3,
      "backoffMs": 1000,
      "timeoutMs": 10000
    }
  }'
```

**Response:**
```json
{
  "id": "webhook_1234567890_abc123",
  "message": "Webhook registered successfully",
  "config": {
    "url": "https://api.validr.com/webhooks/valora",
    "events": ["memory.created", "chat.imported"],
    "enabled": true
  }
}
```

### List Webhooks

```bash
curl -X GET http://localhost:3000/integrations/webhooks \
  -H "Authorization: Bearer your-secure-api-key"
```

**Response:**
```json
[
  {
    "id": "webhook_1234567890_abc123",
    "url": "https://api.validr.com/webhooks/valora",
    "events": ["memory.created", "chat.imported"],
    "enabled": true,
    "createdAt": "2025-08-07T22:43:05.126Z",
    "updatedAt": "2025-08-07T22:43:05.126Z"
  }
]
```

## Error Handling Tests

### Missing Authentication

```bash
curl -X GET http://localhost:3000/integrations/status
```

**Response:**
```json
{
  "error": "Missing or invalid authorization header"
}
```

### Invalid API Key

```bash
curl -X GET http://localhost:3000/integrations/status \
  -H "Authorization: Bearer invalid-key"
```

**Response:**
```json
{
  "error": "Invalid API key"
}
```

## Automated Testing

### Run the Test Suite

```bash
# Make the test script executable
chmod +x test-integrations.sh

# Run all tests
./test-integrations.sh
```

### Test Results

The test suite validates:

- ✅ Health endpoint (no auth required)
- ✅ API key authentication
- ✅ Integration status endpoint
- ✅ Webhook registration endpoint
- ✅ Webhook listing endpoint
- ✅ Error handling for invalid/missing auth

## Integration Features

### Webhook System

- **Real-time Events**: 6 different event types supported
- **Retry Logic**: Configurable retry policies with exponential backoff
- **Security**: Proper headers and authentication
- **Validation**: Zod schema validation for all inputs

### Plugin System

- **Extensible Architecture**: Capability-based plugin design
- **Event-Driven**: Plugins respond to memory and chat events
- **Error Handling**: Robust error handling and logging
- **Validr Integration**: Sample integration with your platform

### Validr Integration

- **Smart Detection**: Automatically detects validation-related content
- **Bidirectional Sync**: Memory and conversation synchronization
- **Configuration**: Environment-based configuration
- **Error Handling**: Graceful error handling and logging

## Next Steps

1. **Production Setup**: Configure real API keys and secrets
2. **Validr Integration**: Set up actual Validr API endpoints
3. **Webhook Testing**: Test with real external services
4. **Plugin Development**: Create custom plugins for your needs
5. **UI Development**: Build integration management interface

## Troubleshooting

### Common Issues

1. **Server Won't Start**: Check environment variables are set
2. **Authentication Fails**: Verify API key is correct
3. **Webhook Registration Fails**: Check URL format and events array
4. **Integration Status Empty**: Normal for fresh installation

### Debug Mode

To enable debug logging, set the environment variable:

```bash
export DEBUG=valora:*
```

## API Reference

For complete API documentation, see [API Reference](api-reference.md).

## Security Notes

- API keys should be kept secure and not committed to version control
- Use HTTPS for production webhook URLs
- Implement proper rate limiting for production use
- Monitor webhook delivery and retry attempts



