# Valora API Reference

Complete reference for all Valora MCP Server API endpoints, including authentication, user management, memory operations, monitoring, and administrative functions.

## Base URL

```
http://localhost:3000
```

## Authentication

Valora supports two authentication methods:

### 1. JWT Authentication (Recommended)
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. API Key Authentication (Legacy)
```bash
Authorization: Bearer val_1234567890abcdef
```

## Core Concepts

### Multi-tenancy
Valora supports multi-tenant deployments where each tenant has isolated data. Tenants are identified by:
- `X-Tenant-ID` header
- `tenantId` query parameter
- Default tenant for single-tenant setups

### Response Format
All API responses follow a consistent format:
```json
{
  "data": { /* response data */ },
  "message": "Success message",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

## Endpoints

## 1. Health & Monitoring

### GET /health
Returns basic server health status.

**Response:**
```json
{
  "status": "Valora MCP Server is running.",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0"
}
```

### GET /monitoring/health
Comprehensive health check with system diagnostics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database connection OK",
      "details": { "latency": "5ms" }
    },
    "memory": {
      "status": "pass",
      "message": "Memory usage normal: 75.2%",
      "details": { "used": "75MB", "total": "100MB" }
    },
    "performance": {
      "status": "pass",
      "message": "Average response time: 45ms"
    }
  }
}
```

### GET /monitoring/metrics
Real-time system metrics and performance data.

**Response:**
```json
{
  "requests": {
    "total": 1250,
    "byEndpoint": { "/api/memories": 450, "/api/search": 320 },
    "byMethod": { "GET": 890, "POST": 360 },
    "responseTimes": [12, 15, 8, 45, 23],
    "errors": { "total": 5, "byStatus": { "404": 3, "500": 2 } }
  },
  "memory": { "used": 75497472, "total": 100000000, "external": 1000000 },
  "uptime": 3600,
  "lastUpdated": 1642234567890
}
```

### GET /monitoring/performance
Performance metrics and system statistics.

**Response:**
```json
{
  "uptime": 3600,
  "memory": {
    "used": "75MB",
    "total": "100MB",
    "usagePercent": 75.2
  },
  "requests": {
    "total": 1250,
    "averageResponseTime": 45,
    "errorRate": 0.4,
    "requestsPerSecond": 0.35
  },
  "topEndpoints": [
    { "endpoint": "/api/memories", "count": 450 },
    { "endpoint": "/api/search", "count": 320 }
  ]
}
```

### GET /monitoring/system
System information and environment details.

**Response:**
```json
{
  "platform": "darwin",
  "arch": "arm64",
  "nodeVersion": "v18.16.0",
  "uptime": 3600,
  "memory": {
    "rss": 100000000,
    "heapTotal": 75000000,
    "heapUsed": 45000000
  },
  "environment": {
    "nodeEnv": "production",
    "port": "3000",
    "database": "postgresql"
  }
}
```

## 2. Authentication

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "johndoe",
  "fullName": "John Doe",
  "tenantId": "optional-tenant-id"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "role": "user",
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

### POST /auth/login
Authenticate user and get tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "lastLoginAt": "2024-01-15T10:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

### POST /auth/logout
Logout user and invalidate tokens.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

### GET /auth/profile
Get current user profile.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "settings": { "theme": "dark" },
    "role": "user",
    "emailVerified": true,
    "lastLoginAt": "2024-01-15T10:00:00.000Z",
    "createdAt": "2024-01-15T09:00:00.000Z"
  }
}
```

### PUT /auth/profile
Update user profile.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Request Body:**
```json
{
  "username": "newusername",
  "fullName": "Updated Name",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "settings": { "theme": "light", "notifications": true }
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

### POST /auth/password/change
Change user password.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

### POST /auth/password/reset-request
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with this email exists, a reset link has been sent."
}
```

### POST /auth/password/reset
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

### Memory Management

#### POST /memory

Create a new memory.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer your-api-key
```

**Request Body:**
```json
{
  "content": "This is the memory content",
  "source": "manual",
  "tags": ["tag1", "tag2"],
  "metadata": {
    "key": "value"
  }
}
```

**Response:**
```json
{
  "id": "uuid-of-memory",
  "content": "This is the memory content",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": 1,
  "tags": ["tag1", "tag2"],
  "inferredTags": ["auto-tag1", "auto-tag2"],
  "metadata": {
    "key": "value"
  },
  "source": "manual"
}
```

