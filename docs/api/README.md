# Valora MCP Server API Documentation

## 📖 Overview

The Valora MCP Server API provides a comprehensive interface for managing memories, chat conversations, and integrations. This documentation covers all endpoints, authentication, and usage examples.

## 🔐 Authentication

All API endpoints require authentication using API keys. Include your API key in the Authorization header:

```bash
Authorization: Bearer your-api-key
```

### API Key Permissions

- **read**: Access to read memories and conversations
- **write**: Ability to create and update memories
- **integrations**: Access to webhook and plugin management
- **admin**: Full access including API key management

## 📊 Rate Limiting

API requests are rate-limited per API key:
- **Default**: 100 requests per minute, 1000 per hour
- **Configurable**: Per API key basis
- **Headers**: Rate limit information included in responses

## 🚀 Quick Start

### 1. Get Your API Key

```bash
# Test your API key
curl -X GET http://localhost:3000/api-keys/test \
  -H "Authorization: Bearer your-api-key"
```

### 2. Check System Health

```bash
# Health check (no authentication required)
curl -X GET http://localhost:3000/health
```

### 3. Create Your First Memory

```bash
# Create a memory
curl -X POST http://localhost:3000/memory \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is my first memory about AI and machine learning",
    "tags": ["ai", "machine-learning", "important"]
  }'
```

## 📋 API Endpoints

### System Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "Valora MCP Server is running.",
  "timestamp": "2024-12-19T10:30:00Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### Authentication Endpoints

#### Test API Key
```http
GET /api-keys/test
```

**Response:**
```json
{
  "authenticated": true,
  "apiKey": {
    "id": "key_123456789",
    "name": "Production API Key",
    "permissions": ["read", "write", "integrations"],
    "createdAt": "2024-12-19T10:00:00Z",
    "lastUsed": "2024-12-19T10:30:00Z"
  },
  "user": {
    "type": "api-key",
    "id": "key_123456789",
    "permissions": ["read", "write", "integrations"]
  },
  "timestamp": "2024-12-19T10:30:00Z"
}
```

#### Get API Key Info
```http
GET /api-keys/me
```

#### Get Usage Statistics
```http
GET /api-keys/me/stats
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

### Memory Endpoints

#### Get Memory
```http
GET /memory/{id}
```

**Example:**
```bash
curl -X GET http://localhost:3000/memory/memory_123456789 \
  -H "Authorization: Bearer your-api-key"
```

**Response:**
```json
{
  "id": "memory_123456789",
  "content": "This is a memory about AI and machine learning",
  "tags": ["ai", "machine-learning", "important"],
  "metadata": {
    "source": "chat-import",
    "confidence": 0.95,
    "createdAt": "2024-12-19T10:00:00Z",
    "updatedAt": "2024-12-19T10:30:00Z"
  }
}
```

#### Create Memory
```http
POST /memory
```

**Example:**
```bash
curl -X POST http://localhost:3000/memory \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "New memory about neural networks",
    "tags": ["ai", "neural-networks", "research"],
    "metadata": {
      "source": "manual",
      "confidence": 0.9
    }
  }'
```

#### Search Memories
```http
GET /memory/search?query={query}&tags={tags}&limit={limit}&offset={offset}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/memory/search?query=machine%20learning&tags=ai,important&limit=10" \
  -H "Authorization: Bearer your-api-key"
