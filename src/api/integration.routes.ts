import { Application, Request, Response } from 'express';
import { z } from 'zod';
import { apiKeyAuth } from '../security/auth.js';
import { pluginManager } from '../integrations/plugin-manager.js';
import { webhookManager } from '../integrations/webhook-manager.js';

const webhookConfigSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['memory.created', 'memory.updated', 'memory.deleted', 'chat.imported', 'search.performed', 'export.completed'])),
  headers: z.record(z.string()).optional(),
  retryPolicy: z.object({
    maxRetries: z.number().min(0).max(10),
    backoffMs: z.number().min(100).max(30000),
    timeoutMs: z.number().min(1000).max(60000)
  }).optional(),
  enabled: z.boolean().default(true)
});

const pluginConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  capabilities: z.object({
    memoryOperations: z.boolean(),
    chatOperations: z.boolean(),
    searchOperations: z.boolean(),
    exportOperations: z.boolean()
  }),
  settings: z.record(z.any()).optional(),
  enabled: z.boolean().default(true)
});

export const registerIntegrationRoutes = (app: Application) => {
  // Webhook Management
  app.post('/integrations/webhooks', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = webhookConfigSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ error: validationResult.error.issues });
        return;
      }

      const webhookId = await webhookManager.registerWebhook(validationResult.data);
      
      res.status(201).json({
        id: webhookId,
        message: 'Webhook registered successfully',
        config: validationResult.data
      });
    } catch (error) {
      console.error('Failed to register webhook:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/integrations/webhooks', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const webhooks = webhookManager.getWebhooks();
      res.json(webhooks);
    } catch (error) {
      console.error('Failed to get webhooks:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/integrations/webhooks/:id', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const webhook = webhookManager.getWebhook(id);
      
      if (!webhook) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }
      
      res.json(webhook);
    } catch (error) {
      console.error('Failed to get webhook:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.put('/integrations/webhooks/:id', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const validationResult = webhookConfigSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({ error: validationResult.error.issues });
        return;
      }

      const updated = await webhookManager.updateWebhook(id, validationResult.data);
      
      if (!updated) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }
      
      res.json({ message: 'Webhook updated successfully' });
    } catch (error) {
      console.error('Failed to update webhook:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/integrations/webhooks/:id', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const removed = await webhookManager.unregisterWebhook(id);
      
      if (!removed) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }
      
      res.json({ message: 'Webhook unregistered successfully' });
    } catch (error) {
      console.error('Failed to unregister webhook:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/integrations/webhooks/:id/enable', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const enabled = await webhookManager.enableWebhook(id);
      
      if (!enabled) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }
      
      res.json({ message: 'Webhook enabled successfully' });
    } catch (error) {
      console.error('Failed to enable webhook:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/integrations/webhooks/:id/disable', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const disabled = await webhookManager.disableWebhook(id);
      
      if (!disabled) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }
      
      res.json({ message: 'Webhook disabled successfully' });
    } catch (error) {
      console.error('Failed to disable webhook:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Plugin Management
  app.get('/integrations/plugins', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const plugins = pluginManager.getPlugins();
      res.json(plugins.map(plugin => ({
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        capabilities: plugin.capabilities,
        enabled: pluginManager.isPluginEnabled(plugin.name)
      })));
    } catch (error) {
      console.error('Failed to get plugins:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/integrations/plugins/:name', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.params;
      const plugin = pluginManager.getPlugin(name);
      
      if (!plugin) {
        res.status(404).json({ error: 'Plugin not found' });
        return;
      }
      
      res.json({
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        capabilities: plugin.capabilities,
        enabled: pluginManager.isPluginEnabled(plugin.name)
      });
    } catch (error) {
      console.error('Failed to get plugin:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/integrations/plugins/:name/enable', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.params;
      await pluginManager.enablePlugin(name);
      res.json({ message: 'Plugin enabled successfully' });
    } catch (error) {
      console.error('Failed to enable plugin:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/integrations/plugins/:name/disable', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.params;
      await pluginManager.disablePlugin(name);
      res.json({ message: 'Plugin disabled successfully' });
    } catch (error) {
      console.error('Failed to disable plugin:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Integration Status
  app.get('/integrations/status', apiKeyAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const webhooks = webhookManager.getWebhooks();
      const plugins = pluginManager.getPlugins();
      
      res.json({
        webhooks: {
          total: webhooks.length,
          enabled: webhooks.filter(w => w.enabled).length,
          disabled: webhooks.filter(w => !w.enabled).length
        },
        plugins: {
          total: plugins.length,
          enabled: plugins.filter(p => pluginManager.isPluginEnabled(p.name)).length,
          disabled: plugins.filter(p => !pluginManager.isPluginEnabled(p.name)).length
        },
        events: [
          'memory.created',
          'memory.updated',
          'memory.deleted',
          'chat.imported',
          'search.performed',
          'export.completed'
        ]
      });
    } catch (error) {
      console.error('Failed to get integration status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};
