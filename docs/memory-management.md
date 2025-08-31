# Memory Management

Complete guide to creating, searching, updating, and managing memories in Valora.

## Overview

Memories are the core data structure in Valora. Each memory contains:
- **Content**: The actual information (text, code, etc.)
- **Metadata**: Additional information about the memory
- **Tags**: User-defined and automatically inferred tags
- **Source**: Where the memory came from
- **Timestamps**: Creation and modification times

## Creating Memories

### Basic Memory Creation

```bash
curl -X POST http://localhost:3000/memory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "content": "React components are reusable UI elements that can be composed together to build complex interfaces.",
    "source": "manual",
    "tags": ["react", "frontend", "components"]
  }'
```

### Memory with Metadata

```bash
curl -X POST http://localhost:3000/memory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "content": "function useState(initialValue) { return [initialValue, setValue]; }",
    "source": "code-snippet",
    "tags": ["react", "hooks", "state"],
    "metadata": {
      "language": "javascript",
      "framework": "react",
      "complexity": "beginner",
      "file": "hooks.js"
    }
  }'
```

### Memory Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "React components are reusable UI elements...",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": 1,
  "tags": ["react", "frontend", "components"],
  "inferredTags": ["ui", "web-development"],
  "metadata": {
    "language": "javascript",
    "framework": "react"
  },
  "source": "manual"
}
```

## Retrieving Memories

### Get Memory by ID

```bash
curl -X GET http://localhost:3000/memory/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer your-api-key"
```

### Search Memories

#### Keyword Search

```bash
curl -X GET "http://localhost:3000/memory/search?q=react%20components" \
  -H "Authorization: Bearer your-api-key"
```

#### Semantic Search

```bash
curl -X POST http://localhost:3000/memory/semantic-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "query": "How do I create reusable UI elements?",
    "limit": 10
  }'
```

### Search Response

```json
{
  "query": "react components",
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "React components are reusable UI elements...",
      "timestamp": "2024-01-15T10:00:00.000Z",
      "version": 1,
      "tags": ["react", "frontend", "components"],
      "inferredTags": ["ui", "web-development"],
      "metadata": {},
      "source": "manual",
      "score": 0.95
    }
  ],
  "total": 1
}
```

## Updating Memories

### Update Memory Content

```bash
curl -X PUT http://localhost:3000/memory/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "content": "Updated React components content with more details...",
    "tags": ["react", "frontend", "components", "updated"],
    "metadata": {
      "lastUpdated": "2024-01-15T11:00:00.000Z",
      "version": "2.0"
    }
  }'
```

### Partial Updates

```bash
# Update only tags
curl -X PUT http://localhost:3000/memory/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "tags": ["react", "frontend", "components", "advanced"]
  }'

# Update only metadata
curl -X PUT http://localhost:3000/memory/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "metadata": {
      "priority": "high",
      "reviewed": true
    }
  }'
```

## Deleting Memories

### Delete Memory

```bash
curl -X DELETE http://localhost:3000/memory/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer your-api-key"
```

### Delete Response

```json
{
  "success": true,
  "message": "Memory deleted successfully"
}
```

## Memory Types

### Chat Memories

Memories from chat conversations include additional fields:

```json
{
  "id": "chat-memory-id",
  "content": "How do I implement authentication?",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": 1,
  "tags": ["authentication", "security"],
  "metadata": {
    "conversationId": "auth-discussion-001",
    "participant": "user",
    "messageIndex": 1
  },
  "source": "chatgpt",
  "contentType": "chat",
  "conversationId": "auth-discussion-001",
  "participant": "user"
}
```

### Code Memories

Memories containing code snippets:

```json
{
  "id": "code-memory-id",
  "content": "const useAuth = () => { /* implementation */ };",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": 1,
  "tags": ["react", "hooks", "authentication"],
  "metadata": {
    "language": "javascript",
    "framework": "react",
    "file": "auth-hook.js"
  },
  "source": "code-crawler",
  "contentType": "code"
}
```

### Documentation Memories

Memories from documentation files:

```json
{
  "id": "doc-memory-id",
  "content": "Authentication is the process of verifying user identity...",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": 1,
  "tags": ["authentication", "documentation", "security"],
  "metadata": {
    "file": "docs/authentication.md",
    "section": "overview"
  },
  "source": "file-crawler",
  "contentType": "documentation"
}
```

## Tagging System

### Automatic Tagging

Valora automatically generates tags based on content analysis:

```json
{
  "tags": ["react", "frontend", "components"],  // User-defined
  "inferredTags": ["ui", "web-development", "javascript"]  // Auto-generated
}
```

### Tag Management

#### Add Tags to Memory

```bash
curl -X PUT http://localhost:3000/memory/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "tags": ["react", "frontend", "components", "new-tag"]
  }'
