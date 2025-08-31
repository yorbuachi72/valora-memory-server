import crypto from 'crypto';
import { z } from 'zod';

export interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface APIKeyUsage {
  keyId: string;
  endpoint: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  responseTime: number;
  statusCode: number;
}

const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()),
  expiresAt: z.date().optional(),
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1).max(1000),
    requestsPerHour: z.number().min(1).max(10000)
  }).optional()
});

export class APIKeyManager {
  private apiKeys: Map<string, APIKey> = new Map();
  private usageLog: APIKeyUsage[] = [];
  private readonly maxUsageLogSize = 10000;

  constructor() {
    this.initializeDefaultKeys();
  }

  private initializeDefaultKeys(): void {
    // Create default API key if environment variable is set
    const defaultKey = process.env.VALORA_API_KEY;
    if (defaultKey) {
      this.createAPIKey({
        name: 'Default API Key',
        permissions: ['read', 'write', 'integrations'],
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerHour: 1000
        }
      });
    }
  }

  async createAPIKey(config: z.infer<typeof apiKeySchema>): Promise<APIKey> {
    const validationResult = apiKeySchema.safeParse(config);
    if (!validationResult.success) {
      throw new Error(`Invalid API key configuration: ${validationResult.error.message}`);
    }

    const id = crypto.randomUUID();
    const key = this.generateSecureKey();
    const now = new Date();

    const apiKey: APIKey = {
      id,
      name: config.name,
      key,
      permissions: config.permissions,
      createdAt: now,
      isActive: true,
      expiresAt: config.expiresAt,
      rateLimit: config.rateLimit || {
        requestsPerMinute: 100,
        requestsPerHour: 1000
      }
    };

    this.apiKeys.set(id, apiKey);
    console.log(`✅ API key created: ${config.name} (${id})`);
    
    return apiKey;
  }

  async validateAPIKey(key: string): Promise<APIKey | null> {
    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.key === key && apiKey.isActive) {
        // Check if key is expired
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
          console.warn(`⚠️ API key expired: ${apiKey.name} (${apiKey.id})`);
          apiKey.isActive = false;
          return null;
        }

        // Update last used timestamp
        apiKey.lastUsed = new Date();
        return apiKey;
      }
    }
    return null;
  }

  async checkPermission(apiKey: APIKey, permission: string): Promise<boolean> {
    return apiKey.permissions.includes(permission) || apiKey.permissions.includes('admin');
  }

  async checkRateLimit(apiKey: APIKey, ipAddress: string): Promise<boolean> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentUsage = this.usageLog.filter(usage => 
      usage.keyId === apiKey.id && 
      usage.timestamp > oneMinuteAgo
    );

    const hourlyUsage = this.usageLog.filter(usage => 
      usage.keyId === apiKey.id && 
      usage.timestamp > oneHourAgo
    );

    return recentUsage.length < apiKey.rateLimit.requestsPerMinute &&
           hourlyUsage.length < apiKey.rateLimit.requestsPerHour;
  }

  async logUsage(usage: Omit<APIKeyUsage, 'timestamp'>): Promise<void> {
    const usageLog: APIKeyUsage = {
      ...usage,
      timestamp: new Date()
    };

    this.usageLog.push(usageLog);

    // Clean up old usage logs
    if (this.usageLog.length > this.maxUsageLogSize) {
      this.usageLog = this.usageLog.slice(-this.maxUsageLogSize);
    }
  }

  async deactivateAPIKey(id: string): Promise<boolean> {
    const apiKey = this.apiKeys.get(id);
    if (apiKey) {
      apiKey.isActive = false;
      console.log(`❌ API key deactivated: ${apiKey.name} (${id})`);
      return true;
    }
    return false;
  }

  async listAPIKeys(): Promise<APIKey[]> {
    return Array.from(this.apiKeys.values()).map(key => ({
      ...key,
      key: key.key.substring(0, 8) + '...' // Mask the key
    }));
  }

  async getAPIKeyStats(id: string): Promise<{
    totalRequests: number;
    requestsLastHour: number;
    requestsLastDay: number;
    averageResponseTime: number;
    errorRate: number;
  } | null> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const keyUsage = this.usageLog.filter(usage => usage.keyId === id);
    const hourlyUsage = keyUsage.filter(usage => usage.timestamp > oneHourAgo);
    const dailyUsage = keyUsage.filter(usage => usage.timestamp > oneDayAgo);

    if (keyUsage.length === 0) return null;

    const totalRequests = keyUsage.length;
    const requestsLastHour = hourlyUsage.length;
    const requestsLastDay = dailyUsage.length;
    const averageResponseTime = keyUsage.reduce((sum, usage) => sum + usage.responseTime, 0) / totalRequests;
    const errorRate = keyUsage.filter(usage => usage.statusCode >= 400).length / totalRequests;

    return {
      totalRequests,
      requestsLastHour,
      requestsLastDay,
      averageResponseTime,
      errorRate
    };
  }

  private generateSecureKey(): string {
    return 'val_' + crypto.randomBytes(32).toString('hex');
  }

  // Cleanup expired keys
  async cleanupExpiredKeys(): Promise<void> {
    const now = new Date();
    for (const [id, apiKey] of this.apiKeys.entries()) {
      if (apiKey.expiresAt && apiKey.expiresAt < now && apiKey.isActive) {
        apiKey.isActive = false;
        console.log(`🗑️ Expired API key cleaned up: ${apiKey.name} (${id})`);
      }
    }
  }
}

export const apiKeyManager = new APIKeyManager();
