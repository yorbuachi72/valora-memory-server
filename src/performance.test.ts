import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ChatParser } from './chat/parser.js';
import { chatImportService } from './chat/service.js';
import { exportService } from './export/service.js';
import { initMemoryContainer, clearAllMemories, searchMemories, saveMemory } from './storage/container.js';
import { Memory } from './types/memory.js';
import { randomUUID } from 'crypto';

// Performance test data
const LARGE_CHATGPT_CONVERSATION = `# ChatGPT Conversation - Large Test Data

Assistant: I'm a helpful AI assistant that can help you with various tasks. What would you like to know?

Human: Can you explain the concept of machine learning in simple terms?

Assistant: Machine learning is a type of artificial intelligence where computers learn from data without being explicitly programmed. Instead of writing specific instructions for every possible scenario, we feed the computer lots of examples, and it finds patterns to make predictions or decisions.

There are three main types of machine learning:
1. Supervised learning - learning from labeled examples
2. Unsupervised learning - finding patterns in unlabeled data
3. Reinforcement learning - learning through trial and error with rewards

Human: That's helpful! Can you give me a practical example?

Assistant: A great example of supervised learning is email spam detection. The algorithm is trained on thousands of emails that are labeled as "spam" or "not spam." It learns to recognize patterns like certain words, sender domains, or email structures that indicate spam.

Another example is recommendation systems like Netflix or Amazon. These systems learn your preferences based on what you've watched or purchased, and they recommend similar content.

Human: How does this relate to natural language processing?

Assistant: Natural Language Processing (NLP) is a field that combines machine learning with linguistics to help computers understand and generate human language. Machine learning algorithms are used in NLP for:

- Text classification (sentiment analysis, topic detection)
- Named entity recognition (finding names, dates, locations in text)
- Machine translation
- Chatbots and conversational AI
- Text summarization

For instance, the technology powering me (GPT) uses machine learning techniques to understand context, generate coherent responses, and maintain conversation flow.

Human: This is fascinating. Can you explain how neural networks work?

Assistant: Neural networks are inspired by the human brain's structure. They consist of layers of interconnected nodes (neurons) that process information.

Here's a simplified explanation:

1. **Input Layer**: Receives the raw data (like pixels in an image or words in a sentence)

2. **Hidden Layers**: Process the information through mathematical transformations. Each connection has a "weight" that gets adjusted during training.

3. **Output Layer**: Produces the final result (like classifying an image or generating text)

The network learns by:
- Making predictions
- Comparing predictions to correct answers
- Adjusting the connection weights to reduce errors
- Repeating this process many times

Human: What are some real-world applications of these technologies?

Assistant: Here are some impactful applications:

**Healthcare:**
- Disease diagnosis from medical images
- Drug discovery and personalized medicine
- Predicting patient outcomes

**Finance:**
- Fraud detection
- Algorithmic trading
- Credit risk assessment
- Automated customer service

**Transportation:**
- Self-driving cars
- Route optimization
- Predictive maintenance

**Entertainment:**
- Content recommendation
- Video game AI
- Music and art generation

**Education:**
- Personalized learning platforms
- Automated grading
- Language learning apps

These technologies are already transforming many industries and will continue to create new opportunities and challenges.

Human: How can someone get started in machine learning?

Assistant: Getting started in machine learning is easier than ever! Here's a practical roadmap:

**1. Build Foundation (1-2 months):**
- Learn Python programming
- Study statistics and linear algebra basics
- Understand data structures and algorithms

**2. Learn Core Concepts (2-3 months):**
- Online courses: Coursera, edX, Udacity
- Books: "Hands-On Machine Learning" by Aurélien Géron
- Practice with small datasets

**3. Get Hands-On Experience (ongoing):**
- Work on personal projects
- Participate in Kaggle competitions
- Contribute to open-source ML projects

**4. Specialize (3-6 months):**
- Choose focus area: computer vision, NLP, reinforcement learning
- Learn specialized tools and frameworks
- Build portfolio projects

**5. Stay Current:**
- Follow research papers on arXiv
- Join ML communities on Reddit, Discord
- Attend conferences and meetups

Remember: consistency is key. Start with simple projects and gradually increase complexity. Don't worry about understanding everything at first - learning is iterative!

Human: Thank you for this comprehensive overview. I feel much more confident about exploring machine learning now.

Assistant: You're very welcome! I'm glad I could help clarify these concepts. Machine learning is an exciting field with tremendous potential. Feel free to ask if you have more specific questions as you begin your learning journey. Good luck!`;

