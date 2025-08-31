# Valora: Your Sovereign Memory Container

Valora is a Memory Container Protocol (MCP) Server designed to empower you to preserve your intellectual output, AI interactions, and knowledge artifacts in a secure, vendor-agnostic, and sovereign container. It acts as a foundational layer for human-centered AI interaction memory, prioritizing privacy, continuity, and extensibility.

## Core Features

### 🔐 **Enterprise-Grade Security**
-   **AES-256-GCM Encryption**: All memories encrypted at rest with your secret key
-   **JWT Authentication**: Secure user authentication with refresh tokens
-   **API Key Management**: Granular permission-based access control
-   **Multi-tenancy**: Complete data isolation between tenants
-   **Brute Force Protection**: Advanced authentication security
-   **Rate Limiting**: Configurable request throttling per endpoint

### 🧠 **Advanced AI-Powered Memory Management**
-   **Vector Search**: Semantic similarity search using pgvector and embeddings
-   **Hybrid Search**: Combined keyword and semantic search capabilities
-   **Automatic Tagging**: ML-powered content classification and tagging
-   **Content Types**: Support for chat, code, documentation, and notes
-   **Conversation Context**: Maintain chat history and participant tracking
-   **Chat Parsing**: Automatic parsing of ChatGPT/Claude conversations from copy/paste
-   **Interactive Chat Interface**: Conversational CLI for memory management

### 🏗️ **Production-Ready Infrastructure**
-   **PostgreSQL Backend**: Scalable relational database with pgvector extension
-   **Docker Compose**: Complete stack with PostgreSQL, Redis, Nginx, pgAdmin
-   **Monitoring & Metrics**: Comprehensive health checks and performance tracking
-   **Load Balancing**: Nginx reverse proxy with SSL termination
-   **Database Management**: pgAdmin web interface for database administration

### 🔄 **Developer Experience**
-   **RESTful API**: Complete API with OpenAPI/Swagger documentation
-   **Multi-format Export**: JSON, Markdown, conversation, and custom formats
-   **Webhook Integration**: Real-time notifications for external systems
-   **CLI Tools**: Command-line interface for developer workflows
-   **Interactive Chat**: Conversational interface for memory management
-   **Chat Parsing**: Copy/paste support for ChatGPT and Claude conversations
-   **MCP Integration**: Seamless Cursor.ai integration
-   **TypeScript Support**: Full type safety and development experience

### 📊 **Observability & Monitoring**
-   **Health Checks**: System and database health monitoring
-   **Metrics Collection**: Request tracking, performance metrics, error rates
-   **Security Logging**: Comprehensive audit logging
-   **Prometheus Compatible**: Metrics export for monitoring systems
-   **Centralized Logging**: JSON-formatted logs for log aggregation

## Getting Started

### Prerequisites

-   Node.js (v20 or later recommended)
-   Docker (optional, for containerized deployment)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/valora.git
cd valora

# Install dependencies
npm install
```

### 2. Configuration

Valora requires two environment variables to run. You can set them in your shell or create a `.env` file in the root of the project.

```env
# A long, random, and secret string used to encrypt your database.
VALORA_SECRET_KEY="your-super-secret-encryption-key"

# The API key required to access all API endpoints.
VALORA_API_KEY="your-secure-api-key"

# The port for the server to run on (optional, defaults to 3000)
PORT=3000
```

### 3. Database Setup

Valora supports two storage backends:

#### Option A: PostgreSQL (Recommended for Production)

1. **Install PostgreSQL** with pgvector extension:
   ```bash
   # Using Docker
   docker run --name valora-postgres -e POSTGRES_PASSWORD=valora_password -e POSTGRES_DB=valora -p 5432:5432 -d postgres:15

   # Enable pgvector extension
   docker exec -it valora-postgres psql -U postgres -d valora -c "CREATE EXTENSION IF NOT EXISTS vector;"
   ```

2. **Create database schema**:
   ```bash
   psql -U postgres -d valora -f database/schema.sql
   ```

3. **Configure environment variables**:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=valora
   DB_USER=postgres
   DB_PASSWORD=valora_password
   ```

#### Option B: Docker Compose (Easiest Setup)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f valora
```

#### Option C: Legacy lowdb (Development Only)

No additional setup required - uses encrypted JSON file storage.

### 4. Running the Server

First, build the project's TypeScript source:

```bash
npm run build
```

Then, you can start the server:

```bash
npm start
```

You should see output confirming the server and services have initialized:

```
> ✅ PostgreSQL storage service initialized
> ✅ Vector search service initialized
> 🚀 Valora MCP Server running on http://localhost:3000
```

### 5. Database Migration (Optional)

If you have existing data from the lowdb storage, migrate it to PostgreSQL:

```bash
# Ensure environment variables are set
export VALORA_SECRET_KEY="your-existing-secret-key"
export DB_HOST=localhost
export DB_USER=postgres
export DB_PASSWORD=valora_password

