# Quick Start Guide

Get up and running with Valora MCP Server in minutes. This enterprise-ready platform supports PostgreSQL backend, multi-tenancy, and vector search capabilities.

## Prerequisites

- **Node.js** (v20 or later)
- **PostgreSQL** (v15+ with pgvector extension)
- **Docker** (optional, for easy setup)
- **Git**

## Step 1: Install Valora

### Option A: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/valora.git
cd valora

# Start all services with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f valora
```

### Option B: From Source

```bash
# Clone the repository
git clone https://github.com/your-username/valora.git
cd valora

# Install dependencies
npm install

# Build the project
npm run build
```

## Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=valora
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Authentication Secrets
VALORA_SECRET_KEY="$(openssl rand -base64 32)"
VALORA_JWT_SECRET="$(openssl rand -base64 32)"
VALORA_API_KEY="$(openssl rand -hex 32)"

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: Multi-tenancy
DEFAULT_TENANT_ID=default
```

## Step 3: Set Up Database

### Using Docker Compose (Easiest)

```bash
# Start PostgreSQL with pgvector
docker-compose up -d postgres

# Wait for database to be ready
sleep 10

# Run database migration
npm run migrate
```

### Manual PostgreSQL Setup

```bash
# Create database
createdb valora

# Enable pgvector extension
psql -d valora -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run schema migration
psql -d valora -f src/database/schema.sql
```

## Step 4: Start the Server

```bash
npm start
```

You should see:
```
██╗   ██╗ █████╗ ██╗      ██████╗ ██████╗  █████╗
██║   ██║██╔══██╗██║     ██╔═══██╗██╔══██╗██╔══██╗
██║   ██║███████║██║     ██║   ██║██████╔╝███████║
╚██╗ ██╔╝██╔══██║██║     ██║   ██║██╔══██╗██╔══██║
 ╚████╔╝ ██║  ██║███████╗╚██████╔╝██║  ██║██║  ██║
  ╚═══╝  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
Powered by Nkiru Technologies

🧠 Valora memory container initialized at /home/user/.valora/db.json
✅ PostgreSQL storage service initialized
✅ Vector search service initialized
✅ Tagging Service Initialized (Mock Mode).
🚀 Valora MCP Server running on http://localhost:3000
🔒 Security features enabled: CORS, Rate Limiting, Input Sanitization
📊 Monitoring enabled on /monitoring
```

## Step 5: Test the Installation

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "Valora MCP Server is running.",
  "timestamp": "2024-12-15T10:00:00.000Z",
  "version": "2.0.0"
}
```

### Register Your First User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!",
    "username": "admin",
    "fullName": "System Administrator"
  }'
```

### Login and Get Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!"
  }'
```

Save the `accessToken` from the response for the next steps.

### Create Your First Memory

```bash
curl -X POST http://localhost:3000/memory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "content": "React components are reusable UI elements that can be composed together to build complex interfaces.",
    "source": "quick-start",
    "contentType": "note",
    "tags": ["react", "frontend", "components"]
  }'
```

## Step 5: Import a Chat Conversation

### Example: Import from ChatGPT

Copy a conversation from ChatGPT and import it:

```bash
curl -X POST http://localhost:3000/chat/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "conversationId": "react_tutorial_001",
    "messages": [
      {
        "participant": "user",
        "content": "How do I create a React component?",
        "timestamp": "2024-01-15T10:00:00Z"
      },
      {
        "participant": "assistant",
        "content": "To create a React component, you can use either functional or class components. Here is a simple functional component example...",
        "timestamp": "2024-01-15T10:01:00Z"
      }
    ],
    "source": "chatgpt",
    "tags": ["react", "tutorial"]
  }'
```

## Step 6: Search and Export

### Search for Memories

```bash
curl -X POST http://localhost:3000/memory/semantic-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "query": "React components"
  }'
```

### Export for Use in Another AI Tool

```bash
curl -X POST http://localhost:3000/export/bundle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "memoryIds": ["memory-id-from-search"],
    "format": "conversation"
  }'
```

## Step 7: Use with AI Tools

Copy the exported conversation and use it as context in any AI tool:

### Example: Use with Claude

```typescript
const claudePrompt = `
Previous conversation:
${exportedConversation}

Please continue this discussion about React components.
`;

// Use with Claude API
```

### Example: Use with ChatGPT

Paste the exported conversation into ChatGPT with:
> "Here is a previous conversation about React components. Please continue this discussion:"

## CLI Usage

### Crawl a Directory

Import code and documentation files:

```bash
# Crawl your project directory
node build/cli/index.js crawl ./src --ext .ts,.js,.md

# Crawl with custom extensions
node build/cli/index.js crawl ./docs --ext .md,.txt,.rst
```

## Common Workflows

### 1. Daily Development Workflow

```bash
# 1. Start your day by importing yesterday's conversations
curl -X POST http://localhost:3000/chat/import-format \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "content": "User: How do I implement authentication?\nAssistant: Here are the steps...",
    "format": "text",
    "source": "yesterday-chat",
    "conversationId": "auth_discussion"
  }'

# 2. Search for relevant context
curl -X POST http://localhost:3000/memory/semantic-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "query": "authentication implementation"
  }'

# 3. Export context for your current work
curl -X POST http://localhost:3000/export/bundle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "memoryIds": ["mem_001", "mem_002"],
    "format": "markdown"
  }'
```

### 2. Project Documentation Workflow

```bash
# 1. Crawl your project for documentation
node build/cli/index.js crawl ./project --ext .md,.txt

# 2. Search for specific topics
curl -X POST http://localhost:3000/memory/semantic-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "query": "API documentation"
  }'

# 3. Export as documentation
curl -X POST http://localhost:3000/export/bundle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "memoryIds": ["mem_003", "mem_004"],
    "format": "markdown"
  }'
```

## Next Steps

Now that you're up and running:

1. **Explore the API**: Check out the [API Reference](api-reference.md)
2. **Learn Chat Continuity**: Read the [Chat Continuity Guide](chat-continuity.md)
3. **Set up Production**: Follow the [Deployment Guide](deployment.md)
4. **Integrate with AI Tools**: See [Integration Examples](integration-examples.md)

## Troubleshooting

### Common Issues

**Server won't start:**
```bash
# Check if port is in use
lsof -i :3000

# Change port
export PORT=3001
npm start
```

**Authentication errors:**
```bash
# Verify API key is set
echo $VALORA_API_KEY

# Test authentication
curl -X GET http://localhost:3000/auth/status \
  -H "Authorization: Bearer your-api-key"
```

**Memory not found:**
```bash
# Check if memory exists
curl -X GET http://localhost:3000/memory/memory-id \
  -H "Authorization: Bearer your-api-key"
```

## Getting Help

- **Documentation**: Check the [full documentation](README.md)
- **Issues**: Create an issue on GitHub
- **Discussions**: Join community discussions

---

*Last updated: January 2024*
