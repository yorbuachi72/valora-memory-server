import { Memory } from '../types/memory.js';
import { ChatImportRequest } from '../types/memory.js';

export interface WebhookConfig {
  id: string;
  url: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  retryPolicy?: RetryPolicy;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookEvent = 
  | 'memory.created'
  | 'memory.updated' 
  | 'memory.deleted'
  | 'chat.imported'
  | 'search.performed'
  | 'export.completed';

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  timeoutMs: number;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Memory | ChatImportRequest | any;
  source: string;
  webhookId: string;
}

export class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private defaultRetryPolicy: RetryPolicy = {
    maxRetries: 3,
    backoffMs: 1000,
    timeoutMs: 10000
  };

  async registerWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateWebhookId();
    const now = new Date();
    
    const webhook: WebhookConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now,
      retryPolicy: config.retryPolicy || this.defaultRetryPolicy
    };

    this.webhooks.set(id, webhook);
    console.log(`✅ Webhook registered: ${id} -> ${config.url}`);
    return id;
  }

  async unregisterWebhook(id: string): Promise<boolean> {
    const removed = this.webhooks.delete(id);
    if (removed) {
      console.log(`❌ Webhook unregistered: ${id}`);
    }
    return removed;
  }

  async notifyMemoryCreated(memory: Memory): Promise<void> {
    await this.notifyWebhooks('memory.created', memory);
  }

  async notifyMemoryUpdated(memory: Memory): Promise<void> {
    await this.notifyWebhooks('memory.updated', memory);
  }

  async notifyMemoryDeleted(id: string): Promise<void> {
    await this.notifyWebhooks('memory.deleted', { id });
  }

  async notifyChatImported(conversation: ChatImportRequest): Promise<void> {
    await this.notifyWebhooks('chat.imported', conversation);
  }

  async notifySearchPerformed(query: string, results: Memory[]): Promise<void> {
    await this.notifyWebhooks('search.performed', { query, results });
  }

  async notifyExportCompleted(memoryIds: string[], format: string, result: string): Promise<void> {
    await this.notifyWebhooks('export.completed', { memoryIds, format, result });
  }

  private async notifyWebhooks(event: WebhookEvent, data: any): Promise<void> {
    const relevantWebhooks = Array.from(this.webhooks.values())
      .filter(webhook => webhook.enabled && webhook.events.includes(event));

    const promises = relevantWebhooks.map(webhook => 
      this.sendWebhook(webhook, event, data)
    );

    await Promise.allSettled(promises);
  }

  private async sendWebhook(webhook: WebhookConfig, event: WebhookEvent, data: any): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      source: 'valora',
      webhookId: webhook.id
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Valora-Webhook/1.0',
      ...webhook.headers
    };

    for (let attempt = 0; attempt <= webhook.retryPolicy!.maxRetries; attempt++) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(webhook.retryPolicy!.timeoutMs)
        });

        if (response.ok) {
          console.log(`✅ Webhook sent successfully: ${webhook.id} -> ${webhook.url}`);
          return;
        } else {
          console.warn(`⚠️ Webhook failed (${response.status}): ${webhook.id} -> ${webhook.url}`);
        }
      } catch (error) {
        console.error(`❌ Webhook error (attempt ${attempt + 1}): ${webhook.id} -> ${webhook.url}`, error);
      }

      if (attempt < webhook.retryPolicy!.maxRetries) {
        await this.delay(webhook.retryPolicy!.backoffMs * Math.pow(2, attempt));
      }
    }

    console.error(`❌ Webhook failed after ${webhook.retryPolicy!.maxRetries + 1} attempts: ${webhook.id}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateWebhookId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  getWebhook(id: string): WebhookConfig | undefined {
    return this.webhooks.get(id);
  }

  async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<boolean> {
    const webhook = this.webhooks.get(id);
    if (webhook) {
      Object.assign(webhook, updates, { updatedAt: new Date() });
      console.log(`✅ Webhook updated: ${id}`);
      return true;
    }
    return false;
  }

  async enableWebhook(id: string): Promise<boolean> {
    return this.updateWebhook(id, { enabled: true });
  }

  async disableWebhook(id: string): Promise<boolean> {
    return this.updateWebhook(id, { enabled: false });
  }
}

export const webhookManager = new WebhookManager();
