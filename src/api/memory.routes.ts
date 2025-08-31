// @ts-nocheck
import { Application, Request, Response } from 'express';
import { z } from 'zod';
import {
  saveMemory,
  getMemory,
  searchMemories,
  deleteMemory,
  updateMemory,
} from '../storage/container.js';
import { retrievalService } from '../retrieval/service.js';
import { Memory } from '../types/memory.js';
import { randomUUID } from 'crypto';
import { apiKeyAuth } from '../security/auth.js';

const createMemorySchema = z.object({
  content: z.string(),
  source: z.string(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateMemorySchema = createMemorySchema.partial();

export const registerMemoryRoutes = (app: Application) => {
  app.post('/memory', apiKeyAuth, async (req: Request, res: Response) => {
    try {
      const validationResult = createMemorySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.issues });
      }

      const { content, source, tags, metadata } = validationResult.data;

      const newMemory: Memory = {
        id: randomUUID(),
        content,
        source,
        timestamp: new Date(),
        version: 1,
        tags: tags || [],
        metadata: metadata || {},
      };

      await saveMemory(newMemory);

      res.status(201).json(newMemory);
    } catch (error) {
      console.error('Failed to save memory:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/memory/semantic-search', apiKeyAuth, async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'A string "query" is required in the request body.' });
      }

      const searchResults = await retrievalService.search(query);
      
      const memories = (await Promise.all(
        searchResults.map(async (r) => {
          const memory = await getMemory(r.id);
          return memory ? { ...memory, score: r.score } : null;
        })
      )).filter((m): m is Memory & { score: number } => m !== null);

      res.json(memories);
    } catch (error) {
      console.error('Failed to perform semantic search:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/memory/search', apiKeyAuth, async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res
          .status(400)
          .json({ error: 'Query parameter "q" is required.' });
      }
      const results = await searchMemories(query);
      res.json(results);
    } catch (error) {
      console.error('Failed to search memories:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/memory/:id', apiKeyAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const memory = await getMemory(id);
      if (memory) {
        res.json(memory);
      } else {
        res.status(404).json({ error: 'Memory not found.' });
      }
    } catch (error) {
      console.error('Failed to get memory:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.put('/memory/:id', apiKeyAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validationResult = updateMemorySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.issues });
      }

      const updatedMemory = await updateMemory(id, validationResult.data);
      if (updatedMemory) {
        res.json(updatedMemory);
      } else {
        res.status(404).json({ error: 'Memory not found.' });
      }
    } catch (error) {
      console.error('Failed to update memory:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/memory/:id', apiKeyAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await deleteMemory(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Memory not found.' });
      }
    } catch (error) {
      console.error('Failed to delete memory:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}; 