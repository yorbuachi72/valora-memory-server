import { ValoraPlugin, PluginCapabilities } from '../plugin-manager.js';
import { Memory } from '../../types/memory.js';
import { ChatImportRequest } from '../../types/memory.js';

export class ValidrPlugin implements ValoraPlugin {
  name = 'validr-integration';
  version = '1.0.0';
  description = 'Integration with Validr platform for validation rule management';
  capabilities: PluginCapabilities = {
    memoryOperations: true,
    chatOperations: true,
    searchOperations: true,
    exportOperations: true
  };

  private validrApiUrl?: string;
  private validrApiKey?: string;

  async initialize(): Promise<void> {
    // Load Validr configuration
    this.validrApiUrl = process.env.VALIDR_API_URL;
    this.validrApiKey = process.env.VALIDR_API_KEY;

    if (!this.validrApiUrl || !this.validrApiKey) {
      console.warn('⚠️ Validr integration not fully configured. Set VALIDR_API_URL and VALIDR_API_KEY for full functionality.');
    } else {
      console.log('✅ Validr integration initialized');
    }
  }

  async onMemoryCreated(memory: Memory): Promise<void> {
    // Check if this is a validation-related memory
    if (this.isValidationMemory(memory)) {
      await this.syncToValidr(memory, 'created');
    }
  }

  async onMemoryUpdated(memory: Memory): Promise<void> {
    // Check if this is a validation-related memory
    if (this.isValidationMemory(memory)) {
      await this.syncToValidr(memory, 'updated');
    }
  }

  async onMemoryDeleted(id: string): Promise<void> {
    // Sync deletion to Validr if needed
    if (this.validrApiUrl && this.validrApiKey) {
      try {
        await fetch(`${this.validrApiUrl}/api/valora-sync/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.validrApiKey}`
          },
          body: JSON.stringify({ memoryId: id })
        });
      } catch (error) {
        console.error('Failed to sync memory deletion to Validr:', error);
      }
    }
  }

  async onChatImported(conversation: ChatImportRequest): Promise<void> {
    // Check if this is a validation-related conversation
    if (this.isValidationConversation(conversation)) {
      await this.syncConversationToValidr(conversation);
    }
  }

  getCapabilities(): PluginCapabilities {
    return this.capabilities;
  }

  private isValidationMemory(memory: Memory): boolean {
    const validationKeywords = ['validation', 'rule', 'validate', 'constraint', 'schema'];
    const content = memory.content.toLowerCase();
    const tags = memory.tags.map(tag => tag.toLowerCase());
    
    return validationKeywords.some(keyword => 
      content.includes(keyword) || tags.some(tag => tag.includes(keyword))
    );
  }

  private isValidationConversation(conversation: ChatImportRequest): boolean {
    const validationKeywords = ['validation', 'rule', 'validate', 'constraint'];
    const content = conversation.messages.map(m => m.content).join(' ').toLowerCase();
    const tags = conversation.tags || [];
    
    return validationKeywords.some(keyword => 
      content.includes(keyword) || tags.some(tag => tag.toLowerCase().includes(keyword))
    );
  }

  private async syncToValidr(memory: Memory, action: 'created' | 'updated'): Promise<void> {
    if (!this.validrApiUrl || !this.validrApiKey) {
      return;
    }

    try {
      const response = await fetch(`${this.validrApiUrl}/api/valora-sync/memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.validrApiKey}`
        },
        body: JSON.stringify({
          action,
          memory: {
            id: memory.id,
            content: memory.content,
            tags: memory.tags,
            metadata: memory.metadata,
            source: memory.source,
            timestamp: memory.timestamp
          }
        })
      });

      if (response.ok) {
        console.log(`✅ Synced memory ${action} to Validr: ${memory.id}`);
      } else {
        console.warn(`⚠️ Failed to sync memory ${action} to Validr: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error syncing memory ${action} to Validr:`, error);
    }
  }

  private async syncConversationToValidr(conversation: ChatImportRequest): Promise<void> {
    if (!this.validrApiUrl || !this.validrApiKey) {
      return;
    }

    try {
      const response = await fetch(`${this.validrApiUrl}/api/valora-sync/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.validrApiKey}`
        },
        body: JSON.stringify({
          conversationId: conversation.conversationId,
          messages: conversation.messages,
          tags: conversation.tags,
          metadata: conversation.metadata,
          source: conversation.source
        })
      });

      if (response.ok) {
        console.log(`✅ Synced conversation to Validr: ${conversation.conversationId}`);
      } else {
        console.warn(`⚠️ Failed to sync conversation to Validr: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error syncing conversation to Validr:', error);
    }
  }
}

export const validrPlugin = new ValidrPlugin();