# Run migration
npx ts-node scripts/migrate-to-postgres.ts
```

## Usage

### API Endpoints

Here are some examples using `curl`. Remember to replace `your-secure-api-key` with the key you defined.

**Create a Memory**

```bash
curl -X POST http://localhost:3000/memory \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your-secure-api-key" \
-d '{
  "content": "This is a test memory about using Express.js with TypeScript.",
  "source": "manual-test"
}'
```

**Semantic Search**

```bash
curl -X POST http://localhost:3000/memory/semantic-search \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your-secure-api-key" \
-d '{
  "query": "How do I use Express with TS?"
}'
```

**Export a Bundle of Memories**

```bash
curl -X POST http://localhost:3000/export/bundle \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your-secure-api-key" \
-d '{
  "memoryIds": ["uuid-of-memory-1", "uuid-of-memory-2"],
  "format": "markdown"
}'
```

### CLI Commands

Valora includes a CLI for developer-focused tasks.

**Crawl a Directory**

This command recursively scans a directory and ingests files with the specified extensions.

```bash
# Ensure the server is NOT running, as this command starts its own container instance.
# Crawl the 'src' directory for .ts and .md files.
node build/cli/index.js crawl ./src --ext .ts,.md
```

**Parse Chat Conversations from Copy/Paste**

Convert copy/pasted chat content from ChatGPT, Claude, or other AI platforms into structured JSON:

```bash
# Parse ChatGPT conversation
node build/cli/index.js paste-chat --format chatgpt
# Then paste your conversation and press Ctrl+D

# Parse Claude conversation
node build/cli/index.js paste-chat --format claude

# Auto-detect format
node build/cli/index.js paste-chat --format auto
```

**Import Parsed Chat Data**

Import the JSON file generated by the paste-chat command:

```bash
# Import the generated JSON file
node build/cli/index.js import-chat /tmp/valora-chat-1234567890.json
```

**Interactive Chat Interface**

Use the conversational interface to search and manage memories:

```bash
# Start the interactive chat
node build/cli/index.js chat

# In chat, you can:
# help - Show help
# search <query> - Search memories
# remember <text> - Create new memory
# show <id> - Show memory details
# export last - Export recent results
# history - Show conversation history
# quit - Exit
```

## Chat Continuity

Valora provides a complete workflow for importing chat conversations, storing them securely, and exporting them in formats that can be used to continue conversations in other AI agents.

### Workflow Overview

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

### Import Chat Conversations

#### Import Structured Chat Data

```bash
curl -X POST http://localhost:3000/chat/import \
-H "Authorization: Bearer your-secure-api-key" \
-H "Content-Type: application/json" \
-d '{
  "conversationId": "react_tutorial_001",
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
  "tags": ["react", "programming", "tutorial"]
}'
```

#### Import from Various Formats

Valora supports importing from JSON, plain text, and markdown formats:

**Plain Text Import:**
```bash
curl -X POST http://localhost:3000/chat/import-format \
-H "Authorization: Bearer your-secure-api-key" \
-H "Content-Type: application/json" \
-d '{
  "content": "User: How do I build a React component?\nAssistant: To build a React component...",
  "format": "text",
  "source": "chatgpt",
  "conversationId": "react_tutorial_002"
}'
```

**Markdown Import:**
```bash
curl -X POST http://localhost:3000/chat/import-format \
-H "Authorization: Bearer your-secure-api-key" \
-H "Content-Type: application/json" \
-d '{
  "content": "### User\nHow do I build a React component?\n\n### Assistant\nTo build a React component...",
  "format": "markdown",
  "source": "chatgpt",
  "conversationId": "react_tutorial_003"
}'
```

### Export for Continuation

#### Get Conversation Context

```bash
curl -X GET http://localhost:3000/chat/context/react_tutorial_001 \
-H "Authorization: Bearer your-secure-api-key"
```

#### Export in Conversation Format

```bash
curl -X POST http://localhost:3000/export/bundle \
-H "Authorization: Bearer your-secure-api-key" \
-H "Content-Type: application/json" \
-d '{
  "memoryIds": ["mem_001", "mem_002"],
  "format": "conversation"
}'
```

This returns a formatted conversation ready for continuation:

```
Conversation: react_tutorial_001
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

### Use Cases

- **Cross-Platform Continuation**: Start in ChatGPT, continue in Claude
- **Conversation Backup**: Store important conversations securely
- **Context Preservation**: Keep conversation history for long-term projects
- **Multi-Agent Workflows**: Use different AI agents for different aspects

### Supported Formats

**Import Formats:**
- Structured JSON with conversation metadata
- Plain text with alternating user/assistant format
- Markdown with headers for participants

