export interface Memory {
  id: string;
  content: string;
  timestamp: Date;
  version: number;
  tags: string[];
  inferredTags?: string[];
  metadata: Record<string, any>;
  source: string;
  contentType?: 'chat' | 'code' | 'documentation' | 'note';
  conversationId?: string;
  participant?: string;
  context?: string;
}

export interface ChatMessage {
  participant: string;
  content: string;
  timestamp: Date;
}

export interface ChatImportRequest {
  conversationId: string;
  messages: ChatMessage[];
  source: string;
  tags?: string[];
  metadata?: Record<string, any>;
  context?: string;
} 