// Generate multiple test users for concurrent load testing
const generateTestUsers = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    email: `user${i + 1}@test.com`,
    name: `Test User ${i + 1}`
  }));
};

// Performance test scenarios
const PERFORMANCE_SCENARIOS = {
  SMALL_CONVERSATION: `# Small Chat
Assistant: Hello!
Human: Hi there!
Assistant: How can I help you?`,

  MEDIUM_CONVERSATION: `# Medium Chat
Assistant: I'm here to help with your questions about technology.
Human: Can you explain APIs?
Assistant: APIs (Application Programming Interfaces) are sets of rules and protocols that allow different software applications to communicate with each other.
Human: That's helpful. Can you give an example?
Assistant: A common example is the Google Maps API. When you use a ride-sharing app like Uber, it uses the Google Maps API to display maps and calculate routes without having to build its own mapping system.`,

  LARGE_CONVERSATION: LARGE_CHATGPT_CONVERSATION
};

describe('Performance Validation Tests', () => {
  jest.setTimeout(20000); // Set global timeout for performance tests
  beforeAll(async () => {
    process.env.VALORA_SECRET_KEY = 'test-performance-key-12345678901234567890';
    await initMemoryContainer();
  });

  afterAll(async () => {
    await clearAllMemories();
  });

  describe('Concurrent User Load Testing', () => {
    it('should handle 10 concurrent users importing conversations within 5 seconds', async () => {
      const startTime = Date.now();
      const users = generateTestUsers(10);
      const importPromises = users.map(async (user) => {
        const parsedData = ChatParser.parseChatGPT(PERFORMANCE_SCENARIOS.MEDIUM_CONVERSATION);
        parsedData.source = `${parsedData.source}-${user.id}`;
        return chatImportService.importChat(parsedData);
      });

      const results = await Promise.all(importPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000); // 5 seconds max
      expect(results.length).toBe(10);
      results.forEach(memories => {
        expect(memories.length).toBeGreaterThan(0);
      });

      console.log(`✅ 10 concurrent users completed in ${totalTime}ms`);
    });

    it('should handle 50 concurrent users with mixed conversation sizes within 15 seconds', async () => {
      const startTime = Date.now();
      const users = generateTestUsers(50);

      const importPromises = users.map(async (user, index) => {
        let conversation = PERFORMANCE_SCENARIOS.MEDIUM_CONVERSATION;
        if (index % 3 === 0) conversation = PERFORMANCE_SCENARIOS.SMALL_CONVERSATION;
        if (index % 7 === 0) conversation = PERFORMANCE_SCENARIOS.LARGE_CONVERSATION;

        const parsedData = ChatParser.parseChatGPT(conversation);
        parsedData.source = `${parsedData.source}-${user.id}`;
        return chatImportService.importChat(parsedData);
      });

      const results = await Promise.all(importPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(10000); // 10 seconds max
      expect(results.length).toBe(50);
      const totalMemories = results.reduce((sum, memories) => sum + memories.length, 0);
      expect(totalMemories).toBeGreaterThan(100); // At least 100 memories created

      console.log(`✅ 50 concurrent users completed in ${totalTime}ms, created ${totalMemories} memories`);
    });
  });

  describe('Memory Operations Performance', () => {
    it('should perform 100 memory saves within 2 seconds', async () => {
      const startTime = Date.now();

      const savePromises = Array.from({ length: 100 }, async (_, i) => {
        const memory: Memory = {
          id: randomUUID(),
          content: `Test memory content ${i} for performance testing`,
          source: 'performance-test',
          timestamp: new Date(),
          version: 1,
          tags: ['test', 'performance']
        };
        return saveMemory(memory);
      });

      await Promise.all(savePromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(3000); // 3 seconds max
      console.log(`✅ 100 memory saves completed in ${totalTime}ms`);
    });

    it('should perform 50 search operations within 3 seconds', async () => {
      const startTime = Date.now();

      // Create test data first
      const createPromises = Array.from({ length: 50 }, async (_, i) => {
        const memory: Memory = {
          id: randomUUID(),
          content: `Searchable content ${i} with unique identifier ${randomUUID()}`,
          source: 'search-test',
          timestamp: new Date(),
          version: 1,
          tags: [`tag-${i}`, 'search-test']
        };
        return saveMemory(memory);
      });

      await Promise.all(createPromises);

      // Perform searches
      const searchPromises = Array.from({ length: 50 }, async (_, i) => {
        return searchMemories(`content ${i}`);
      });

      const searchResults = await Promise.all(searchPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(3000); // 3 seconds max
      expect(searchResults.length).toBe(50);
      searchResults.forEach(results => {
        expect(Array.isArray(results)).toBe(true);
      });

      console.log(`✅ 50 search operations completed in ${totalTime}ms`);
    });
  });

  describe('Export Performance', () => {
    it('should export 100 memories within 3 seconds', async () => {
      // Create test data
      const createPromises = Array.from({ length: 100 }, async (_, i) => {
        const memory: Memory = {
          id: randomUUID(),
          content: `Export test content ${i} with some additional text to make it more realistic`,
          source: 'export-test',
          timestamp: new Date(),
          version: 1,
          tags: ['export', 'test', `batch-${Math.floor(i / 10)}`]
        };
        return saveMemory(memory);
      });

      await Promise.all(createPromises);

      const startTime = Date.now();
      // Get all memories by searching for a common term
      const allMemories = await searchMemories('Export test content');
      const exportedContent = exportService.formatMemories(
        allMemories.filter(m => m.source === 'export-test'),
        'conversation'
      );
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(3000); // 3 seconds max
      expect(allMemories.length).toBeGreaterThan(90); // Should find most memories
      expect(exportedContent.length).toBeGreaterThan(1000); // Substantial content
      expect(exportedContent).toContain('Conversation:');

      console.log(`✅ ${allMemories.length} memory export completed in ${totalTime}ms, generated ${exportedContent.length} characters`);
    });
  });

  describe('Memory Usage and Resource Efficiency', () => {
    it('should maintain reasonable memory usage during heavy operations', async () => {
      const initialMemoryUsage = process.memoryUsage().heapUsed;

      // Perform intensive operations
      const operations = Array.from({ length: 25 }, async () => {
        const parsedData = ChatParser.parseChatGPT(PERFORMANCE_SCENARIOS.LARGE_CONVERSATION);
        return chatImportService.importChat(parsedData);
      });

      await Promise.all(operations);

      const finalMemoryUsage = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemoryUsage - initialMemoryUsage;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be reasonable (less than 100MB for this test)
      expect(memoryIncreaseMB).toBeLessThan(100);

      console.log(`✅ Memory usage: ${memoryIncreaseMB.toFixed(2)}MB increase`);
    });
  });

  describe('Realistic User Journey Performance', () => {
    it('should complete full user journey within acceptable time', async () => {
      const journeyStart = Date.now();

      // Step 1: Import conversation
      const importStart = Date.now();
      const parsedData = ChatParser.parseChatGPT(PERFORMANCE_SCENARIOS.MEDIUM_CONVERSATION);
      const importedMemories = await chatImportService.importChat(parsedData);
      const importTime = Date.now() - importStart;

      // Step 2: Search for memories
      const searchStart = Date.now();
      const searchResults = await searchMemories('API');
      const searchTime = Date.now() - searchStart;

      // Step 3: Export conversation
      const exportStart = Date.now();
      const exportedContent = exportService.formatMemories(importedMemories, 'conversation');
      const exportTime = Date.now() - exportStart;

      const totalJourneyTime = Date.now() - journeyStart;

      // Performance expectations
      expect(importTime).toBeLessThan(1000); // 1 second
      expect(searchTime).toBeLessThan(500); // 0.5 seconds
      expect(exportTime).toBeLessThan(500); // 0.5 seconds
      expect(totalJourneyTime).toBeLessThan(2000); // 2 seconds total

      console.log(`✅ User journey completed in ${totalJourneyTime}ms:`);
      console.log(`   - Import: ${importTime}ms`);
      console.log(`   - Search: ${searchTime}ms`);
      console.log(`   - Export: ${exportTime}ms`);
    });
  });
});