#### GET /memory/:id

Retrieve a specific memory by ID.

**Response:**
```json
{
  "id": "uuid-of-memory",
  "content": "Memory content",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": 1,
  "tags": ["tag1", "tag2"],
  "inferredTags": ["auto-tag1"],
  "metadata": {},
  "source": "manual"
}
```

#### PUT /memory/:id

Update an existing memory.

**Request Body:**
```json
{
  "content": "Updated memory content",
  "tags": ["updated-tag"],
  "metadata": {
    "updated": true
  }
}
```

**Response:**
```json
{
  "id": "uuid-of-memory",
  "content": "Updated memory content",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": 2,
  "tags": ["updated-tag"],
  "inferredTags": ["auto-tag1"],
  "metadata": {
    "updated": true
  },
  "source": "manual"
}
```

#### DELETE /memory/:id

Delete a memory.

**Response:**
```json
{
  "success": true,
  "message": "Memory deleted successfully"
}
```

#### GET /memory/search

Search memories by query.

**Query Parameters:**
- `q` (required): Search query string

**Response:**
```json
{
  "query": "search term",
  "results": [
    {
      "id": "uuid-of-memory",
      "content": "Memory content",
      "timestamp": "2024-01-15T10:00:00.000Z",
      "version": 1,
      "tags": ["tag1"],
      "inferredTags": ["auto-tag1"],
      "metadata": {},
      "source": "manual",
      "score": 0.95
    }
  ],
  "total": 1
}
```

#### POST /memory/semantic-search

Perform semantic search on memories.

**Request Body:**
```json
{
  "query": "semantic search query",
  "limit": 10
}
```

**Response:**
```json
{
  "query": "semantic search query",
  "results": [
    {
      "id": "uuid-of-memory",
      "content": "Memory content",
      "timestamp": "2024-01-15T10:00:00.000Z",
      "version": 1,
      "tags": ["tag1"],
      "inferredTags": ["auto-tag1"],
      "metadata": {},
      "source": "manual",
      "similarity": 0.85
    }
  ],
  "total": 1
}
```

### Chat Import/Export

#### POST /chat/import

Import structured chat data.

**Request Body:**
```json
{
  "conversationId": "chat_123",
  "messages": [
    {
      "participant": "user",
      "content": "How do I build a React component?",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    {
      "participant": "assistant",
      "content": "To build a React component...",
      "timestamp": "2024-01-15T10:01:00Z"
    }
  ],
  "source": "chatgpt",
  "tags": ["react", "programming"],
  "metadata": {
    "model": "gpt-4"
  }
}
```

**Response:**
```json
{
  "message": "Successfully imported 2 messages",
  "conversationId": "chat_123",
  "memoryIds": ["mem_001", "mem_002"],
  "memories": [...]
}
```

#### POST /chat/import-format

Import chat from various formats.

**Request Body:**
```json
{
  "content": "User: Hello\nAssistant: Hi there!",
  "format": "text",
  "source": "chatgpt",
  "conversationId": "chat_456"
}
```

**Response:**
```json
{
  "message": "Successfully imported 2 memories from text format",
  "memoryIds": ["mem_003", "mem_004"],
  "memories": [...]
}
```

#### GET /chat/context/:conversationId

Get all memories for a conversation.

**Response:**
```json
{
  "conversationId": "chat_123",
  "messageCount": 2,
  "memories": [
    {
      "id": "mem_001",
      "content": "How do I build a React component?",
      "participant": "user",
      "timestamp": "2024-01-15T10:00:00.000Z"
    },
    {
      "id": "mem_002",
      "content": "To build a React component...",
      "participant": "assistant",
      "timestamp": "2024-01-15T10:01:00.000Z"
    }
  ]
}
```

### Export

#### POST /export/bundle

Export memories in various formats.

**Request Body:**
```json
{
  "memoryIds": ["mem_001", "mem_002"],
  "format": "conversation"
}
```

**Response:**
```
Conversation: chat_123
==================================================

User:
How do I build a React component?

Assistant:
To build a React component, you can use either functional or class components...
```

## Data Types

### Memory

```typescript
interface Memory {
  id: string;
  content: string;
  timestamp: Date;
  version: number;
  tags: string[];
  inferredTags?: string[];
  metadata: Record<string, any>;
  source: string;
  contentType?: 'chat' | 'code' | 'documentation' | 'note';
  conversationId?: string;
  participant?: string;
  context?: string;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  participant: string;
  content: string;
  timestamp?: Date;
}
```

