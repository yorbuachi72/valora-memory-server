import { chatImportService } from './service.js';
import { ChatMessage } from '../types/memory.js';

// Mock the storage service
jest.mock('../storage/container.js', () => ({
  saveMemory: jest.fn().mockResolvedValue(undefined),
  getConversationContext: jest.fn().mockResolvedValue([]),
}));

describe('Chat Import Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('importChat', () => {
    it('should import chat messages as individual memories', async () => {
      const messages: ChatMessage[] = [
        {
          participant: 'user',
          content: 'Hello, how are you?',
          timestamp: new Date('2023-01-01T10:00:00Z'),
        },
        {
          participant: 'assistant',
          content: 'I am doing well, thank you!',
          timestamp: new Date('2023-01-01T10:01:00Z'),
        },
      ];

      const chatData = {
        conversationId: 'test-conversation',
        messages,
        source: 'test-chat',
        tags: ['test', 'chat']
      };

      const result = await chatImportService.importChat(chatData);
      
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Hello, how are you?');
      expect(result[1].content).toBe('I am doing well, thank you!');
    });
  });
}); 