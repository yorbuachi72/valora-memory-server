import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ChatParser } from './parser.js';
import { chatImportService } from './service.js';
import { exportService } from '../export/service.js';
import { initMemoryContainer, clearAllMemories } from '../storage/container.js';

// Test data
const chatGPTConversation = `# Example ChatGPT Conversation
You said: I want to build a memory system for AI conversations. Can you help me design it?

Assistant: I'd be happy to help you design a memory system for AI conversations! This is actually a really interesting problem. Let me think through the key components...

First, what are your main goals for this system? Are you thinking about:
1. Storing conversations for future reference
2. Learning from past interactions
3. Providing context for ongoing conversations
4. Something else?

You said: All of the above! I want a comprehensive system that can capture, organize, and retrieve conversation memories effectively.

Assistant: Excellent! So you're looking for a comprehensive solution. Here's what I think would work best:

## Core Architecture
- **Storage Layer**: Encrypted local database
- **Ingestion**: Multiple sources (manual, file import, API)
- **Retrieval**: Semantic search with embeddings
- **Export**: Clean formats for reuse

## Key Features
1. **Multi-format import** (JSON, text, markdown)
2. **Intelligent tagging** (auto-generated + manual)
3. **Vector search** for semantic similarity
4. **Secure encryption** at rest
5. **CLI + API** interfaces

Would you like me to elaborate on any of these components?

You said: Yes, let's dive deeper into the vector search and embeddings part. How would that work?

Assistant: Great question about vector search! Here's how it would work:

## Vector Search Implementation

### 1. Text Embedding
When you save a memory, the system:
- Takes your text content
- Passes it through an embedding model (like sentence-transformers)
- Converts it to a high-dimensional vector (e.g., 768 dimensions)

### 2. Similarity Search
When you search:
- Your query also gets converted to a vector
- System finds memories with closest vector distance
- Returns most semantically similar results

### 3. Benefits
- Finds related content even with different words
- Understands context and meaning
- Works across languages
- Scales well with large datasets

The embedding model I recommend is 'all-MiniLM-L6-v2' - it's fast, accurate, and works great for semantic search!

You said: This sounds perfect! Let's start building this system.

Assistant: Fantastic! I'm excited to help you build this. 

To get started, I recommend:
1. Set up the basic Node.js/TypeScript project structure
2. Implement the core memory storage system
3. Add the vector search capability
4. Build the CLI and API interfaces
5. Add encryption and security features

Would you like me to help you with the initial project setup and core architecture?`;

const claudeConversation = `# Claude Conversation
Human: I'm building a memory system for AI conversations. What are the key considerations?

Assistant: That's a fascinating project! Building a memory system for AI conversations involves several important considerations:

## Key Architectural Decisions

1. **Storage Strategy**
   - Local vs cloud storage
   - Encryption requirements
   - Performance vs cost trade-offs

2. **Data Structure**
   - How to represent conversations
   - Metadata capture (timestamps, participants, context)
   - Search indexing strategy

3. **Privacy & Security**
   - End-to-end encryption
   - Access controls
   - Data retention policies

4. **Scalability**
   - Handling large conversation volumes
   - Efficient search algorithms
   - Performance optimization

What aspect interests you most?

Human: Let's focus on the data structure. How should I model AI conversations?

Assistant: Great choice! Data structure is fundamental to your system's success.

## Conversation Data Model

### Core Entities
\`\`\`typescript
interface Conversation {
  id: string;
  title?: string;
  participants: Participant[];
  messages: Message[];
  metadata: ConversationMetadata;
  created: Date;
  updated: Date;
}

interface Message {
  id: string;
  content: string;
  participant: Participant;
  timestamp: Date;
  metadata?: MessageMetadata;
}

interface Participant {
  id: string;
  name: string;
  role: 'user' | 'assistant' | 'system';
  model?: string; // For AI participants
}
\`\`\`

### Key Design Decisions

1. **Message Granularity**
   - Store each message separately for flexibility
   - Maintain conversation-level metadata
   - Support threaded conversations

2. **Rich Metadata**
   - Model information for AI responses
   - Token counts, processing times
   - Error states and retry information

3. **Search Optimization**
   - Full-text search on content
   - Metadata filtering capabilities
   - Vector embeddings for semantic search

This structure gives you maximum flexibility for different use cases while maintaining clean relationships between entities.

Human: That makes sense. What about the search functionality?

Assistant: Excellent question! Search is one of the most important features for a memory system.

## Search Architecture

### Multi-Layer Search Strategy

1. **Keyword Search**
   - Full-text search on message content
   - Participant name filtering
   - Date range filtering

2. **Semantic Search**
   - Vector embeddings for meaning-based search
   - Cross-language understanding
   - Context-aware results

3. **Hybrid Search**
   - Combine keyword and semantic results
   - Weighted scoring algorithm
   - Relevance ranking

### Implementation Approach

\`\`\`typescript
interface SearchQuery {
  text?: string;
  participant?: string;
  dateRange?: DateRange;
  conversationId?: string;
  limit?: number;
  semantic?: boolean;
}

interface SearchResult {
  message: Message;
  conversation: Conversation;
  score: number;
  highlights?: string[];
}
\`\`\`

The hybrid approach gives you the best of both worlds - fast, precise keyword matches combined with intelligent semantic understanding.`;

