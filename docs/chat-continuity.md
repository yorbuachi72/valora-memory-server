# Chat Continuity

Valora provides a complete workflow for importing chat conversations, storing them securely, and exporting them in formats that can be used to continue conversations in other AI agents.

## Overview

```
User Chat → Import to Valora → Store & Process → Export → Continue in Another Agent
```

### Step-by-Step Process

1. **User completes a chat** in any AI agent (ChatGPT, Claude, Bard, etc.)
2. **Copy the complete conversation** in any supported format
3. **Import into Valora** using the chat import API
4. **Valora processes and stores** the conversation as individual memories
5. **Export the conversation** in a format suitable for continuation
6. **Use in another AI agent** to continue the conversation seamlessly

## Import Process

### API Endpoint

```
POST /chat/import
```

### Request Format

```typescript
interface ChatImportRequest {
  conversationId: string;
  messages: ChatMessage[];
  source: string;
  tags?: string[];
  metadata?: Record<string, any>;
  context?: string;
}

interface ChatMessage {
  participant: string;
  content: string;
  timestamp?: Date;
}
```

### Example Request

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
  "tags": ["react", "programming", "tutorial"],
  "metadata": {
    "model": "gpt-4",
    "sessionId": "sess_456"
  }
}
```

### Response

```json
{
  "message": "Successfully imported 2 messages",
  "conversationId": "chat_123",
  "memoryIds": ["mem_001", "mem_002"],
  "memories": [...]
}
```

## Export Process

### API Endpoint

```
POST /export/bundle
```

### Request Format

```typescript
interface ExportRequest {
  memoryIds: string[];
  format?: 'markdown' | 'text' | 'json' | 'conversation';
}
```

### Example Request

```json
{
  "memoryIds": ["mem_001", "mem_002", "mem_003"],
  "format": "conversation"
}
```

### Response

Returns the formatted conversation as plain text in the requested format.

## API Reference

### Chat Import Endpoints

#### Import Structured Chat Data
```
POST /chat/import
Authorization: Bearer <api-key>
Content-Type: application/json
```

#### Import from Various Formats
```
POST /chat/import-format
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "string content in specified format",
  "format": "json|text|markdown",
  "source": "string",
  "conversationId": "string (optional)"
}
```

#### Get Conversation Context
```
GET /chat/context/:conversationId
Authorization: Bearer <api-key>
```

### Export Endpoints

#### Export Memory Bundle
```
POST /export/bundle
Authorization: Bearer <api-key>
Content-Type: application/json
```

## Supported Formats

### Import Formats

#### 1. Structured JSON
```json
{
  "conversationId": "chat_123",
  "messages": [
    {"participant": "user", "content": "Hello"},
    {"participant": "assistant", "content": "Hi there!"}
  ],
  "source": "chatgpt"
}
```

#### 2. Plain Text
```
User: How do I build a React component?
Assistant: To build a React component, you can use either functional or class components...
User: Can you show me an example?
Assistant: Here's a simple functional component example...
```

#### 3. Markdown
```markdown
### User
How do I build a React component?

### Assistant
To build a React component, you can use either functional or class components...

### User
Can you show me an example?

### Assistant
Here's a simple functional component example...
```

### Export Formats

#### 1. Conversation Format (Recommended for Continuation)
```
Conversation: chat_123
==================================================

User:
How do I build a React component?

Assistant:
To build a React component, you can use either functional or class components...

User:
Can you show me an example?

Assistant:
Here's a simple functional component example...
```

#### 2. JSON Format (Structured Data)
```json
[
  {
    "participant": "user",
    "content": "How do I build a React component?",
    "timestamp": "2024-01-15T10:00:00.000Z"
  },
  {
    "participant": "assistant",
    "content": "To build a React component...",
    "timestamp": "2024-01-15T10:01:00.000Z"
  }
]
```

#### 3. Markdown Format (Documentation Style)
```markdown
---
**Source:** chatgpt
**Timestamp:** 2024-01-15T10:00:00.000Z
**Participant:** user
**Conversation:** chat_123

How do I build a React component?
---

