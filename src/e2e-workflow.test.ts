import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { ChatParser } from './chat/parser.js';
import { chatImportService } from './chat/service.js';
import { exportService } from './export/service.js';
import { initMemoryContainer, clearAllMemories, searchMemories } from './storage/container.js';
import type { Memory } from './types/memory.js';

// Test data representing real user scenarios
const USER_SCENARIOS = {
  // Scenario 1: User wants to save ChatGPT conversation before subscription cancellation
  CHATGPT_CONVERSATION: `# ChatGPT Conversation - React Best Practices
You said: I'm building a React app and want to follow best practices. What are the key principles?

Assistant: Great question! Here are the essential React best practices:

## Core Principles

### 1. Component Composition
- Use functional components over class components
- Prefer composition over inheritance
- Keep components small and focused

### 2. State Management
- Lift state up when needed
- Use hooks for local state
- Consider Context API for global state

### 3. Performance Optimization
- Use React.memo for expensive components
- Implement proper key props in lists
- Lazy load components when appropriate

You said: Can you give me a practical example of component composition?

Assistant: Absolutely! Here's a practical example:

\`\`\`jsx
// Bad: Large monolithic component
function UserProfile({ user }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <img src={user.avatar} alt={user.name} />
      <p>{user.bio}</p>
      <div>
        <button>Edit Profile</button>
        <button>Delete Account</button>
      </div>
    </div>
  );
}

// Good: Composed smaller components
function UserAvatar({ src, alt }) {
  return <img src={src} alt={alt} className="user-avatar" />;
}

function UserActions({ onEdit, onDelete }) {
  return (
    <div>
      <button onClick={onEdit}>Edit Profile</button>
      <button onClick={onDelete}>Delete Account</button>
    </div>
  );
}

function UserProfile({ user, onEdit, onDelete }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <UserAvatar src={user.avatar} alt={user.name} />
      <p>{user.bio}</p>
      <UserActions onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
\`\`\`

This approach makes components more reusable, testable, and maintainable.

You said: This is really helpful! Let me save this for future reference.
`,

  // Scenario 2: User wants to continue Claude conversation in ChatGPT
  CLAUDE_CONVERSATION: `# Claude Conversation - API Design Patterns
Human: I'm designing REST APIs and want to follow best practices. What are the key principles?

Assistant: Excellent topic! API design is crucial for maintainable and scalable systems. Here are the key principles:

## REST API Best Practices

### 1. Resource-Based URLs
- Use nouns, not verbs: \`/users\` not \`/getUsers\`
- Use plural nouns: \`/users\` not \`/user\`
- Nest resources logically: \`/users/123/posts\`

### 2. HTTP Methods
- GET: Retrieve resources
- POST: Create new resources
- PUT: Update entire resources
- PATCH: Partial updates
- DELETE: Remove resources

### 3. Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

### 4. Versioning
- URL versioning: \`/v1/users\`
- Header versioning: \`Accept: application/vnd.api.v1+json\`

Human: Can you show me examples of proper error responses?

Assistant: Great question! Error handling is crucial for good developer experience.

## Error Response Examples

### Validation Error (400)
\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["Must be a valid email address"],
      "password": ["Must be at least 8 characters"]
    }
  }
}
\`\`\`

### Not Found Error (404)
\`\`\`json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with ID 123 not found"
  }
}
\`\`\`

### Rate Limit Error (429)
\`\`\`json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 60 seconds",
    "retry_after": 60
  }
}
\`\`\`

These structured error responses help developers debug issues quickly.

Human: Perfect! This gives me a solid foundation for my API design. Thanks!
`,

  // Scenario 3: Developer building personal knowledge base
  KNOWLEDGE_BUILDING: `# Personal Knowledge Base - Code Patterns
You said: I want to build a personal knowledge base for coding patterns and best practices I've learned.

Assistant: That's an excellent idea! A personal knowledge base is incredibly valuable for developers. Here's how to structure it effectively:

## Knowledge Base Structure

### 1. Code Patterns
- Design patterns (Singleton, Factory, Observer)
- Algorithm implementations
- Data structure usage patterns

### 2. Best Practices
- Language-specific idioms
- Framework conventions
- Testing strategies

### 3. Lessons Learned
- Common pitfalls and solutions
- Performance optimization techniques
- Debugging approaches

### 4. Reference Materials
- API documentation snippets
- Configuration examples
- Tool usage patterns

You said: How should I organize this knowledge base?

Assistant: Organization is key! Here's a recommended structure:

## Organization Strategy

### By Technology Stack
\`\`\`
knowledge-base/
├── javascript/
│   ├── patterns/
│   ├── best-practices/
│   └── lessons-learned/
├── react/
│   ├── components/
│   ├── hooks/
│   └── state-management/
└── nodejs/
    ├── apis/
    ├── databases/
    └── deployment/
\`\`\`

### By Project Type
- Web applications
- APIs and microservices
- Mobile applications
- DevOps and deployment

### By Learning Category
- Fundamentals
- Advanced concepts
- Performance optimization
- Security practices

You said: What tools would you recommend for maintaining this knowledge base?

Assistant: Great question! Here are some excellent tools:

## Recommended Tools

### Documentation
- **Obsidian**: Local markdown files with linking
- **Notion**: Web-based with collaboration
- **GitBook**: Professional documentation sites

### Code Snippets
- **SnippetsLab**: Mac code snippet manager
- **Lepton**: Cross-platform snippet manager
- **GitHub Gist**: Public snippet sharing

### Knowledge Management
- **Roam Research**: Networked note taking
- **Zettlr**: Markdown-based knowledge management
- **TiddlyWiki**: Single-file wiki

Each tool has different strengths, so choose based on your workflow preferences.

You said: This is really comprehensive. I think I'll start with Obsidian for the documentation and SnippetsLab for code patterns.
`
};

