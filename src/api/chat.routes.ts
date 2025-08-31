import { Application } from 'express';
import { z } from 'zod';
import { chatImportService } from '../chat/service.js';
import { ChatImportRequest } from '../types/memory.js';
import { apiKeyAuth } from '../security/auth.js';

const chatImportSchema = z.object({
  conversationId: z.string(),
  messages: z.array(z.object({
    participant: z.string(),
    content: z.string(),
    timestamp: z.coerce.date().optional(),
  })),
  source: z.string(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  context: z.string().optional(),
});

const formatImportSchema = z.object({
  content: z.string(),
  format: z.enum(['json', 'text', 'markdown']),
  source: z.string(),
  conversationId: z.string().optional(),
});

export const registerChatRoutes = (app: Application) => {
  // Import structured chat data
  app.post('/chat/import', apiKeyAuth, (req, res) => {
    (async () => {
      try {
        const validationResult = chatImportSchema.safeParse(req.body);
        if (!validationResult.success) {
          res.status(400).json({ error: validationResult.error.issues });
          return;
        }
        const chatData: ChatImportRequest = {
          ...validationResult.data,
          messages: validationResult.data.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp || new Date(),
          })),
        };
        const memories = await chatImportService.importChat(chatData);
        res.status(201).json({
          message: `Successfully imported ${memories.length} messages`,
          conversationId: chatData.conversationId,
          memoryIds: memories.map(m => m.id),
          memories,
        });
      } catch (error) {
        console.error('Failed to import chat:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    })();
  });

  // Import from various formats
  app.post('/chat/import-format', apiKeyAuth, (req, res) => {
    (async () => {
      try {
        const validationResult = formatImportSchema.safeParse(req.body);
        if (!validationResult.success) {
          res.status(400).json({ error: validationResult.error.issues });
          return;
        }
        const { content, format, source, conversationId } = validationResult.data;
        const memories = await chatImportService.importFromFormat(content, format, source, conversationId);
        res.status(201).json({
          message: `Successfully imported ${memories.length} memories from ${format} format`,
          memoryIds: memories.map(m => m.id),
          memories,
        });
      } catch (error) {
        console.error('Failed to import from format:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    })();
  });

  // Get conversation context
  app.get('/chat/context/:conversationId', apiKeyAuth, (req, res) => {
    (async () => {
      try {
        const { conversationId } = req.params;
        const memories = await chatImportService.getConversationContext(conversationId);
        res.json({
          conversationId,
          messageCount: memories.length,
          memories,
        });
      } catch (error) {
        console.error('Failed to get conversation context:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    })();
  });
}; 