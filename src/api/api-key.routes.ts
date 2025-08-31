import express, { Request, Response } from 'express';
import { z } from 'zod';
import { executeQuery, executeQuerySingle } from '../database/config.js';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, requireRole } from './auth.routes.js';

// Validation schemas
const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  permissions: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
});

const UpdateApiKeySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  permissions: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

// Types
type CreateApiKeyRequest = z.infer<typeof CreateApiKeySchema>;
type UpdateApiKeyRequest = z.infer<typeof UpdateApiKeySchema>;

interface ApiKey {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  keyHash: string;
  permissions: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  isActive: boolean;
}

// Generate a secure API key
function generateApiKey(): string {
  return `val_${uuidv4().replace(/-/g, '')}`;
}

// Hash the API key for storage
function hashApiKey(apiKey: string): string {
  // In production, use a proper hashing algorithm like bcrypt
  // For now, we'll use a simple approach
  return Buffer.from(apiKey).toString('base64');
}

// Verify API key format
function isValidApiKeyFormat(apiKey: string): boolean {
  return apiKey.startsWith('val_') && apiKey.length === 32; // val_ + 24 chars
}

// Create API key
const createApiKey = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, permissions = [], expiresAt } = CreateApiKeySchema.parse(req.body);

    // Generate new API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);

    const query = `
      INSERT INTO api_keys (id, user_id, tenant_id, name, key_hash, permissions, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const params = [
      uuidv4(),
      user.id,
      user.tenantId,
      name,
      keyHash,
      permissions,
      expiresAt || null,
    ];

    const result = await executeQuerySingle(query, params);

    if (!result) {
      return res.status(500).json({ error: 'Failed to create API key' });
    }

    const createdKey: ApiKey = {
      id: result.id,
      userId: result.user_id,
      tenantId: result.tenant_id,
      name: result.name,
      keyHash: result.key_hash,
      permissions: result.permissions || [],
      expiresAt: result.expires_at ? new Date(result.expires_at) : undefined,
      lastUsedAt: result.last_used_at ? new Date(result.last_used_at) : undefined,
      createdAt: new Date(result.created_at),
      isActive: result.is_active,
    };

    res.status(201).json({
      message: 'API key created successfully',
      apiKey: {
        ...createdKey,
        key: apiKey, // Only return the plain key once during creation
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    const message = error instanceof Error ? error.message : 'Failed to create API key';
    res.status(500).json({ error: message });
  }
};

// List user's API keys
const listApiKeys = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const query = `
      SELECT * FROM api_keys
      WHERE user_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const keys = await executeQuery(query, [user.id, user.tenantId, limit, offset]);

    const apiKeys: ApiKey[] = keys.map((key: any) => ({
      id: key.id,
      userId: key.user_id,
      tenantId: key.tenant_id,
      name: key.name,
      keyHash: key.key_hash,
      permissions: key.permissions || [],
      expiresAt: key.expires_at ? new Date(key.expires_at) : undefined,
      lastUsedAt: key.last_used_at ? new Date(key.last_used_at) : undefined,
      createdAt: new Date(key.created_at),
      isActive: key.is_active,
    }));

    res.json({
      apiKeys,
      pagination: {
        limit,
        offset,
        total: apiKeys.length, // In production, you'd want a separate count query
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list API keys';
    res.status(500).json({ error: message });
  }
};

// Get API key by ID
const getApiKey = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const query = `
      SELECT * FROM api_keys
      WHERE id = $1 AND user_id = $2 AND tenant_id = $3
    `;

    const result = await executeQuerySingle(query, [id, user.id, user.tenantId]);

    if (!result) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const apiKey: ApiKey = {
      id: result.id,
      userId: result.user_id,
      tenantId: result.tenant_id,
      name: result.name,
      keyHash: result.key_hash,
      permissions: result.permissions || [],
      expiresAt: result.expires_at ? new Date(result.expires_at) : undefined,
      lastUsedAt: result.last_used_at ? new Date(result.last_used_at) : undefined,
      createdAt: new Date(result.created_at),
      isActive: result.is_active,
    };

    res.json({ apiKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get API key';
    res.status(500).json({ error: message });
  }
};

// Update API key
const updateApiKey = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const updates = UpdateApiKeySchema.parse(req.body);

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }

    if (updates.permissions !== undefined) {
      updateFields.push(`permissions = $${paramIndex++}`);
      params.push(updates.permissions);
    }

    if (updates.expiresAt !== undefined) {
      updateFields.push(`expires_at = $${paramIndex++}`);
      params.push(new Date(updates.expiresAt));
    }

    if (updates.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      params.push(updates.isActive);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updateFields.push('updated_at = NOW()');

    const query = `
      UPDATE api_keys
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} AND tenant_id = $${paramIndex}
      RETURNING *
    `;

    params.push(id, user.id, user.tenantId);

    const result = await executeQuerySingle(query, params);

    if (!result) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const apiKey: ApiKey = {
      id: result.id,
      userId: result.user_id,
      tenantId: result.tenant_id,
      name: result.name,
      keyHash: result.key_hash,
      permissions: result.permissions || [],
      expiresAt: result.expires_at ? new Date(result.expires_at) : undefined,
      lastUsedAt: result.last_used_at ? new Date(result.last_used_at) : undefined,
      createdAt: new Date(result.created_at),
      isActive: result.is_active,
    };

    res.json({
      message: 'API key updated successfully',
      apiKey,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    const message = error instanceof Error ? error.message : 'Failed to update API key';
    res.status(500).json({ error: message });
  }
};

// Delete API key
const deleteApiKey = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const query = `
      DELETE FROM api_keys
      WHERE id = $1 AND user_id = $2 AND tenant_id = $3
    `;

    const result = await executeQuery(query, [id, user.id, user.tenantId]);

    if (result.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete API key';
    res.status(500).json({ error: message });
  }
};

// Regenerate API key (creates new key, deactivates old)
const regenerateApiKey = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Generate new API key
    const newApiKey = generateApiKey();
    const newKeyHash = hashApiKey(newApiKey);

    const query = `
      UPDATE api_keys
      SET key_hash = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3 AND tenant_id = $4
      RETURNING *
    `;

    const result = await executeQuerySingle(query, [newKeyHash, id, user.id, user.tenantId]);

    if (!result) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      message: 'API key regenerated successfully',
      apiKey: {
        id: result.id,
        name: result.name,
        key: newApiKey, // Return the new plain key
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate API key';
    res.status(500).json({ error: message });
  }
};

// Create API key router
const apiKeyRouter = express.Router();

// Apply authentication middleware
apiKeyRouter.use(authenticateToken);

// Routes
apiKeyRouter.post('/', createApiKey);
apiKeyRouter.get('/', listApiKeys);
apiKeyRouter.get('/:id', getApiKey);
apiKeyRouter.put('/:id', updateApiKey);
apiKeyRouter.delete('/:id', deleteApiKey);
apiKeyRouter.post('/:id/regenerate', regenerateApiKey);

export { apiKeyRouter };