// @ts-nocheck
import { Application, Request, Response } from 'express';
import { z } from 'zod';
import { getMemory } from '../storage/container.js';
import { Memory } from '../types/memory.js';
import { apiKeyAuth } from '../security/auth.js';
import { exportService } from '../export/service.js';

const exportBundleSchema = z.object({
  memoryIds: z.array(z.string().uuid()),
  format: z.enum(['markdown', 'text', 'json', 'conversation']).optional(),
});

export const registerExportRoutes = (app: Application) => {
  app.post('/export/bundle', apiKeyAuth, async (req: Request, res: Response) => {
    try {
      const validationResult = exportBundleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.issues });
      }

      const { memoryIds, format } = validationResult.data;

      const memories = (
        await Promise.all(memoryIds.map((id) => getMemory(id)))
      ).filter((m): m is Memory => m !== null);

      if (memories.length !== memoryIds.length) {
        return res
          .status(404)
          .json({ error: 'One or more requested memories were not found.' });
      }

      const formattedBundle = exportService.formatMemories(memories, format);

      res.status(200).send(formattedBundle);
    } catch (error) {
      console.error('Failed to export memories:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}; 