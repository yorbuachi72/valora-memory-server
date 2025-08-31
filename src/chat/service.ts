import { saveMemory, getConversationContext } from '../storage/container.js';
import { Memory, ChatImportRequest, ChatMessage } from '../types/memory.js';
import { randomUUID } from 'crypto';

class ChatImportService {
  /**
   * Import a complete chat conversation as individual memories
   */
  async importChat(chatData: ChatImportRequest): Promise<Memory[]> {
    const memories: Memory[] = [];
    
    for (const message of chatData.messages) {
      const memory: Memory = {
        id: randomUUID(),
        content: message.content,
        source: chatData.source,
        timestamp: message.timestamp,
        version: 1,
        tags: [...(chatData.tags || []), 'chat', 'conversation'],
        metadata: {
          ...chatData.metadata,
          conversationId: chatData.conversationId,
          participant: message.participant,
          messageIndex: chatData.messages.indexOf(message),
          totalMessages: chatData.messages.length,
        },
        contentType: 'chat',
        conversationId: chatData.conversationId,
        participant: message.participant,
        context: chatData.context,
      };
      
      await saveMemory(memory);
      memories.push(memory);
    }
    
    return memories;
  }

  /**
   * Import chat content from various formats (JSON, text, etc.)
   */
  async importFromFormat(
    content: string, 
    format: 'json' | 'text' | 'markdown',
    source: string,
    conversationId?: string
  ): Promise<Memory[]> {
    switch (format) {
      case 'json':
        return this.importFromJSON(content, source, conversationId);
      case 'text':
        return this.importFromText(content, source, conversationId);
      case 'markdown':
        return this.importFromMarkdown(content, source, conversationId);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async importFromJSON(
    jsonContent: string, 
    source: string, 
    conversationId?: string
  ): Promise<Memory[]> {
    try {
      const data = JSON.parse(jsonContent);
      
      // Handle different JSON formats
      if (Array.isArray(data)) {
        // Assume array of messages
        const messages: ChatMessage[] = data.map((msg, index) => ({
          participant: msg.participant || msg.role || 'unknown',
          content: msg.content || msg.message || msg.text,
          timestamp: new Date(msg.timestamp || Date.now()),
        }));
        
        return this.importChat({
          conversationId: conversationId || randomUUID(),
          messages,
          source,
          tags: ['imported', 'json'],
        });
      } else if (data.messages && Array.isArray(data.messages)) {
        // Standard chat format
        const messages: ChatMessage[] = data.messages.map((msg: any) => ({
          participant: msg.participant || msg.role || 'unknown',
          content: msg.content || msg.message || msg.text,
          timestamp: new Date(msg.timestamp || Date.now()),
        }));
        
        return this.importChat({
          conversationId: conversationId || data.conversationId || randomUUID(),
          messages,
          source,
          tags: [...(data.tags || []), 'imported', 'json'],
          metadata: data.metadata,
          context: data.context,
        });
      } else {
        // Single message or unknown format
        const memory: Memory = {
          id: randomUUID(),
          content: JSON.stringify(data),
          source,
          timestamp: new Date(),
          version: 1,
          tags: ['imported', 'json', 'unknown-format'],
          metadata: { originalData: data },
          contentType: 'chat',
          conversationId: conversationId || randomUUID(),
        };
        
        await saveMemory(memory);
        return [memory];
      }
    } catch (error) {
      throw new Error(`Failed to parse JSON content: ${error}`);
    }
  }

  private async importFromText(
    textContent: string, 
    source: string, 
    conversationId?: string
  ): Promise<Memory[]> {
    // Simple text parsing - split by lines and assume alternating participants
    const lines = textContent.split('\n').filter(line => line.trim());
    const messages: ChatMessage[] = [];
    
    let currentParticipant = 'user';
    let currentContent = '';
    
    for (const line of lines) {
      if (line.startsWith('User:') || line.startsWith('Assistant:') || line.startsWith('Human:') || line.startsWith('AI:')) {
        // Save previous message if exists
        if (currentContent.trim()) {
          messages.push({
            participant: currentParticipant,
            content: currentContent.trim(),
            timestamp: new Date(),
          });
        }
        
        // Start new message
        currentParticipant = line.startsWith('User:') || line.startsWith('Human:') ? 'user' : 'assistant';
        currentContent = line.substring(line.indexOf(':') + 1).trim();
      } else {
        // Continue current message
        currentContent += '\n' + line;
      }
    }
    
    // Add final message
    if (currentContent.trim()) {
      messages.push({
        participant: currentParticipant,
        content: currentContent.trim(),
        timestamp: new Date(),
      });
    }
    
    if (messages.length === 0) {
      // If no structured messages found, treat as single memory
      const memory: Memory = {
        id: randomUUID(),
        content: textContent,
        source,
        timestamp: new Date(),
        version: 1,
        tags: ['imported', 'text'],
        metadata: {},
        contentType: 'chat',
        conversationId: conversationId || randomUUID(),
      };
      
      await saveMemory(memory);
      return [memory];
    }
    
    return this.importChat({
      conversationId: conversationId || randomUUID(),
      messages,
      source,
      tags: ['imported', 'text'],
    });
  }

  private async importFromMarkdown(
    markdownContent: string, 
    source: string, 
    conversationId?: string
  ): Promise<Memory[]> {
    // Parse markdown content for chat-like structure
    const lines = markdownContent.split('\n');
    const messages: ChatMessage[] = [];
    
    let currentParticipant = 'user';
    let currentContent = '';
    
    for (const line of lines) {
      if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
        // Save previous message if exists
        if (currentContent.trim()) {
          messages.push({
            participant: currentParticipant,
            content: currentContent.trim(),
            timestamp: new Date(),
          });
        }
        
        // Start new message based on header
        const header = line.replace(/^#+\s*/, '').toLowerCase();
        currentParticipant = header.includes('user') || header.includes('human') ? 'user' : 'assistant';
        currentContent = '';
      } else {
        // Continue current message
        currentContent += '\n' + line;
      }
    }
    
    // Add final message
    if (currentContent.trim()) {
      messages.push({
        participant: currentParticipant,
        content: currentContent.trim(),
        timestamp: new Date(),
      });
    }
    
    if (messages.length === 0) {
      // If no structured messages found, treat as single memory
      const memory: Memory = {
        id: randomUUID(),
        content: markdownContent,
        source,
        timestamp: new Date(),
        version: 1,
        tags: ['imported', 'markdown'],
        metadata: {},
        contentType: 'chat',
        conversationId: conversationId || randomUUID(),
      };
      
      await saveMemory(memory);
      return [memory];
    }
    
    return this.importChat({
      conversationId: conversationId || randomUUID(),
      messages,
      source,
      tags: ['imported', 'markdown'],
    });
  }

  /**
   * Get conversation context for a specific conversation
   */
  async getConversationContext(conversationId: string): Promise<Memory[]> {
    return getConversationContext(conversationId);
  }
}

export const chatImportService = new ChatImportService(); 