### ChatImportRequest

```typescript
interface ChatImportRequest {
  conversationId: string;
  messages: ChatMessage[];
  source: string;
  tags?: string[];
  metadata?: Record<string, any>;
  context?: string;
}
```

## Error Responses

### Validation Error

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["content"],
      "message": "Expected string, received number"
    }
  ]
}
```

### Authentication Error

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

### Not Found Error

```json
{
  "error": "Memory not found",
  "details": "The requested memory was not found"
}
```

### Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Search endpoints**: 50 requests per 15 minutes per IP

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## Security Headers

All responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## CORS

CORS is enabled for the following origins:

- `http://localhost:3000` (default)
- Custom origins via `ALLOWED_ORIGINS` environment variable

## Examples

### Complete Workflow

```bash
# 1. Create a memory
curl -X POST http://localhost:3000/memory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "content": "React components are reusable UI elements",
    "source": "manual",
    "tags": ["react", "frontend"]
  }'

# 2. Search for memories
curl -X POST http://localhost:3000/memory/semantic-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "query": "React components"
  }'

# 3. Export memories
curl -X POST http://localhost:3000/export/bundle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "memoryIds": ["uuid-from-step-1"],
    "format": "markdown"
  }'
```

## 5. Chat & Conversation Management

### POST /chat/import
Import structured chat data with conversation context.

**Headers:**
```
Authorization: Bearer your-jwt-token
Content-Type: application/json
```

**Request Body:**
```json
{
  "conversationId": "chat_123",
  "messages": [
    {
      "participant": "user",
      "content": "How do I build a React component?",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    {
      "participant": "assistant",
      "content": "To build a React component, you can use either functional or class components...",
      "timestamp": "2024-01-15T10:01:00Z"
    }
  ],
  "source": "chatgpt",
  "tags": ["react", "programming"],
  "metadata": {
    "model": "gpt-4",
    "temperature": 0.7
  }
}
```

**Response:**
```json
{
  "message": "Successfully imported 2 messages",
  "conversationId": "chat_123",
  "memoryIds": ["mem_001", "mem_002"],
  "memoriesCreated": 2
}
```

