# MCP Server Integration Guide

## Overview

Valora provides a powerful MCP (Model Context Protocol) server that enables seamless integration with AI development environments and IDEs. The MCP server allows you to access your personal memory store directly from within your AI conversations and development workflows.

## Key Features

- **🔍 Contextual Memory Retrieval**: Access relevant memories based on conversation context
- **💾 Memory Import**: Import conversations directly from MCP-connected applications
- **🔄 Cross-Platform Continuity**: Maintain conversation continuity across different AI platforms
- **🏷️ Intelligent Tagging**: Automatic categorization and tagging of imported content
- **🔐 Secure Storage**: Encrypted storage with user-controlled access
- **⚡ Real-time Sync**: Instant synchronization across all connected environments

## Installation & Setup

### 1. Environment Setup

Ensure you have Node.js 18+ installed and the VALORA_SECRET_KEY environment variable set:

```bash
# Set your encryption key (generate a strong random key)
export VALORA_SECRET_KEY="your-secure-random-key-here-minimum-32-chars"

# Verify Node.js version
node --version  # Should be 18+
```

### 2. MCP Server Configuration

The Valora MCP server exposes the following tools:

#### Available MCP Tools

##### `valora_search_memories`
Search through your memory store for relevant information.

**Parameters:**
- `query` (string): Search term or phrase
- `limit` (optional, number): Maximum number of results (default: 10)
- `source` (optional, string): Filter by source (e.g., "chatgpt", "claude")
- `tags` (optional, array): Filter by tags

**Example Usage:**
```json
{
  "tool": "valora_search_memories",
  "parameters": {
    "query": "machine learning basics",
    "limit": 5,
    "tags": ["tutorial", "ml"]
  }
}
```

##### `valora_import_conversation`
Import a conversation from external sources.

**Parameters:**
- `content` (string): Full conversation content
- `source` (string): Source platform ("chatgpt", "claude", "custom")
- `title` (optional, string): Conversation title
- `tags` (optional, array): Additional tags

**Example Usage:**
```json
{
  "tool": "valora_import_conversation",
  "parameters": {
    "content": "# ChatGPT Conversation\n\nAssistant: Hello! How can I help?\nHuman: Explain APIs...",
    "source": "chatgpt",
    "title": "API Explanation Discussion",
    "tags": ["api", "tutorial"]
  }
}
```

##### `valora_get_conversation_context`
Retrieve full conversation context for continuity.

**Parameters:**
- `conversation_id` (string): Unique conversation identifier
- `max_messages` (optional, number): Maximum messages to retrieve

##### `valora_list_memories`
List memories with pagination support.

**Parameters:**
- `offset` (optional, number): Starting position (default: 0)
- `limit` (optional, number): Number of memories to return (default: 20)
- `source` (optional, string): Filter by source
- `tags` (optional, array): Filter by tags

##### `valora_export_memories`
Export memories in various formats.

**Parameters:**
- `query` (optional, string): Filter memories by search term
- `format` (string): Export format ("json", "markdown", "conversation")
- `source` (optional, string): Filter by source
- `date_from` (optional, string): Start date filter (ISO format)
- `date_to` (optional, string): End date filter (ISO format)

### 3. IDE Integration Examples

#### Cursor Integration

1. **Install Valora MCP Server:**
```bash
npm install -g valora-memory-server
```

2. **Configure Cursor MCP Settings:**
```json
// .cursorrules or MCP configuration
{
  "mcpServers": {
    "valora": {
      "command": "valora-mcp-server",
      "args": [],
      "env": {
        "VALORA_SECRET_KEY": "your-secure-key-here"
      }
    }
  }
}
```

3. **Usage in Cursor:**
```javascript
// The MCP server will be automatically available in your AI conversations
// Use @valora to access memory tools
```

#### VS Code Integration

1. **Install Extension:**
```bash
code --install-extension valora.memory-server
```

2. **Configure Settings:**
```json
{
  "valora.mcp.enabled": true,
  "valora.mcp.serverPath": "/usr/local/bin/valora-mcp-server",
  "valora.encryption.key": "your-secure-key-here"
}
```

#### Windsurf Integration

1. **Add to Windsurf Configuration:**
```json
{
  "integrations": {
    "valora": {
      "enabled": true,
      "server": "valora-mcp-server",
      "config": {
        "encryption_key": "your-secure-key-here",
        "auto_sync": true
      }
    }
  }
}
```

## Use Cases & Workflows

### 1. Conversation Continuity

**Scenario:** You have an ongoing discussion with ChatGPT about React development and want to continue it in Claude.

```javascript
// In Claude, use MCP to retrieve previous context
const previousContext = await valora_get_conversation_context({
  conversation_id: "react-tutorial-chatgpt-2024-01-15",
  max_messages: 20
});

// Continue the conversation with full context
```

### 2. Knowledge Preservation

**Scenario:** Save important learning moments from AI conversations.

```javascript
// Automatically import valuable conversations
await valora_import_conversation({
  content: conversationContent,
  source: "chatgpt",
  title: "Advanced TypeScript Patterns",
  tags: ["typescript", "patterns", "advanced"]
});
```

### 3. Research Assistance