---
**Source:** chatgpt
**Timestamp:** 2024-01-15T10:01:00.000Z
**Participant:** assistant
**Conversation:** chat_123

To build a React component, you can use either functional or class components...
---
```

#### 4. Text Format (Simple)
```
Source: chatgpt
Timestamp: 2024-01-15T10:00:00.000Z
Participant: user
Conversation: chat_123

How do I build a React component?

----------------------------------------

Source: chatgpt
Timestamp: 2024-01-15T10:01:00.000Z
Participant: assistant
Conversation: chat_123

To build a React component, you can use either functional or class components...
```

## Use Cases

### 1. Cross-Platform Continuation
- Start conversation in ChatGPT
- Import to Valora
- Export and continue in Claude
- Maintain full context across platforms

### 2. Conversation Backup
- Store important conversations securely
- Encrypted storage with your secret key
- Retrieve and continue anytime

### 3. Context Preservation
- Keep conversation history for long-term projects
- Build on previous discussions
- Maintain context across sessions

### 4. Multi-Agent Workflows
- Use different AI agents for different aspects
- Maintain conversation continuity
- Leverage strengths of each platform

## Examples

### Example 1: ChatGPT to Claude Continuation

**Step 1: Import ChatGPT Conversation**
```bash
curl -X POST http://localhost:3000/chat/import \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "react_tutorial_001",
    "messages": [
      {"participant": "user", "content": "How do I build a React component?"},
      {"participant": "assistant", "content": "To build a React component..."}
    ],
    "source": "chatgpt"
  }'
```

**Step 2: Export for Claude**
```bash
curl -X POST http://localhost:3000/export/bundle \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "memoryIds": ["mem_001", "mem_002"],
    "format": "conversation"
  }'
```

**Step 3: Use in Claude**
```typescript
const claudePrompt = `
Previous conversation:
${exportedConversation}

Please continue this conversation about React components.
`;

// Use with Claude API
```

### Example 2: Plain Text Import

```bash
curl -X POST http://localhost:3000/chat/import-format \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "User: How do I build a React component?\nAssistant: To build a React component...",
    "format": "text",
    "source": "chatgpt",
    "conversationId": "react_tutorial_002"
  }'
```

### Example 3: Markdown Import

```bash
curl -X POST http://localhost:3000/chat/import-format \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "### User\nHow do I build a React component?\n\n### Assistant\nTo build a React component...",
    "format": "markdown",
    "source": "chatgpt",
    "conversationId": "react_tutorial_003"
  }'
```

## Best Practices

### 1. Conversation Organization
- Use descriptive `conversationId` values
- Add relevant tags for easy retrieval
- Include source information for context

### 2. Export Format Selection
- Use `conversation` format for AI agent continuation
- Use `json` format for programmatic processing
- Use `markdown` format for documentation

### 3. Security Considerations
- Keep your API key secure
- Use HTTPS for all API calls
- Regularly rotate API keys

### 4. Performance Optimization
- Import conversations in batches for large chats
- Use specific memory IDs for targeted exports
- Cache frequently accessed conversations

## Error Handling

### Common Error Responses

```json
{
  "error": "Validation failed",
  "details": ["Invalid conversation ID format"]
}
```

```json
{
  "error": "Memory not found",
  "details": "One or more requested memories were not found"
}
```

```json
{
  "error": "Internal Server Error",
  "details": "Failed to process request"
}
```

## Configuration

### Environment Variables

```bash
# Required for encryption
VALORA_SECRET_KEY="your-super-secret-encryption-key"

# Optional configuration
PORT=3000
NODE_ENV=production
```

### API Authentication

All endpoints require API key authentication:

```bash
Authorization: Bearer your-api-key
```

## Troubleshooting

### Common Issues

1. **Import Fails**: Check message format and required fields
2. **Export Returns Empty**: Verify memory IDs exist
3. **Authentication Errors**: Ensure valid API key is provided
4. **Format Errors**: Check supported format types

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=valora:*
```

## Support

For additional support or questions about Valora's chat continuity features, refer to the main documentation or create an issue in the repository.

---

*Last updated: January 2024*