### GET /chat/conversations
List all conversations for the user.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Query Parameters:**
- `limit` (optional): Number of conversations (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `tags` (optional): Filter by tags

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-uuid",
      "title": "React Component Discussion",
      "messageCount": 12,
      "participantCount": 2,
      "tags": ["react", "frontend"],
      "lastActivity": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

### GET /chat/conversations/:id
Get detailed conversation with all messages.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "conversation": {
    "id": "conv-uuid",
    "title": "React Component Discussion",
    "messages": [
      {
        "id": "mem-uuid",
        "participant": "user",
        "content": "How do I build a React component?",
        "timestamp": "2024-01-15T10:00:00.000Z"
      },
      {
        "id": "mem-uuid",
        "participant": "assistant",
        "content": "To build a React component...",
        "timestamp": "2024-01-15T10:01:00.000Z"
      }
    ],
    "tags": ["react", "frontend"],
    "metadata": { "model": "gpt-4" }
  }
}
```

## 6. Export & Integration

### POST /export/bundle
Export memories in various formats for external use.

**Headers:**
```
Authorization: Bearer your-jwt-token
Content-Type: application/json
```

**Request Body:**
```json
{
  "memoryIds": ["mem_001", "mem_002"],
  "format": "conversation",
  "includeMetadata": true,
  "includeTimestamps": true
}
```

**Response:**
```json
{
  "format": "conversation",
  "content": "Conversation: React Discussion\n=====================================\n\nUser:\nHow do I build a React component?\n\nAssistant:\nTo build a React component...\n",
  "memoryCount": 2,
  "exportedAt": "2024-01-15T10:30:00.000Z"
}
```

### GET /export/memories
Export memories with filtering options.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Query Parameters:**
- `format`: Export format (json, csv, markdown)
- `contentType`: Filter by content type
- `dateFrom`: Filter from date
- `dateTo`: Filter to date
- `tags`: Filter by tags

**Response:**
```json
{
  "format": "json",
  "memories": [
    {
      "id": "mem-uuid",
      "content": "Memory content",
      "tags": ["tag1"],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 1,
  "exportedAt": "2024-01-15T10:30:00.000Z"
}
```

## 7. Webhooks & Integrations

### POST /integrations/webhooks
Create a webhook for real-time notifications.

**Headers:**
```
Authorization: Bearer your-jwt-token
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "My App Webhook",
  "url": "https://myapp.com/webhook/valora",
  "secret": "webhook-secret-key",
  "events": ["memory.created", "memory.updated"],
  "headers": {
    "X-API-Key": "custom-header-value"
  }
}
```

**Response:**
```json
{
  "message": "Webhook registered successfully",
  "webhook": {
    "id": "webhook-uuid",
    "name": "My App Webhook",
    "url": "https://myapp.com/webhook/valora",
    "events": ["memory.created", "memory.updated"],
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### GET /integrations/webhooks
List all webhooks for the user.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "webhooks": [
    {
      "id": "webhook-uuid",
      "name": "My App Webhook",
      "url": "https://myapp.com/webhook/valora",
      "events": ["memory.created"],
      "isActive": true,
      "lastTriggered": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

### DELETE /integrations/webhooks/:id
Delete a webhook.

**Headers:**
```
Authorization: Bearer your-jwt-token
```

**Response:**
```json
{
  "message": "Webhook deleted successfully"
}
```

## Data Types

### Memory Object
```typescript
interface Memory {
  id: string;
  tenantId: string;
  userId: string;
  content: string;
  contentType: 'chat' | 'code' | 'documentation' | 'note';
  source: string;
  tags: string[];
  inferredTags: string[];
  metadata: Record<string, any>;
  embedding?: number[]; // Vector embedding for semantic search
  conversationId?: string;
  participant?: string;
  context?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

### User Object
```typescript
interface User {
  id: string;
  tenantId: string;
  email: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  settings: Record<string, any>;
  role: 'admin' | 'user' | 'viewer';
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
```

### API Key Object
```typescript
interface ApiKey {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  keyHash: string;
  permissions: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  isActive: boolean;
}
```

## Error Responses

### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "code": "AUTH_TOKEN_INVALID"
}
```

```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions",
  "code": "AUTH_INSUFFICIENT_PERMISSIONS"
}
```

### Validation Errors
```json
{
  "error": "Validation failed",
  "message": "Request validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "VALIDATION_INVALID_EMAIL"
    }
  ]
}
```

### Resource Errors
```json
{
  "error": "Not Found",
  "message": "Memory not found",
  "code": "RESOURCE_NOT_FOUND",
  "resourceId": "mem-uuid"
}
```

```json
{
  "error": "Conflict",
  "message": "Memory already exists",
  "code": "RESOURCE_CONFLICT"
}
```

## Rate Limiting

Rate limits are applied per user per tenant:

- **General API calls**: 1000 requests per hour
- **Search operations**: 500 requests per hour
- **Authentication endpoints**: 20 requests per hour
- **Export operations**: 100 requests per hour

Rate limit headers in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1642234567
X-RateLimit-Retry-After: 3600
```

## Webhook Events

Supported webhook events:
- `memory.created` - New memory created
- `memory.updated` - Memory updated
- `memory.deleted` - Memory deleted
- `user.created` - New user registered
- `conversation.created` - New conversation started
- `webhook.failed` - Webhook delivery failed

### Webhook Payload Format
```json
{
  "event": "memory.created",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "tenantId": "tenant-uuid",
  "userId": "user-uuid",
  "data": {
    "memory": { /* full memory object */ }
  },
  "webhookId": "webhook-uuid"
}
```

## Examples

### Complete User Workflow
```bash
# 1. Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "username": "johndoe"
  }'

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'

# 3. Create API key
curl -X POST http://localhost:3000/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App Key",
    "permissions": ["read", "write"]
  }'

# 4. Create memory
curl -X POST http://localhost:3000/memory \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "React components are reusable UI elements",
    "source": "manual",
    "tags": ["react", "frontend"],
    "contentType": "note"
  }'

# 5. Semantic search
curl -X POST http://localhost:3000/memory/semantic-search \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "React component lifecycle",
    "limit": 5
  }'

# 6. Export memories
curl -X POST http://localhost:3000/export/bundle \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memoryIds": ["memory-uuid"],
    "format": "markdown"
  }'
```

---

**Valora MCP Server API Reference**  
*Version 2.0 - Updated: December 2024*  
*Supports PostgreSQL backend with vector search and multi-tenancy*