describe('End-to-End User Workflow Tests', () => {
  beforeAll(async () => {
    // Initialize the memory container for all tests
    process.env.VALORA_SECRET_KEY = 'test-secret-key-for-e2e-testing';
    await initMemoryContainer();
  });

  afterAll(async () => {
    await clearAllMemories();
  });

  beforeEach(async () => {
    await clearAllMemories();
  });

  describe('Scenario 1: Save AI Chat Before Subscription Cancellation', () => {
    it('should complete full ChatGPT conversation preservation workflow', async () => {
      // Step 1: User copies ChatGPT conversation (simulate copy-paste)
      const copiedText = USER_SCENARIOS.CHATGPT_CONVERSATION;

      // Step 2: Parse the conversation using Valora CLI (simulated)
      const parsedData = ChatParser.parseChatGPT(copiedText, 'user-chatgpt-save');

      expect(parsedData.source).toBe('chatgpt');
      expect(parsedData.messages.length).toBeGreaterThan(2); // User + multiple assistant responses
      expect(parsedData.tags).toContain('chatgpt');

      // Step 3: Import to Valora memory system
      const importedMemories = await chatImportService.importChat(parsedData);

      expect(importedMemories.length).toBe(parsedData.messages.length);
      expect(importedMemories[0].participant).toBe('user');
      expect(importedMemories[1].participant).toBe('assistant');

      // Step 4: Verify conversation is stored and searchable
      const searchResults = await searchMemories('React best practices');
      expect(searchResults.length).toBeGreaterThan(0);

      // Step 5: Export conversation for backup
      const exportedContent = exportService.formatMemories(importedMemories, 'conversation');
      expect(exportedContent).toContain('Conversation:');
      expect(exportedContent).toContain('React Best Practices');
      expect(exportedContent).toContain('Component Composition');

      console.log('✅ ChatGPT conversation successfully preserved and exported');
    });

    it('should handle subscription cancellation scenario with multiple conversations', async () => {
      // Simulate user saving multiple conversations before cancellation
      const conversations = [
        { text: USER_SCENARIOS.CHATGPT_CONVERSATION, id: 'react-patterns' },
        { text: USER_SCENARIOS.CLAUDE_CONVERSATION, id: 'api-design' }
      ];

      const allImportedMemories: Memory[] = [];

      for (const conv of conversations) {
        const parsed = ChatParser.parse(conv.text.includes('ChatGPT') ?
          ChatParser.parseChatGPT(conv.text, conv.id) :
          ChatParser.parseClaude(conv.text, conv.id)
        );
        const memories = await chatImportService.importChat(parsed);
        allImportedMemories.push(...memories);
      }

      // Verify all conversations are preserved
      expect(allImportedMemories.length).toBeGreaterThan(4);

      // Export all memories as backup
      const backupExport = exportService.formatMemories(allImportedMemories, 'json');
      const backupData = JSON.parse(backupExport);
      expect(backupData.length).toBe(allImportedMemories.length);

      console.log('✅ Multiple conversations backed up before subscription cancellation');
    });
  });

  describe('Scenario 2: Cross-Platform Conversation Continuation', () => {
    it('should enable ChatGPT to Claude conversation continuation', async () => {
      // Step 1: Import original ChatGPT conversation
      const chatgptData = ChatParser.parseChatGPT(USER_SCENARIOS.CHATGPT_CONVERSATION);
      const chatgptMemories = await chatImportService.importChat(chatgptData);

      // Step 2: Export in format suitable for Claude
      const claudeCompatibleExport = exportService.formatMemories(chatgptMemories, 'conversation');

      // Verify export format is Claude-compatible
      expect(claudeCompatibleExport).toContain('Assistant:');
      expect(claudeCompatibleExport).toContain('Component Composition');
      expect(claudeCompatibleExport).toContain('State Management');

      // Step 3: Simulate importing into Claude and continuing
      const claudeContinuation = ChatParser.parseGeneric(
        claudeCompatibleExport + '\n\nHuman: Can you elaborate on the performance optimization techniques?\n\nAssistant: Certainly! Here are some key performance optimization techniques...',
        'claude-continuation'
      );

      const claudeMemories = await chatImportService.importChat(claudeContinuation);

      // Verify continuation includes both original and new content
      expect(claudeMemories.length).toBeGreaterThan(chatgptMemories.length);
      expect(claudeMemories.some(m => m.content.includes('performance optimization'))).toBe(true);

      console.log('✅ ChatGPT to Claude conversation continuation successful');
    });

    it('should enable Claude to ChatGPT conversation continuation', async () => {
      // Step 1: Import original Claude conversation
      const claudeData = ChatParser.parseClaude(USER_SCENARIOS.CLAUDE_CONVERSATION);
      const claudeMemories = await chatImportService.importChat(claudeData);

      // Step 2: Export in format suitable for ChatGPT
      const chatgptCompatibleExport = exportService.formatMemories(claudeMemories, 'conversation');

      // Verify export format is ChatGPT-compatible
      expect(chatgptCompatibleExport).toContain('Assistant:');
      expect(chatgptCompatibleExport).toContain('Resource-Based URLs');
      expect(chatgptCompatibleExport).toContain('HTTP Methods');

      // Step 3: Simulate continuing in ChatGPT
      const chatgptContinuation = ChatParser.parseGeneric(
        chatgptCompatibleExport + '\n\nYou said: How about authentication best practices?\n\nAssistant: Great topic! Here are some authentication best practices...',
        'chatgpt-continuation'
      );

      const chatgptMemories = await chatImportService.importChat(chatgptContinuation);

      // Verify continuation includes both original and new content
      expect(chatgptMemories.length).toBeGreaterThan(claudeMemories.length);
      expect(chatgptMemories.some(m => m.content.includes('authentication best practices'))).toBe(true);

      console.log('✅ Claude to ChatGPT conversation continuation successful');
    });
  });

  describe('Scenario 3: MCP Server Integration Workflow', () => {
    it('should support Cursor.ai MCP integration for memory management', async () => {
      // Step 1: Import development knowledge
      const knowledgeData = ChatParser.parseChatGPT(USER_SCENARIOS.KNOWLEDGE_BUILDING);
      const knowledgeMemories = await chatImportService.importChat(knowledgeData);

      // Step 2: Simulate MCP server queries (what Cursor.ai would do)
      const searchQueries = [
        'knowledge base organization',
        'code patterns',
        'best practices',
        'Obsidian',
        'SnippetsLab'
      ];

      for (const query of searchQueries) {
        const results = await searchMemories(query);
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(r => r.content.toLowerCase().includes(query.split(' ')[0]))).toBe(true);
      }

      // Step 3: Simulate adding new knowledge via MCP
      const newKnowledge = {
        conversationId: 'mcp-knowledge-addition',
        messages: [{
          participant: 'user',
          content: 'Adding new knowledge: Always use TypeScript interfaces over types for public APIs',
          timestamp: new Date()
        }],
        source: 'cursor-mcp',
        tags: ['typescript', 'best-practices', 'mcp-integration']
      };

      const addedMemories = await chatImportService.importChat(newKnowledge);

      // Verify new knowledge is searchable
      const interfaceResults = await searchMemories('TypeScript interfaces');
      expect(interfaceResults.length).toBeGreaterThan(0);

      console.log('✅ MCP server integration workflow validated');
    });

    it('should handle MCP protocol compliance for memory operations', async () => {
      // Step 1: Test MCP-style memory creation
      const mcpMemory = {
        conversationId: 'mcp-protocol-test',
        messages: [{
          participant: 'assistant',
          content: 'MCP Protocol Test: Memory created via Cursor.ai integration',
          timestamp: new Date()
        }],
        source: 'cursor-mcp',
        tags: ['mcp', 'protocol', 'integration']
      };

      const createdMemories = await chatImportService.importChat(mcpMemory);
      expect(createdMemories[0].source).toBe('cursor-mcp');

      // Step 2: Test MCP-style memory retrieval
      const retrievedMemories = await searchMemories('MCP Protocol Test');
      expect(retrievedMemories.length).toBeGreaterThan(0);

      // Step 3: Test MCP-style memory export
      const mcpExport = exportService.formatMemories(createdMemories, 'json');
      const mcpData = JSON.parse(mcpExport);
      expect(mcpData[0].source).toBe('cursor-mcp');

      console.log('✅ MCP protocol compliance validated');
    });
  });

  describe('Scenario 4: CLI Memory Management Workflow', () => {
    it('should support complete CLI-based memory management', async () => {
      // Step 1: Import conversation via CLI (simulated)
      const conversationData = ChatParser.parseChatGPT(USER_SCENARIOS.CHATGPT_CONVERSATION);
      const importedMemories = await chatImportService.importChat(conversationData);

      // Step 2: Simulate CLI search operations
      const searchCommands = [
        'React',
        'component composition',
        'state management',
        'performance'
      ];

      for (const term of searchCommands) {
        const results = await searchMemories(term);
        expect(results.length).toBeGreaterThan(0);
      }

      // Step 3: Simulate CLI export operations
      const exportFormats = ['json', 'markdown', 'conversation'] as const;

      for (const format of exportFormats) {
        const exported = exportService.formatMemories(importedMemories, format);

        if (format === 'json') {
          const parsed = JSON.parse(exported);
          expect(Array.isArray(parsed)).toBe(true);
        } else if (format === 'conversation') {
          expect(exported).toContain('Conversation:');
          expect(exported).toContain('User:');
          expect(exported).toContain('Assistant:');
        }
      }

      // Step 4: Simulate CLI tagging and organization
      const taggedMemory = {
        conversationId: 'cli-tagged-memory',
        messages: [{
          participant: 'user',
          content: 'CLI-tagged memory for React hooks best practices',
          timestamp: new Date()
        }],
        source: 'cli-import',
        tags: ['react', 'hooks', 'best-practices', 'cli-managed']
      };

      const taggedMemories = await chatImportService.importChat(taggedMemory);

      // Verify CLI tagging worked
      const tagSearch = await searchMemories('cli-managed');
      expect(tagSearch.length).toBeGreaterThan(0);

      console.log('✅ CLI memory management workflow validated');
    });

    it('should handle CLI batch operations and workflow automation', async () => {
      // Step 1: Simulate batch import (multiple conversations)
      const batchConversations = [
        { text: USER_SCENARIOS.CHATGPT_CONVERSATION, id: 'batch-1', source: 'chatgpt' },
        { text: USER_SCENARIOS.CLAUDE_CONVERSATION, id: 'batch-2', source: 'claude' },
        { text: USER_SCENARIOS.KNOWLEDGE_BUILDING, id: 'batch-3', source: 'chatgpt' }
      ];

      const allBatchMemories: Memory[] = [];

      for (const conv of batchConversations) {
        const parsed = conv.source === 'chatgpt' ?
          ChatParser.parseChatGPT(conv.text, conv.id) :
          ChatParser.parseClaude(conv.text, conv.id);

        const memories = await chatImportService.importChat(parsed);
        allBatchMemories.push(...memories);
      }

      // Step 2: Simulate CLI bulk search
      const bulkSearchResults = await searchMemories('best practices');
      expect(bulkSearchResults.length).toBeGreaterThan(2); // Should find matches in multiple conversations

      // Step 3: Simulate CLI bulk export
      const bulkExport = exportService.formatMemories(allBatchMemories, 'json');
      const bulkData = JSON.parse(bulkExport);
      expect(bulkData.length).toBe(allBatchMemories.length);

      // Step 4: Simulate CLI cleanup operations
      const cleanupResults = await searchMemories('React');
      expect(cleanupResults.length).toBeGreaterThan(0);

      console.log('✅ CLI batch operations and workflow automation validated');
    });
  });

  describe('Scenario 5: Personal Knowledge Base Building', () => {
    it('should support comprehensive knowledge base construction', async () => {
      // Step 1: Import various types of knowledge
      const knowledgeSources = [
        {
          text: USER_SCENARIOS.KNOWLEDGE_BUILDING,
          tags: ['knowledge-management', 'organization', 'tools'],
          category: 'meta-knowledge'
        },
        {
          text: USER_SCENARIOS.CHATGPT_CONVERSATION,
          tags: ['react', 'frontend', 'best-practices'],
          category: 'technical'
        },
        {
          text: USER_SCENARIOS.CLAUDE_CONVERSATION,
          tags: ['api-design', 'backend', 'rest'],
          category: 'technical'
        }
      ];

      const knowledgeBase: Memory[] = [];

      for (const source of knowledgeSources) {
        const parsed = ChatParser.parseChatGPT(source.text, `kb-${source.category}-${Date.now()}`);
        parsed.tags = [...(parsed.tags || []), ...source.tags];
        const memories = await chatImportService.importChat(parsed);
        knowledgeBase.push(...memories);
      }

      // Step 2: Test knowledge base search capabilities
      const searchCategories = [
        { query: 'knowledge base organization', expected: true },
        { query: 'React component', expected: true },
        { query: 'API design patterns', expected: true },
        { query: 'Obsidian', expected: true },
        { query: 'HTTP methods', expected: true }
      ];

      for (const { query, expected } of searchCategories) {
        const results = await searchMemories(query);
        if (expected) {
          expect(results.length).toBeGreaterThan(0);
        }
      }

      // Step 3: Test knowledge base organization by tags
      const tagQueries = ['react', 'api-design', 'knowledge-management'];

      for (const tag of tagQueries) {
        const tagResults = await searchMemories(tag);
        expect(tagResults.length).toBeGreaterThan(0);
        expect(tagResults.every(r => r.tags.includes(tag))).toBe(true);
      }

      // Step 4: Test knowledge export for documentation
      const documentationExport = exportService.formatMemories(knowledgeBase, 'markdown');
      expect(documentationExport).toContain('---');
      expect(documentationExport).toContain('**Source:**');
      expect(documentationExport).toContain('**Timestamp:**');

      console.log('✅ Personal knowledge base construction validated');
    });

    it('should enable knowledge discovery and cross-referencing', async () => {
      // Step 1: Build interconnected knowledge
      const interconnectedKnowledge = [
        {
          id: 'kb-concepts',
          text: `You said: I want to understand the relationship between React, TypeScript, and API design.

Assistant: Excellent question! These technologies work together beautifully:

## Technology Relationships

### React + TypeScript
- TypeScript provides type safety for React components
- Better IDE support and refactoring
- Compile-time error catching
- Enhanced developer experience

### React + APIs
- React handles UI state and user interactions
- APIs provide data and business logic
- RESTful design patterns for clean separation
- Error handling and loading states

### TypeScript + APIs
- Type-safe API responses
- Compile-time validation of data structures
- Better error handling with typed errors
- Improved API documentation

You said: Can you show me a practical example combining all three?`
        },
        {
          id: 'kb-practical',
          text: `You said: Show me a practical example combining React, TypeScript, and API design.

Assistant: Here's a complete example:

\`\`\`typescript
// types/api.ts
interface User {
  id: number;
  name: string;
  email: string;
}

// types/component.ts
interface UserProfileProps {
  userId: number;
  onError: (error: Error) => void;
}

// API service
class UserAPI {
  static async getUser(id: number): Promise<User> {
    const response = await fetch(\`/api/users/\${id}\`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  }
}

// React component
const UserProfile: React.FC<UserProfileProps> = ({ userId, onError }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await UserAPI.getUser(userId);
        setUser(userData);
      } catch (error) {
        onError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, onError]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

export default UserProfile;
\`\`\`

This example shows:
- TypeScript interfaces for type safety
- Clean API service layer
- React component with proper error handling
- Separation of concerns between UI and data layers`
        }
      ];

      // Import interconnected knowledge
      const knowledgeMemories: Memory[] = [];
      for (const knowledge of interconnectedKnowledge) {
        const parsed = ChatParser.parseChatGPT(knowledge.text, knowledge.id);
        const memories = await chatImportService.importChat(parsed);
        knowledgeMemories.push(...memories);
      }

      // Step 2: Test cross-referencing capabilities
      const crossReferenceQueries = [
        'React TypeScript',
        'API design patterns',
        'error handling',
        'separation of concerns'
      ];

      for (const query of crossReferenceQueries) {
        const results = await searchMemories(query);
        expect(results.length).toBeGreaterThan(0);
      }

      // Step 3: Test knowledge synthesis (combining related concepts)
      const synthesisQuery = 'practical example';
      const synthesisResults = await searchMemories(synthesisQuery);
      expect(synthesisResults.length).toBeGreaterThan(0);

      // Verify synthesis includes both conceptual and practical knowledge
      const allContent = synthesisResults.map(r => r.content).join(' ');
      expect(allContent).toMatch(/interface|async|useState/i);

      console.log('✅ Knowledge discovery and cross-referencing validated');
    });
  });

  describe('Performance and Scalability Validation', () => {
    it('should handle multiple large conversations efficiently', async () => {
      const startTime = Date.now();

      // Import multiple substantial conversations
      const largeConversations = [
        USER_SCENARIOS.CHATGPT_CONVERSATION,
        USER_SCENARIOS.CLAUDE_CONVERSATION,
        USER_SCENARIOS.KNOWLEDGE_BUILDING
      ];

      const allMemories: Memory[] = [];
      for (let i = 0; i < largeConversations.length; i++) {
        const parsed = ChatParser.parseChatGPT(largeConversations[i], `perf-test-${i}`);
        const memories = await chatImportService.importChat(parsed);
        allMemories.push(...memories);
      }

      const importTime = Date.now() - startTime;
      expect(importTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(allMemories.length).toBeGreaterThan(10);

      // Test search performance on large dataset
      const searchStartTime = Date.now();
      const searchResults = await searchMemories('best practices');
      const searchTime = Date.now() - searchStartTime;

      expect(searchTime).toBeLessThan(1000); // Search should be sub-second
      expect(searchResults.length).toBeGreaterThan(0);

      console.log(`✅ Performance test passed: ${allMemories.length} memories processed in ${importTime}ms`);
    });

    it('should maintain data integrity across operations', async () => {
      // Step 1: Import conversation with known structure
      const originalData = ChatParser.parseChatGPT(USER_SCENARIOS.CHATGPT_CONVERSATION);
      const originalMemories = await chatImportService.importChat(originalData);

      // Step 2: Verify data integrity after import
      expect(originalMemories[0].conversationId).toBe(originalData.conversationId);
      expect(originalMemories[0].source).toBe('chatgpt');
      expect(originalMemories[0].participant).toBe('user');

      // Step 3: Export and re-import to test round-trip integrity
      const exportedData = exportService.formatMemories(originalMemories, 'json');
      const reimportedMemories = await chatImportService.importFromFormat(
        exportedData,
        'json',
        'round-trip-test',
        'round-trip-conversation'
      );

      // Step 4: Verify data integrity after round-trip
      expect(reimportedMemories.length).toBe(originalMemories.length);
      expect(reimportedMemories[0].content).toBe(originalMemories[0].content);
      expect(reimportedMemories[0].participant).toBe(originalMemories[0].participant);

      console.log('✅ Data integrity maintained across import/export operations');
    });