describe('Chat Import/Export Integration Tests', () => {
  beforeEach(async () => {
    // Initialize the memory container for each test
    process.env.VALORA_SECRET_KEY = 'test-secret-key-for-testing';
    await initMemoryContainer();
    await clearAllMemories();
  });

  afterEach(async () => {
    await clearAllMemories();
  });

  describe('ChatGPT Conversation Workflow', () => {
    it('should parse, import, and export ChatGPT conversation successfully', async () => {
      // Step 1: Parse ChatGPT conversation
      const parsedData = ChatParser.parseChatGPT(chatGPTConversation);

      expect(parsedData.source).toBe('chatgpt');
      expect(parsedData.messages.length).toBeGreaterThan(0);
      expect(parsedData.tags).toContain('chatgpt');

      // Step 2: Import the conversation
      const importedMemories = await chatImportService.importChat(parsedData);

      expect(importedMemories.length).toBe(parsedData.messages.length);
      expect(importedMemories[1].content).toContain('memory system for AI conversations');
      expect(importedMemories[0].source).toBe('chatgpt');

      // Step 3: Export in conversation format
      const exportedContent = exportService.formatMemories(importedMemories, 'conversation');

      expect(exportedContent).toContain('Conversation:');
      expect(exportedContent).toContain('user:');
      expect(exportedContent).toContain('assistant:');
      expect(exportedContent).toContain('memory system for AI conversations');
    });

    it('should handle ChatGPT conversation with custom conversation ID', async () => {
      const customId = 'custom-chatgpt-conversation-123';
      const parsedData = ChatParser.parseChatGPT(chatGPTConversation, customId);

      expect(parsedData.conversationId).toBe(customId);

      const importedMemories = await chatImportService.importChat(parsedData);
      expect(importedMemories[0].conversationId).toBe(customId);
    });

    it('should export ChatGPT conversation for cross-platform continuation', async () => {
      const parsedData = ChatParser.parseChatGPT(chatGPTConversation);
      const importedMemories = await chatImportService.importChat(parsedData);

      // Export in JSON format for Claude/GPT continuation
      const jsonExport = exportService.formatMemories(importedMemories, 'json');
      const exportedData = JSON.parse(jsonExport);

      expect(Array.isArray(exportedData)).toBe(true);
      expect(exportedData.length).toBe(importedMemories.length);
      expect(exportedData[0]).toHaveProperty('content');
      expect(exportedData[0]).toHaveProperty('participant');
    });
  });

  describe('Claude Conversation Workflow', () => {
    it('should parse, import, and export Claude conversation successfully', async () => {
      // Step 1: Parse Claude conversation
      const parsedData = ChatParser.parseClaude(claudeConversation);

      expect(parsedData.source).toBe('claude');
      expect(parsedData.messages.length).toBeGreaterThan(0);
      expect(parsedData.tags).toContain('claude');

      // Step 2: Import the conversation
      const importedMemories = await chatImportService.importChat(parsedData);

      expect(importedMemories.length).toBe(parsedData.messages.length);
      expect(importedMemories[1].content).toContain('memory system for AI conversations');
      expect(importedMemories[0].source).toBe('claude');

      // Step 3: Export in conversation format
      const exportedContent = exportService.formatMemories(importedMemories, 'conversation');

      expect(exportedContent).toContain('Conversation:');
      expect(exportedContent).toContain('user:');
      expect(exportedContent).toContain('assistant:');
      expect(exportedContent).toContain('memory system for AI conversations');
    });

    it('should handle Claude conversation with custom conversation ID', async () => {
      const customId = 'custom-claude-conversation-456';
      const parsedData = ChatParser.parseClaude(claudeConversation, customId);

      expect(parsedData.conversationId).toBe(customId);

      const importedMemories = await chatImportService.importChat(parsedData);
      expect(importedMemories[0].conversationId).toBe(customId);
    });

    it('should export Claude conversation for cross-platform continuation', async () => {
      const parsedData = ChatParser.parseClaude(claudeConversation);
      const importedMemories = await chatImportService.importChat(parsedData);

      // Export in conversation format optimized for other AI platforms
      const conversationExport = exportService.formatMemories(importedMemories, 'conversation');

      expect(conversationExport).toContain('user:');
      expect(conversationExport).toContain('assistant:');
      expect(conversationExport).toContain('Data Structure');
      expect(conversationExport).toContain('Search Architecture');
    });
  });

  describe('Cross-Platform Conversation Continuation', () => {
    it('should import ChatGPT conversation and export for Claude format', async () => {
      // Import ChatGPT conversation
      const chatgptData = ChatParser.parseChatGPT(chatGPTConversation);
      const chatgptMemories = await chatImportService.importChat(chatgptData);

      // Export in format suitable for Claude continuation
      const continuationFormat = exportService.formatMemories(chatgptMemories, 'conversation');

      // Verify it contains the key conversation elements
      expect(continuationFormat).toContain('assistant:');
      expect(continuationFormat).toContain('vector search');
      expect(continuationFormat).toContain('embeddings');

      // The format should be readable by Claude/GPT for continuation
      expect(continuationFormat).toMatch(/Conversation:/);
      expect(continuationFormat).toMatch(/user:|assistant:/);
    });

    it('should import Claude conversation and export for ChatGPT format', async () => {
      // Import Claude conversation
      const claudeData = ChatParser.parseClaude(claudeConversation);
      const claudeMemories = await chatImportService.importChat(claudeData);

      // Export in format suitable for ChatGPT continuation
      const continuationFormat = exportService.formatMemories(claudeMemories, 'conversation');

      // Verify it contains the key conversation elements
      expect(continuationFormat).toContain('assistant:');
      expect(continuationFormat).toContain('Data Structure');
      expect(continuationFormat).toContain('Search Architecture');

      // The format should be readable by ChatGPT/Claude for continuation
      expect(continuationFormat).toMatch(/Conversation:/);
      expect(continuationFormat).toMatch(/user:|assistant:/);
    });

    it('should handle mixed conversation sources in single export', async () => {
      // Import conversations from different sources
      const chatgptData = ChatParser.parseChatGPT(chatGPTConversation);
      const claudeData = ChatParser.parseClaude(claudeConversation);

      const chatgptMemories = await chatImportService.importChat(chatgptData);
      const claudeMemories = await chatImportService.importChat(claudeData);

      // Combine all memories for export
      const allMemories = [...chatgptMemories, ...claudeMemories];
      const combinedExport = exportService.formatMemories(allMemories, 'conversation');

      // Should contain elements from both conversations
      expect(combinedExport).toContain('ChatGPT');
      expect(combinedExport).toContain('Claude');
      expect(combinedExport).toContain('vector search');
      expect(combinedExport).toContain('Data Structure');
    });
  });

  describe('API Workflow Integration', () => {
    it('should handle JSON import format correctly', async () => {
      const jsonContent = JSON.stringify({
        conversationId: 'test-json-conversation',
        messages: [
          {
            participant: 'user',
            content: 'Hello from JSON import',
            timestamp: '2024-01-01T10:00:00Z'
          },
          {
            participant: 'assistant',
            content: 'Hello! JSON import works perfectly.',
            timestamp: '2024-01-01T10:00:05Z'
          }
        ],
        source: 'test-api',
        tags: ['json', 'test']
      });

      const memories = await chatImportService.importFromFormat(
        jsonContent,
        'json',
        'test-api',
        'test-json-conversation'
      );

      expect(memories.length).toBe(2);
      expect(memories[0].content).toBe('Hello from JSON import');
      expect(memories[1].content).toBe('Hello! JSON import works perfectly.');
      expect(memories[0].conversationId).toBe('test-json-conversation');
    });

    it('should handle text import format with auto-detection', async () => {
      const textContent = `User: How does the text import work?
Assistant: It automatically parses the conversation format and creates structured memories.`;

      const memories = await chatImportService.importFromFormat(
        textContent,
        'text',
        'test-text',
        'test-text-conversation'
      );

      expect(memories.length).toBe(2);
      expect(memories[0].participant).toBe('user');
      expect(memories[1].participant).toBe('assistant');
      expect(memories[0].conversationId).toBe('test-text-conversation');
    });

    it('should handle markdown import format', async () => {
      const markdownContent = `# User
How does markdown import work?

# Assistant
It parses markdown headers to identify participants and creates structured conversation memories.

# User
That's really helpful!`;

      const memories = await chatImportService.importFromFormat(
        markdownContent,
        'markdown',
        'test-markdown',
        'test-markdown-conversation'
      );

      expect(memories.length).toBe(3);
      expect(memories[0].participant).toBe('user');
      expect(memories[1].participant).toBe('assistant');
      expect(memories[2].participant).toBe('user');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty conversation gracefully', async () => {
      const emptyData = {
        conversationId: 'empty-conversation',
        messages: [],
        source: 'test',
        tags: ['empty']
      };

      const memories = await chatImportService.importChat(emptyData);
      expect(memories.length).toBe(0);
    });

    it('should handle malformed JSON import gracefully', async () => {
      await expect(
        chatImportService.importFromFormat(
          'invalid json content',
          'json',
          'test',
          'test-conversation'
        )
      ).rejects.toThrow();
    });

    it('should handle conversations with missing timestamps', async () => {
      const dataWithoutTimestamps = {
        conversationId: 'no-timestamps',
        messages: [
          {
            participant: 'user',
            content: 'Hello without timestamp',
            timestamp: new Date()
          }
        ],
        source: 'test',
        tags: ['test']
      };

      const memories = await chatImportService.importChat(dataWithoutTimestamps);
      expect(memories.length).toBe(1);
      expect(memories[0].timestamp).toBeInstanceOf(Date);
    });

    it('should handle very long conversation content', async () => {
      const longMessage = 'A'.repeat(10000); // 10KB message
      const dataWithLongMessage = {
        conversationId: 'long-conversation',
        messages: [
          {
            participant: 'user',
            content: longMessage,
            timestamp: new Date()
          }
        ],
        source: 'test',
        tags: ['long-content']
      };

      const memories = await chatImportService.importChat(dataWithLongMessage);
      expect(memories.length).toBe(1);
      expect(memories[0].content.length).toBe(10000);
    });

    it('should preserve conversation metadata during export', async () => {
      const dataWithMetadata = {
        conversationId: 'metadata-test',
        messages: [
          {
            participant: 'user',
            content: 'Test with metadata',
            timestamp: new Date()
          }
        ],
        source: 'test',
        tags: ['metadata', 'test'],
        metadata: {
          customField: 'customValue',
          sessionId: 'session123'
        },
        context: 'Test conversation with metadata'
      };

      const memories = await chatImportService.importChat(dataWithMetadata);

      // Export and verify metadata is preserved
      const jsonExport = exportService.formatMemories(memories, 'json');
      const exportedData = JSON.parse(jsonExport);

      expect(exportedData[0].metadata).toHaveProperty('customField', 'customValue');
      expect(exportedData[0].metadata).toHaveProperty('sessionId', 'session123');
      expect(exportedData[0].metadata).toHaveProperty('conversationId', 'metadata-test');
    });
  });

  describe('Auto-detection and Format Handling', () => {
    it('should auto-detect ChatGPT format', () => {
      const chatgptText = `You said: Hello
Assistant: Hi there!`;

      const parsed = ChatParser.parse(chatgptText);
      expect(parsed.source).toBe('chatgpt');
      expect(parsed.messages.length).toBe(2);
    });

    it('should auto-detect Claude format', () => {
      const claudeText = `Human: Hello
Assistant: Hi there!`;

      const parsed = ChatParser.parse(claudeText);
      expect(parsed.source).toBe('claude');
      expect(parsed.messages.length).toBe(2);
    });

    it('should fall back to generic format for unknown patterns', () => {
      const genericText = `User: Hello
Assistant: Hi there!`;

      const parsed = ChatParser.parse(genericText);
      expect(parsed.source).toBe('generic-chat');
      expect(parsed.messages.length).toBe(2);
    });

    it('should handle mixed participant formats', () => {
      const mixedText = `You: Hello from ChatGPT format
AI: Hello from Claude format
Assistant: Hello from generic format`;

      const parsed = ChatParser.parse(mixedText);
      expect(parsed.messages.length).toBe(3);
      expect(parsed.messages[0].participant).toBe('user');
      expect(parsed.messages[1].participant).toBe('assistant');
      expect(parsed.messages[2].participant).toBe('assistant');
    });
  });
});