```

#### Search by Tags

```bash
curl -X GET "http://localhost:3000/memory/search?q=tag:react%20tag:components" \
  -H "Authorization: Bearer your-api-key"
```

## Metadata Management

### Custom Metadata

Add any custom fields to memories:

```json
{
  "metadata": {
    "priority": "high",
    "project": "frontend-app",
    "author": "john-doe",
    "reviewed": true,
    "complexity": "intermediate",
    "estimatedTime": "2 hours",
    "dependencies": ["react", "typescript"],
    "relatedFiles": ["components/Button.tsx", "hooks/useAuth.ts"]
  }
}
```

### Metadata Search

Search memories by metadata:

```bash
curl -X POST http://localhost:3000/memory/semantic-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "query": "high priority react components",
    "metadata": {
      "priority": "high",
      "framework": "react"
    }
  }'
```

## Bulk Operations

### Bulk Memory Creation

```bash
curl -X POST http://localhost:3000/memory/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "memories": [
      {
        "content": "First memory content",
        "source": "bulk-import",
        "tags": ["tag1", "tag2"]
      },
      {
        "content": "Second memory content",
        "source": "bulk-import",
        "tags": ["tag3", "tag4"]
      }
    ]
  }'
```

### Bulk Memory Update

```bash
curl -X PUT http://localhost:3000/memory/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "updates": [
      {
        "id": "memory-id-1",
        "tags": ["updated-tag"],
        "metadata": {"updated": true}
      },
      {
        "id": "memory-id-2",
        "content": "Updated content"
      }
    ]
  }'
```

## Memory Versioning

### Version History

Each memory maintains version history:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Current content",
  "timestamp": "2024-01-15T11:00:00.000Z",
  "version": 3,
  "tags": ["react", "frontend", "components"],
  "metadata": {
    "previousVersions": [
      {
        "version": 1,
        "timestamp": "2024-01-15T10:00:00.000Z",
        "content": "Original content"
      },
      {
        "version": 2,
        "timestamp": "2024-01-15T10:30:00.000Z",
        "content": "Updated content"
      }
    ]
  }
}
```

### Get Memory Version

```bash
curl -X GET "http://localhost:3000/memory/550e8400-e29b-41d4-a716-446655440000?version=2" \
  -H "Authorization: Bearer your-api-key"
```

## Best Practices

### Memory Organization

1. **Use descriptive tags** for easy retrieval
2. **Include relevant metadata** for context
3. **Group related memories** with similar tags
4. **Update memories** when information changes

### Content Guidelines

1. **Keep content focused** on a single topic
2. **Include context** in the content itself
3. **Use clear, descriptive language**
4. **Add code examples** when relevant

### Search Optimization

1. **Use semantic search** for complex queries
2. **Combine tags and keywords** for precise results
3. **Leverage metadata** for filtering
4. **Export search results** for external use

## Error Handling

### Common Memory Errors

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

```json
{
  "error": "Memory not found",
  "details": "The requested memory was not found"
}
```

```json
{
  "error": "Invalid memory ID",
  "details": "The provided memory ID is not a valid UUID"
}
```

## Performance Tips

### Large Memory Sets

1. **Use pagination** for large result sets
2. **Limit search results** with the `limit` parameter
3. **Use specific queries** rather than broad searches
4. **Cache frequently accessed memories**

### Search Optimization

1. **Use semantic search** for complex queries
2. **Combine multiple search strategies**
3. **Leverage tags and metadata** for filtering
4. **Export results** for external processing

---

*Last updated: January 2024*



