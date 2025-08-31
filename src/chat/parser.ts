import { ChatImportRequest, ChatMessage } from '../types/memory.js';
import { randomUUID } from 'crypto';

export class ChatParser {
  /**
   * Parse ChatGPT conversation format
   */
  static parseChatGPT(text: string, conversationId?: string): ChatImportRequest {
    const messages: ChatMessage[] = [];
    const lines = text.split('\n');
    let currentMessage = '';
    let currentParticipant = '';
    let messageStartTime = new Date();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect ChatGPT format patterns
      if (line.startsWith('You said:') || line.match(/^You:/i)) {
        // Save previous message if exists
        if (currentMessage.trim()) {
          messages.push({
            participant: currentParticipant,
            content: currentMessage.trim(),
            timestamp: messageStartTime,
          });
        }

        // Start new user message
        currentParticipant = 'user';
        currentMessage = line.replace(/^(You said:|You:)/i, '').trim();
        messageStartTime = new Date();
      }
      else if (line.startsWith('Assistant:') || line.match(/^Assistant:/i) || line.match(/^GPT:/i)) {
        // Save previous message if exists
        if (currentMessage.trim()) {
          messages.push({
            participant: currentParticipant,
            content: currentMessage.trim(),
            timestamp: messageStartTime,
          });
        }

        // Start new assistant message
        currentParticipant = 'assistant';
        currentMessage = line.replace(/^(Assistant:|GPT:)/i, '').trim();
        messageStartTime = new Date();
      }
      else if (line.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) || line.match(/^\d{4}-\d{2}-\d{2}/)) {
        // Skip date lines
        continue;
      }
      else if (line && currentMessage) {
        // Continue current message
        currentMessage += '\n' + line;
      }
      else if (line && !currentMessage) {
        // Start new message if we find content without a clear participant
        currentParticipant = currentParticipant || 'unknown';
        currentMessage = line;
      }
    }

    // Add final message
    if (currentMessage.trim()) {
      messages.push({
        participant: currentParticipant,
        content: currentMessage.trim(),
        timestamp: messageStartTime,
      });
    }

    return {
      conversationId: conversationId || randomUUID(),
      messages,
      source: 'chatgpt',
      tags: ['chatgpt', 'conversation', 'ai-chat'],
      context: 'ChatGPT conversation imported via copy/paste',
    };
  }

  /**
   * Parse Claude conversation format
   */
  static parseClaude(text: string, conversationId?: string): ChatImportRequest {
    const messages: ChatMessage[] = [];
    const lines = text.split('\n');
    let currentMessage = '';
    let currentParticipant = '';
    let messageStartTime = new Date();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect Claude format patterns
      if (line.startsWith('Human:') || line.match(/^You:/i) || line.match(/^Human:/i)) {
        // Save previous message if exists
        if (currentMessage.trim()) {
          messages.push({
            participant: currentParticipant,
            content: currentMessage.trim(),
            timestamp: messageStartTime,
          });
        }

        // Start new human message
        currentParticipant = 'user';
        currentMessage = line.replace(/^(Human:|You:)/i, '').trim();
        messageStartTime = new Date();
      }
      else if (line.startsWith('Assistant:') || line.match(/^Assistant:/i) || line.match(/^Claude:/i)) {
        // Save previous message if exists
        if (currentMessage.trim()) {
          messages.push({
            participant: currentParticipant,
            content: currentMessage.trim(),
            timestamp: messageStartTime,
          });
        }

        // Start new assistant message
        currentParticipant = 'assistant';
        currentMessage = line.replace(/^(Assistant:|Claude:)/i, '').trim();
        messageStartTime = new Date();
      }
      else if (line.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) || line.match(/^\d{4}-\d{2}-\d{2}/)) {
        // Skip date lines
        continue;
      }
      else if (line && currentMessage) {
        // Continue current message
        currentMessage += '\n' + line;
      }
      else if (line && !currentMessage) {
        // Start new message if we find content without a clear participant
        currentParticipant = currentParticipant || 'unknown';
        currentMessage = line;
      }
    }

    // Add final message
    if (currentMessage.trim()) {
      messages.push({
        participant: currentParticipant,
        content: currentMessage.trim(),
        timestamp: messageStartTime,
      });
    }

    return {
      conversationId: conversationId || randomUUID(),
      messages,
      source: 'claude',
      tags: ['claude', 'conversation', 'ai-chat'],
      context: 'Claude conversation imported via copy/paste',
    };
  }

  /**
   * Parse generic chat format (fallback)
   */
  static parseGeneric(text: string, conversationId?: string): ChatImportRequest {
    const messages: ChatMessage[] = [];
    const lines = text.split('\n');
    let currentMessage = '';
    let currentParticipant = 'unknown';
    let messageStartTime = new Date();

    // Simple heuristic: alternate between user and assistant
    let isUserTurn = true;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine) continue;

      // Check for common participant indicators
      if (trimmedLine.match(/^(You|User|Human):/i)) {
        if (currentMessage.trim()) {
          messages.push({
            participant: currentParticipant,
            content: currentMessage.trim(),
            timestamp: messageStartTime,
          });
        }
        currentParticipant = 'user';
        currentMessage = trimmedLine.replace(/^(You|User|Human):/i, '').trim();
        messageStartTime = new Date();
        isUserTurn = false;
      }
      else if (trimmedLine.match(/^(Assistant|AI|Bot|GPT|Claude):/i)) {
        if (currentMessage.trim()) {
          messages.push({
            participant: currentParticipant,
            content: currentMessage.trim(),
            timestamp: messageStartTime,
          });
        }
        currentParticipant = 'assistant';
        currentMessage = trimmedLine.replace(/^(Assistant|AI|Bot|GPT|Claude):/i, '').trim();
        messageStartTime = new Date();
        isUserTurn = true;
      }
      else {
        // Continue current message or start new one
        if (!currentMessage) {
          currentParticipant = isUserTurn ? 'user' : 'assistant';
          isUserTurn = !isUserTurn;
        }
        currentMessage += (currentMessage ? '\n' : '') + trimmedLine;
      }
    }

    // Add final message
    if (currentMessage.trim()) {
      messages.push({
        participant: currentParticipant,
        content: currentMessage.trim(),
        timestamp: messageStartTime,
      });
    }

    return {
      conversationId: conversationId || randomUUID(),
      messages,
      source: 'generic-chat',
      tags: ['chat', 'conversation', 'imported'],
      context: 'Generic chat conversation imported via copy/paste',
    };
  }

  /**
   * Auto-detect format and parse accordingly
   */
  static parse(text: string, format?: 'chatgpt' | 'claude' | 'generic', conversationId?: string): ChatImportRequest {
    if (format === 'chatgpt' || text.includes('You said:') || text.match(/GPT:/i)) {
      return this.parseChatGPT(text, conversationId);
    }
    else if (format === 'claude' || text.match(/Claude:/i) || text.includes('Human:')) {
      return this.parseClaude(text, conversationId);
    }
    else {
      return this.parseGeneric(text, conversationId);
    }
  }
}