**Export Formats:**
- `conversation`: Recommended for AI agent continuation
- `json`: Structured data for programmatic processing
- `markdown`: Documentation style with metadata
- `text`: Simple format with timestamps

## Chat Parsing & Import Tools

Valora includes powerful tools for parsing and importing chat conversations from various AI platforms through copy/paste mechanisms.

### Parse Chat Conversations

The `paste-chat` command automatically detects and parses conversations from different AI platforms:

```bash
# Parse ChatGPT conversation (copy/paste)
node build/cli/index.js paste-chat --format chatgpt
# Paste your conversation and press Ctrl+D

# Parse Claude conversation
node build/cli/index.js paste-chat --format claude

# Auto-detect format
node build/cli/index.js paste-chat --format auto
```

**Example ChatGPT Format:**
```
You said: How do I implement authentication in my app?

Assistant: For authentication, you have several options...

You said: Tell me about JWT tokens.

Assistant: JWT (JSON Web Tokens) are a popular choice...
```

**Example Claude Format:**
```
Human: How do I implement authentication in my app?

Assistant: For authentication, you have several options...

Human: Tell me about JWT tokens.

Assistant: JWT (JSON Web Tokens) are a popular choice...
```

### Import Parsed Conversations

After parsing, the tool generates a JSON file and provides the import command:

```bash
# The tool will output something like:
💾 JSON saved to: /tmp/valora-chat-1643123456789.json

🚀 To import this chat, run:
   node build/cli/index.js import-chat "/tmp/valora-chat-1643123456789.json"

# Or use the API:
curl -X POST http://localhost:3000/chat/import \
-H "Authorization: Bearer your-secure-api-key" \
-H "Content-Type: application/json" \
-d @/tmp/valora-chat-1643123456789.json
```

### Interactive Chat Interface

Valora includes a conversational interface for managing memories:

```bash
# Start the interactive chat
node build/cli/index.js chat

# Available commands in chat:
🤖 Valora > help                    # Show help
🤖 Valora > search <query>         # Search memories
🤖 Valora > remember <text>        # Create new memory
🤖 Valora > show <id>              # Show memory details
🤖 Valora > export last           # Export recent results
🤖 Valora > history               # Show conversation history
🤖 Valora > quit                  # Exit
```

### Advanced Options

```bash
# Add custom tags during parsing
node build/cli/index.js paste-chat --format chatgpt --tags "project-planning,architecture"

# Use custom conversation ID
node build/cli/index.js paste-chat --format claude --id "my-research-session-001"

# Import with custom source
node build/cli/index.js import-chat chat.json --source "personal-research"
```

## Integrating with AI Tools (Cursor, Claude, etc.)

Valora acts as a powerful, external memory that you can use with any AI tool or large language model. The **Session Bridge Adapter** is designed for this purpose.

The workflow involves three steps: **Find, Bundle, and Use**.

### Step 1: Find Relevant Memories

First, use the search endpoints to find the memories you need. For example, if you're about to work on a feature related to API security, you could run a semantic search:

```bash
curl -X POST http://localhost:3000/memory/semantic-search \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your-secure-api-key" \
-d '{
  "query": "best practices for api security"
}'
```

This will return a list of relevant memories, including their IDs.

### Step 2: Export a Memory Bundle

Next, take the IDs of the memories you want to use and bundle them together using the export endpoint.

```bash
curl -X POST http://localhost:3000/export/bundle \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your-secure-api-key" \
-d '{
  "memoryIds": ["uuid-of-memory-1", "uuid-of-memory-4", "uuid-of-memory-9"],
  "format": "markdown"
}'
```

This will return a single, clean string containing all the requested memories, formatted for readability.

### Step 3: Use as Context in Your AI Tool

Finally, copy the entire output from the export command and paste it into the prompt of your favorite AI tool (like Cursor.ai, Claude, etc.).

You can prefix your prompt with something like:

> "Here is some context from my personal memory archive. Please use this information to help answer my next question."
> 
> ---
> **Source:** file:///path/to/project/security.ts
> **Timestamp:** 2023-10-27T10:00:00.000Z
> 
> export const someFunction = ...
> ---
> 
> *[... more memories ...]*
>
> Now, my question is: "Based on the code I've provided, what is the most significant security vulnerability?"

This workflow allows you to bring deep, historical context to any AI conversation, making the responses more accurate and personalized.

## MCP Integration (Cursor.ai)

Valora supports Model Context Protocol (MCP) integration, allowing seamless access to your memory archive directly from Cursor.ai through custom commands.

### Setup MCP Configuration

Add the following to your `~/.cursor/mcp.json` file:

```json
{
  "Search Valora Memory": {
    "command": "sh",
    "args": [
      "-c",
      "curl -s -X POST http://localhost:3000/memory/semantic-search -H \"Content-Type: application/json\" -H \"Authorization: Bearer $VALORA_API_KEY\" -d '{\"query\": \"{{query}}\"}'"
    ]
  },
  "Import Chat to Valora": {
    "command": "sh",
    "args": [
      "-c",
      "echo '📋 Paste your chat conversation below (press Ctrl+D when done):' && echo '==================================================' && valora paste-chat {{format}} && echo '\\n✅ Chat parsed! Use the import command shown above.'"
    ]
  },
  "Export Valora Memory Bundle": {
    "command": "sh",
    "args": [
      "-c",
      "curl -s -X POST http://localhost:3000/export/bundle -H \"Content-Type: application/json\" -H \"Authorization: Bearer $VALORA_API_KEY\" -d '{\"memoryIds\": [\"{{memoryIds}}\"], \"format\": \"markdown\"}'"
    ]
  }
}
```

### Environment Setup

Before using MCP commands in Cursor, set your environment variables:

```bash
# In your terminal (before launching Cursor)
export VALORA_API_KEY="your-actual-api-key"
export VALORA_SECRET_KEY="your-actual-secret-key"

# Then launch Cursor from this terminal
/Applications/Cursor.app/Contents/MacOS/Cursor
```

### Using MCP Commands in Cursor

1. **Search Memories**: `Cmd+K` → "Search Valora Memory" → Type your query
2. **Import Chat**: `Cmd+K` → "Import Chat to Valora" → Select format → Paste conversation
3. **Export Bundle**: `Cmd+K` → "Export Valora Memory Bundle" → Provide memory IDs

### MCP Workflow

```
Cursor Command Palette → Valora MCP Command → Local Server API → Formatted Response → Cursor Chat
```

This creates a seamless workflow where you can search your memory archive, import new conversations, and export memory bundles without leaving Cursor!

## Technology Stack

### Backend & Runtime
-   **Runtime**: Node.js 20.0+ with ES Modules
-   **Language**: TypeScript 5.0+ with strict type checking
-   **Framework**: Express.js 4.21+ with security middleware
-   **Process Management**: PM2 for production deployment

### Database & Storage
-   **Primary Database**: PostgreSQL 15+ with pgvector extension
-   **Connection Pooling**: `pg` with connection pooling and SSL support
-   **Vector Search**: pgvector for semantic similarity search
-   **Legacy Support**: lowdb (JSON file storage) for development
-   **Database Management**: pgAdmin 4 web interface

### AI/ML & Search
-   **Embeddings**: `@xenova/transformers` for local, privacy-preserving embeddings
-   **Vector Operations**: pgvector for high-performance similarity search
-   **Tagging**: ML-powered content classification and tagging
-   **Search**: Full-text search + semantic search + hybrid search

### Security & Authentication
-   **Encryption**: AES-256-GCM for data at rest encryption
-   **Authentication**: JWT with refresh tokens + API key authentication
-   **Security Headers**: Helmet.js for comprehensive HTTP security headers
-   **Rate Limiting**: Configurable rate limiting per endpoint
-   **CORS**: Configurable cross-origin resource sharing
-   **Brute Force Protection**: Advanced authentication security

### Infrastructure & Deployment
-   **Containerization**: Docker with multi-stage builds for optimization
-   **Orchestration**: Docker Compose for complete stack management
-   **Reverse Proxy**: Nginx with SSL termination and load balancing
-   **Caching**: Redis for session storage and caching
-   **Monitoring**: Custom metrics with Prometheus compatibility

### Development Tools
-   **CLI Framework**: Commander.js for command-line interface
-   **Testing**: Jest with Supertest for API testing
-   **Linting**: ESLint with TypeScript support
-   **Documentation**: OpenAPI/Swagger for API documentation
-   **Build Tool**: TypeScript compiler with ES Module support

### External Integrations
-   **Webhooks**: Real-time notifications for external systems
-   **API Documentation**: Swagger UI for interactive API exploration
-   **Health Checks**: Kubernetes-compatible health endpoints
-   **Metrics Export**: Prometheus-compatible metrics endpoint

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines. 
---

## 🔁 Valora Memory Workflow Update (v2)

Valora now supports cross-platform memory export/import using `.valora.mem.json` capsules. This enables users to:
- Save memory capsules from AI agents (ChatGPT, Claude, etc.)
- Import those capsules into the local Valora MCP Server
- Resume, hydrate, or continue conversations contextually across any IDE or supported environment (e.g., Cursor, Trey, AIM)

**Memory Rehydration Process:**
1. User saves `.valora.mem.json` via desktop or web agent.
2. Valora MCP parses, tags, and logs context.
3. Capsule can be rehydrated in any compatible IDE (Windsurf, Cursor, VSCode) using a local Valora plugin.
4. Memory appears as part of session, with natural continuation and context recognition.

Download the diagram: [valora_user_import_flow.xml](valora_user_import_flow.xml)