```

**Response:**
```json
{
  "results": [
    {
      "id": "memory_123456789",
      "content": "Machine learning algorithms for classification",
      "tags": ["ai", "machine-learning", "important"],
      "metadata": {
        "source": "chat-import",
        "confidence": 0.95
      }
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

### Chat Endpoints

#### Import Chat Conversation
```http
POST /chat/import
```

**Example:**
```bash
curl -X POST http://localhost:3000/chat/import \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": {
      "id": "chat_123456789",
      "title": "AI Discussion",
      "messages": [
        {
          "role": "user",
          "content": "What is machine learning?",
          "timestamp": "2024-12-19T10:00:00Z"
        },
        {
          "role": "assistant",
          "content": "Machine learning is a subset of AI that enables computers to learn without being explicitly programmed.",
          "timestamp": "2024-12-19T10:00:05Z"
        }
      ],
      "metadata": {
        "source": "slack",
        "participants": ["user1", "user2"]
      }
    },
    "format": "json"
  }'
```

**Response:**
```json
{
  "id": "chat_123456789",
  "message": "Chat conversation imported successfully",
  "memoryCount": 15
}
```

#### Export Chat Conversation
```http
POST /chat/export
```

**Example:**
```bash
curl -X POST http://localhost:3000/chat/export \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "chat_123456789",
    "format": "json"
  }'
```

**Response:**
```json
{
  "conversationId": "chat_123456789",
  "format": "json",
  "data": {
    "id": "chat_123456789",
    "title": "AI Discussion",
    "messages": [
      {
        "role": "user",
        "content": "What is machine learning?",
        "timestamp": "2024-12-19T10:00:00Z"
      },
      {
        "role": "assistant",
        "content": "Machine learning is a subset of AI that enables computers to learn without being explicitly programmed.",
        "timestamp": "2024-12-19T10:00:05Z"
      }
    ]
  }
}
```

### Integration Endpoints

#### Get Integration Status
```http
GET /integrations/status
```

**Response:**
```json
{
  "webhooks": {
    "total": 5,
    "enabled": 3,
    "disabled": 2
  },
  "plugins": {
    "total": 2,
    "enabled": 1,
    "disabled": 1
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

#### List Webhooks
```http
GET /integrations/webhooks
```

#### Register Webhook
```http
POST /integrations/webhooks
```

**Example:**
```bash
curl -X POST http://localhost:3000/integrations/webhooks \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/webhooks/valora",
    "events": ["memory.created", "chat.imported"],
    "headers": {
      "X-Custom-Header": "custom-value"
    },
    "retryPolicy": {
      "maxRetries": 3,
      "backoffMs": 1000,
      "timeoutMs": 5000
    },
    "enabled": true
  }'
```

**Response:**
```json
{
  "id": "webhook_123456789",
  "url": "https://api.example.com/webhooks/valora",
  "events": ["memory.created", "chat.imported"],
  "headers": {
    "X-Custom-Header": "custom-value"
  },
  "retryPolicy": {
    "maxRetries": 3,
    "backoffMs": 1000,
    "timeoutMs": 5000
  },
  "enabled": true,
  "createdAt": "2024-12-19T10:00:00Z",
  "updatedAt": "2024-12-19T10:00:00Z"
}
```

#### Sync to Validr
```http
POST /integrations/validr/sync
```

**Example:**
```bash
curl -X POST http://localhost:3000/integrations/validr/sync \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "memory": {
      "id": "memory_123456789",
      "content": "Validation rule for user authentication",
      "tags": ["validation", "auth", "security"],
      "metadata": {
        "source": "manual",
        "confidence": 0.95
      }
    },
    "action": "created"
  }'