**Scenario:** Gather information from multiple AI conversations for a research project.

```javascript
// Search across all memories
const researchMemories = await valora_search_memories({
  query: "machine learning algorithms",
  source: ["chatgpt", "claude"],
  limit: 50
});

// Export for documentation
const exportData = await valora_export_memories({
  query: "machine learning algorithms",
  format: "markdown",
  date_from: "2024-01-01"
});
```

### 4. Code Review Memory

**Scenario:** Remember previous code reviews and feedback.

```javascript
// Store code review feedback
await valora_import_conversation({
  content: codeReviewDiscussion,
  source: "github-copilot",
  tags: ["code-review", "react", "performance"]
});

// Later, retrieve similar feedback
const similarReviews = await valora_search_memories({
  query: "React performance optimization",
  tags: ["code-review"]
});
```

## Advanced Configuration

### Custom Memory Storage

Configure alternative storage backends:

```javascript
// PostgreSQL configuration
{
  "storage": {
    "type": "postgresql",
    "connection": {
      "host": "localhost",
      "port": 5432,
      "database": "valora_memories",
      "user": "valora_user",
      "password": "secure_password"
    }
  }
}
```

### Tagging Strategies

Customize automatic tagging:

```javascript
// Custom tagging rules
{
  "tagging": {
    "rules": [
      {
        "pattern": "error|exception|fail",
        "tags": ["error-handling", "debug"]
      },
      {
        "pattern": "performance|speed|optimize",
        "tags": ["performance", "optimization"]
      }
    ]
  }
}
```

### Sync Configuration

Configure cross-device synchronization:

```javascript
{
  "sync": {
    "enabled": true,
    "provider": "dropbox", // or "google-drive", "onedrive"
    "interval": "5m",
    "conflict_resolution": "newer_wins"
  }
}
```

## Security Considerations

### Encryption
- All memories are encrypted using AES-256-GCM
- Encryption keys are never stored or transmitted
- User-controlled key management

### Access Control
- MCP server runs locally on user machine
- No external network access required
- User authentication handled by MCP client

### Data Privacy
- Memories stored locally by default
- Optional cloud sync with user consent
- No data collection or telemetry

## Troubleshooting

### Common Issues

#### 1. MCP Server Not Connecting
```bash
# Check if server is running
ps aux | grep valora-mcp-server

# Restart MCP server
valora-mcp-server restart

# Check logs
tail -f ~/.valora/mcp-server.log
```

#### 2. Memory Search Returning Empty Results
```javascript
// Try broader search terms
await valora_search_memories({
  query: "keyword", // Use single keywords
  limit: 100 // Increase limit
});

// Check available sources
await valora_list_memories({
  limit: 1 // Get sample to see available data
});
```

#### 3. Import Failures
```javascript
// Validate conversation format
const isValid = await valora_validate_conversation({
  content: conversationContent,
  source: "chatgpt"
});

// Check error logs
tail -f ~/.valora/import-errors.log
```

### Performance Optimization

#### Database Indexing
Ensure proper database indexes for large memory stores:

```sql
CREATE INDEX idx_memories_content ON memories USING gin(to_tsvector('english', content));
CREATE INDEX idx_memories_tags ON memories USING gin(tags);
CREATE INDEX idx_memories_timestamp ON memories (timestamp DESC);
```

#### Memory Limits
Configure memory limits for large datasets:

```javascript
{
  "performance": {
    "max_memory_mb": 512,
    "search_timeout_ms": 5000,
    "batch_size": 100
  }
}
```

## API Reference

### MCP Protocol Compliance

Valora MCP server implements the full MCP protocol specification:

- **Protocol Version:** 1.0
- **Transport:** Stdio (local process communication)
- **Authentication:** Environment variable based
- **Error Handling:** Structured error responses

### Response Formats

All MCP responses follow standardized formats:

```json
{
  "success": true,
  "data": {
    // Tool-specific response data
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req-12345"
  }
}
```

### Error Responses

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid conversation format",
    "details": {
      "field": "content",
      "expected": "markdown"
    }
  }
}
```

## Contributing

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/valora.git
cd valora

# Install dependencies
npm install

# Set up development environment
npm run dev

# Run MCP server in development mode
npm run mcp:dev
```

### Adding New MCP Tools

1. **Define Tool Interface:**
```typescript
interface NewTool extends MCPTool {
  name: 'valora_new_tool';
  parameters: {
    param1: string;
    param2?: number;
  };
}
```

2. **Implement Tool Logic:**
```typescript
export class NewToolHandler implements ToolHandler {
  async execute(params: NewTool['parameters']): Promise<ToolResponse> {
    // Implementation logic
    return {
      success: true,
      data: result
    };
  }
}
```

3. **Register Tool:**
```typescript
// In MCP server setup
server.registerTool('valora_new_tool', new NewToolHandler());
```

## Support & Resources

- **Documentation:** https://docs.valora.dev/mcp
- **GitHub Issues:** https://github.com/your-org/valora/issues
- **Community Forum:** https://community.valora.dev
- **API Reference:** https://api.valora.dev/mcp

---

**🎯 Ready for MVP Launch!** The MCP integration provides seamless memory management across AI development environments.
