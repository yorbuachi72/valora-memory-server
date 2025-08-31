import { exportService } from './service.js';
import { Memory } from '../types/memory.js';

describe('Export Service', () => {
  const memories: Memory[] = [
    {
      id: '1',
      content: 'This is the first memory.',
      source: 'test-source-1',
      timestamp: new Date('2023-01-01T12:00:00.000Z'),
      version: 1,
      tags: [],
      metadata: {},
    },
    {
      id: '2',
      content: 'This is the second memory.',
      source: 'test-source-2',
      timestamp: new Date('2023-01-02T12:00:00.000Z'),
      version: 1,
      tags: [],
      metadata: {},
    },
  ];

  const chatMemories: Memory[] = [
    {
      id: '1',
      content: 'Hello, how are you?',
      source: 'test-chat',
      timestamp: new Date('2023-01-01T12:00:00.000Z'),
      version: 1,
      tags: ['chat'],
      metadata: {},
      contentType: 'chat',
      conversationId: 'conv-1',
      participant: 'user',
    },
    {
      id: '2',
      content: 'I am doing well, thank you!',
      source: 'test-chat',
      timestamp: new Date('2023-01-01T12:01:00.000Z'),
      version: 1,
      tags: ['chat'],
      metadata: {},
      contentType: 'chat',
      conversationId: 'conv-1',
      participant: 'assistant',
    },
  ];

  it('should format memories to Markdown correctly', () => {
    const markdownOutput = exportService.formatMemories(memories, 'markdown');

    expect(markdownOutput).toContain('**Source:** test-source-1');
    expect(markdownOutput).toContain('2023-01-01T12:00:00.000Z');
    expect(markdownOutput).toContain('This is the first memory.');
    expect(markdownOutput).toContain('---');
    expect(markdownOutput).toContain('**Source:** test-source-2');
  });

  it('should format memories to plain text correctly', () => {
    const textOutput = exportService.formatMemories(memories, 'text');

    expect(textOutput).toContain('Source: test-source-1');
    expect(textOutput).toContain('2023-01-02T12:00:00.000Z');
    expect(textOutput).toContain('This is the second memory.');
    expect(textOutput).toContain('----------------------------------------');
  });

  it('should format chat memories with participant information', () => {
    const markdownOutput = exportService.formatMemories(chatMemories, 'markdown');

    expect(markdownOutput).toContain('**Participant:** user');
    expect(markdownOutput).toContain('**Participant:** assistant');
    expect(markdownOutput).toContain('**Conversation:** conv-1');
  });

  it('should format to JSON correctly', () => {
    const jsonOutput = exportService.formatMemories(memories, 'json');
    const parsed = JSON.parse(jsonOutput);
    
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe('1');
    expect(parsed[1].id).toBe('2');
  });

  it('should format to conversation format correctly', () => {
    const conversationOutput = exportService.formatMemories(chatMemories, 'conversation');
    
    expect(conversationOutput).toContain('Conversation: conv-1');
    expect(conversationOutput).toContain('user:');
    expect(conversationOutput).toContain('assistant:');
    expect(conversationOutput).toContain('Hello, how are you?');
    expect(conversationOutput).toContain('I am doing well, thank you!');
  });

  it('should default to Markdown format', () => {
    const defaultOutput = exportService.formatMemories(memories);
    const markdownOutput = exportService.formatMemories(memories, 'markdown');
    expect(defaultOutput).toBe(markdownOutput);
  });

  it('should throw error for unsupported format', () => {
    expect(() => {
      exportService.formatMemories(memories, 'unsupported' as any);
    }).toThrow('Unsupported format: unsupported');
  });
}); 