```

**Response:**
```json
{
  "message": "Synced to Validr successfully",
  "data": {
    "memory": {
      "id": "memory_123456789",
      "content": "Validation rule for user authentication",
      "tags": ["validation", "auth", "security"]
    }
  },
  "timestamp": "2024-12-19T10:30:00Z"
}
```

## 🔧 Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

### Error Response Format
```json
{
  "error": "Invalid API key",
  "code": "INVALID_API_KEY",
  "details": {
    "required": "valid API key",
    "provided": "invalid-key"
  }
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Invalid request data |
| 401 | INVALID_API_KEY | Invalid or missing API key |
| 403 | INSUFFICIENT_PERMISSIONS | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 429 | RATE_LIMIT_EXCEEDED | Rate limit exceeded |
| 500 | INTERNAL_ERROR | Internal server error |

## 📝 Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const API_KEY = 'your-api-key';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Health check
async function checkHealth() {
  try {
    const response = await api.get('/health');
    console.log('Server status:', response.data.status);
  } catch (error) {
    console.error('Health check failed:', error.response.data);
  }
}

// Create memory
async function createMemory(content, tags = []) {
  try {
    const response = await api.post('/memory', {
      content,
      tags,
      metadata: {
        source: 'api',
        confidence: 0.9
      }
    });
    console.log('Memory created:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('Failed to create memory:', error.response.data);
  }
}

// Search memories
async function searchMemories(query, tags = []) {
  try {
    const params = new URLSearchParams({
      query,
      tags: tags.join(','),
      limit: 10
    });
    const response = await api.get(`/memory/search?${params}`);
    return response.data.results;
  } catch (error) {
    console.error('Search failed:', error.response.data);
  }
}

// Import chat
async function importChat(conversation) {
  try {
    const response = await api.post('/chat/import', {
      conversation,
      format: 'json'
    });
    console.log('Chat imported:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('Import failed:', error.response.data);
  }
}
```

### Python

```python
import requests
import json

API_BASE_URL = 'http://localhost:3000'
API_KEY = 'your-api-key'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

def check_health():
    """Check server health"""
    try:
        response = requests.get(f'{API_BASE_URL}/health')
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Health check failed: {e}')
        return None

def create_memory(content, tags=None):
    """Create a new memory"""
    if tags is None:
        tags = []
    
    data = {
        'content': content,
        'tags': tags,
        'metadata': {
            'source': 'api',
            'confidence': 0.9
        }
    }
    
    try:
        response = requests.post(
            f'{API_BASE_URL}/memory',
            headers=headers,
            json=data
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Failed to create memory: {e}')
        return None

def search_memories(query, tags=None, limit=10):
    """Search memories"""
    if tags is None:
        tags = []
    
    params = {
        'query': query,
        'tags': ','.join(tags),
        'limit': limit
    }
    
    try:
        response = requests.get(
            f'{API_BASE_URL}/memory/search',
            headers=headers,
            params=params
        )
        response.raise_for_status()
        return response.json()['results']
    except requests.exceptions.RequestException as e:
        print(f'Search failed: {e}')
        return []

def import_chat(conversation):
    """Import a chat conversation"""
    data = {
        'conversation': conversation,
        'format': 'json'
    }
    
    try:
        response = requests.post(
            f'{API_BASE_URL}/chat/import',
            headers=headers,
            json=data
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Import failed: {e}')
        return None
```

### cURL Examples

```bash
# Health check
curl -X GET http://localhost:3000/health

# Test API key
curl -X GET http://localhost:3000/api-keys/test \
  -H "Authorization: Bearer your-api-key"

# Create memory
curl -X POST http://localhost:3000/memory \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Example memory content",
    "tags": ["example", "test"]
  }'

# Search memories
curl -X GET "http://localhost:3000/memory/search?query=example&limit=5" \
  -H "Authorization: Bearer your-api-key"

# Import chat
curl -X POST http://localhost:3000/chat/import \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": {
      "id": "chat_123",
      "title": "Example Chat",
      "messages": [
        {
          "role": "user",
          "content": "Hello",
          "timestamp": "2024-12-19T10:00:00Z"
        }
      ]
    }
  }'

# Register webhook
curl -X POST http://localhost:3000/integrations/webhooks \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/webhooks/valora",
    "events": ["memory.created", "chat.imported"]
  }'
```

## 🔗 Interactive API Explorer

For an interactive API explorer with Swagger UI, visit:
- **Development**: http://localhost:3000/docs/api-explorer.html
- **Production**: https://api.valora.com/docs/api-explorer.html

## 📚 Additional Resources

- **OpenAPI Specification**: [openapi.yaml](./openapi.yaml)
- **Interactive Explorer**: [api-explorer.html](./api-explorer.html)
- **Integration Guide**: [../integration-testing.md](../integration-testing.md)
- **Production Setup**: [../production-setup.md](../production-setup.md)

## 🆘 Support

For API support and questions:
- **GitHub Issues**: https://github.com/valora/mcp-server/issues
- **Documentation**: https://docs.valora.com
- **Email**: support@valora.com

---

**The Valora MCP Server API provides comprehensive functionality for memory management, chat continuity, and integrations with enterprise-grade security and performance!** 🚀
