import { Memory } from '../types/memory.js';

type Format = 'markdown' | 'text' | 'json' | 'conversation';

class ExportService {
  public formatMemories(memories: Memory[], format: Format = 'markdown'): string {
    switch (format) {
      case 'markdown':
        return this.toMarkdown(memories);
      case 'text':
        return this.toText(memories);
      case 'json':
        return this.toJSON(memories);
      case 'conversation':
        return this.toConversation(memories);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private toMarkdown(memories: Memory[]): string {
    return memories
      .map(
        (m) =>
          `---\n**Source:** ${m.source}\n**Timestamp:** ${m.timestamp.toISOString()}\n${
            m.participant ? `**Participant:** ${m.participant}\n` : ''
          }${
            m.conversationId ? `**Conversation:** ${m.conversationId}\n` : ''
          }\n${
            m.content
          }\n---\n`
      )
      .join('\n');
  }

  private toText(memories: Memory[]): string {
    return memories
      .map(
        (m) =>
          `Source: ${m.source}\nTimestamp: ${m.timestamp.toISOString()}\n${
            m.participant ? `Participant: ${m.participant}\n` : ''
          }${
            m.conversationId ? `Conversation: ${m.conversationId}\n` : ''
          }\n${
            m.content
          }\n`
      )
      .join('\n----------------------------------------\n');
  }

  private toJSON(memories: Memory[]): string {
    return JSON.stringify(memories, null, 2);
  }

  private toConversation(memories: Memory[]): string {
    // Group by conversation and format as a readable conversation
    const conversations = new Map<string, Memory[]>();
    
    for (const memory of memories) {
      const convId = memory.conversationId || 'unknown';
      if (!conversations.has(convId)) {
        conversations.set(convId, []);
      }
      conversations.get(convId)!.push(memory);
    }
    
    const conversationTexts: string[] = [];
    
    for (const [convId, convMemories] of conversations) {
      // Sort by timestamp
      const sortedMemories = convMemories.sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );
      
      let conversationText = `Conversation: ${convId}\n`;
      conversationText += '='.repeat(50) + '\n\n';
      
      for (const memory of sortedMemories) {
        const participant = memory.participant || 'Unknown';
        conversationText += `${participant}:\n${memory.content}\n\n`;
      }
      
      conversationTexts.push(conversationText);
    }
    
    return conversationTexts.join('\n' + '='.repeat(50) + '\n\n');
  }
}

export const exportService = new ExportService(); 