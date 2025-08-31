e # 🚀 Valora MVP Quickstart: Personal AI Memory Management

> **For Technical Users** - Get started with AI conversation memory in 5 minutes

---

## 🎯 **What You'll Build**

**Valora** helps you preserve and continue AI conversations across different providers. Never lose important AI interactions again!

### **Key Use Cases:**
- 📝 **Save AI chats** before subscription cancellation
- 🔄 **Continue conversations** with different AI providers
- 🧠 **Build personal knowledge base** from AI interactions
- 🔌 **MCP integration** with your IDE (Cursor.ai)
- 💻 **CLI-first workflow** for power users

---

## ⚡ **5-Minute Setup**

### **1. Install & Setup**
```bash
# Clone and install
git clone https://github.com/yorbuachi72/valora-memory-server.git
cd valora-memory-server
npm install

# Set environment variables
export VALORA_SECRET_KEY="your-super-secret-key-here"
export VALORA_API_KEY="your-secure-api-key-here"
export PORT=3000

# Start the server
npm run build && npm start
```

### **2. Verify Installation**
```bash
# Server should be running on http://localhost:3000
curl http://localhost:3000/health
# Expected: {"status":"healthy","database":"connected"}
```

---

## 🔥 **Core Workflows**

### **Workflow 1: Save AI Chat Before Cancellation**

#### **Step 1: Capture Your Chat**
1. Go to ChatGPT/Claude conversation
2. **Select all** → **Copy** the entire conversation

#### **Step 2: Import to Valora**
```bash
# Parse and import ChatGPT conversation
node build/cli/index.js paste-chat --format chatgpt

# Paste your conversation and press Ctrl+D
# Valora will automatically parse and save it
```

#### **Step 3: Verify Storage**
```bash
# Check your stored conversations
curl http://localhost:3000/chat/context/your-conversation-id \
  -H "Authorization: Bearer your-secure-api-key-here"
```

---

### **Workflow 2: Cross-Platform Continuation**

#### **Step 1: Export for Different AI Provider**
```bash
# Get conversation context
curl -X GET http://localhost:3000/chat/context/your-conversation-id \
  -H "Authorization: Bearer your-secure-api-key-here" \
  -o conversation.json

# Export in conversation format
curl -X POST http://localhost:3000/export/bundle \
  -H "Authorization: Bearer your-secure-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "memoryIds": ["mem_001", "mem_002"],
    "format": "conversation"
  }'
```

#### **Step 2: Continue in Different AI**
1. Copy the exported conversation format
2. Paste into new AI provider (Claude, GPT, etc.)
3. Continue your conversation seamlessly!

---

### **Workflow 3: MCP Server Integration**

#### **Step 1: Configure Cursor.ai**
1. Open Cursor.ai settings
2. Add MCP server configuration:
```json
{
  "mcpServers": {
    "valora": {
      "command": "node",
      "args": ["/path/to/valora/build/cli/index.js", "start"],
      "env": {
        "VALORA_SECRET_KEY": "your-secret-key",
        "VALORA_API_KEY": "your-api-key"
      }
    }
  }
}
```

#### **Step 2: Use in Cursor**
```bash
# Search your memories
/search "react component best practices"

/add-memory "Custom React hook for data fetching"
```

---

### **Workflow 4: CLI Memory Management**

#### **Step 1: Interactive Chat Mode**
```bash
# Start interactive memory management
node build/cli/index.js chat

# Available commands:
help          # Show help
search <query> # Search memories
remember <text> # Create new memory
show <id>     # Show memory details
export last   # Export recent results
history       # Show conversation history
quit          # Exit
```

#### **Step 2: Batch Import**
```bash
# Import multiple conversations
node build/cli/index.js import-chat conversation1.json
node build/cli/index.js import-chat conversation2.json

# List all conversations
node build/cli/index.js chat
> search conversations
```

---

## 📊 **Sample Data & Testing**

### **Test with Sample Conversation**
```bash
# Use the provided sample data
curl -X POST http://localhost:3000/chat/import \
  -H "Authorization: Bearer your-secure-api-key-here" \
  -H "Content-Type: application/json" \
  -d @test-data/sample-chat.json
```

### **Quick Test Commands**
```bash
# Health check
curl http://localhost:3000/health

# List all memories
curl http://localhost:3000/memories \
  -H "Authorization: Bearer your-secure-api-key-here"

# Search memories
curl "http://localhost:3000/search?q=typescript" \
  -H "Authorization: Bearer your-secure-api-key-here"
```

---

## 🔧 **Configuration Options**

### **Environment Variables**
```env
# Required
VALORA_SECRET_KEY="your-encryption-key"
VALORA_API_KEY="your-api-key"

# Optional
PORT=3000
VALORA_BRAND="on"  # Show/hide branding
DB_HOST="localhost"
DB_NAME="valora"
```

### **Database Setup (Optional)**
```bash
# Quick Docker setup
docker-compose up -d postgres pgadmin

# Or use existing PostgreSQL
psql -U postgres -d valora -f database/schema.sql
```

---

## 🎯 **Success Metrics**

After setup, you should be able to:

- ✅ **Import** ChatGPT/Claude conversations
- ✅ **Export** conversations for cross-platform use
- ✅ **Search** through your AI memory database
- ✅ **Continue** conversations with different providers
- ✅ **Integrate** with Cursor.ai via MCP

---

## 🚨 **Troubleshooting**

### **Server Won't Start**
```bash
# Check environment variables
echo $VALORA_SECRET_KEY
echo $VALORA_API_KEY

# Check port availability
lsof -i :3000
```

### **Import Fails**
```bash
# Check JSON format
node build/cli/index.js paste-chat --format auto
# Paste and check for parsing errors
```

### **Database Issues**
```bash
# Reset database
npm run db:reset

# Check database health
curl http://localhost:3000/health
```

---

## 📚 **Next Steps**

### **Advanced Features**
- **Multi-tenancy**: Share memories across team
- **Vector search**: Semantic similarity matching
- **Webhook integrations**: Auto-sync with external tools
- **Tagging system**: Organize memories by topics

### **Production Deployment**
- **Docker Compose**: Full production stack
- **Nginx**: Load balancing and SSL
- **Monitoring**: Health checks and metrics
- **Backup**: Automated database backups

---

## 🎉 **You're Ready!**

**Valora** is now your personal AI memory vault. Start capturing and continuing your most valuable AI conversations today!

### **Quick Commands Reference:**
```bash
# Start server
npm start

# Import chat
node build/cli/index.js paste-chat

# Interactive mode
node build/cli/index.js chat

# Health check
curl http://localhost:3000/health
```

**Happy memory managing! 🧠✨**</content>
</xai:function_call">Wrote contents to MVP_QUICKSTART.md.

Assistant: Great! I've created a comprehensive user-focused quickstart guide. Now I need to tackle the end-to-end workflow testing. Based on our discussion, I should create tests for the key user workflows:

1. Chat capture workflow (copy-paste → import → store)
2. Cross-platform continuation (ChatGPT → Claude) 
3. MCP integration workflow
4. CLI memory management workflow
5. Knowledge base building workflow

Let me create end-to-end tests that simulate real user scenarios. These should be integration tests that test the complete user journey, not just individual functions. I'll create a new test file for end-to-end scenarios. अभिज्ञापत्रस्य<xai:function_call name="run_terminal_cmd">
<parameter name="command">git add MVP_QUICKSTART.md
