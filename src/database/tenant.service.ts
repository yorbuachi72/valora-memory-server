import { executeQuery, executeQuerySingle } from './config.js';
import { v4 as uuidv4 } from 'uuid';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateTenantData {
  name: string;
  slug: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface UpdateTenantData {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
  isActive?: boolean;
}

export class TenantService {
  // Create a new tenant
  async createTenant(tenantData: CreateTenantData): Promise<Tenant> {
    const { name, slug, description, settings = {} } = tenantData;

    // Check if slug is unique
    const existingTenant = await this.getTenantBySlug(slug);
    if (existingTenant) {
      throw new Error('Tenant with this slug already exists');
    }

    const query = `
      INSERT INTO tenants (id, name, slug, description, settings)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const params = [
      uuidv4(),
      name,
      slug.toLowerCase(),
      description,
      settings,
    ];

    const result = await executeQuerySingle<Tenant>(query, params);

    if (!result) {
      throw new Error('Failed to create tenant');
    }

    return {
      ...result,
      createdAt: new Date((result as any).created_at),
      updatedAt: new Date((result as any).updated_at),
      settings: result.settings || {},
    };
  }

  // Get tenant by ID
  async getTenantById(id: string): Promise<Tenant | null> {
    const query = `
      SELECT * FROM tenants
      WHERE id = $1 AND is_active = true
    `;

    const result = await executeQuerySingle<Tenant>(query, [id]);

    if (!result) return null;

    return {
      ...result,
      createdAt: new Date((result as any).created_at),
      updatedAt: new Date((result as any).updated_at),
      settings: result.settings || {},
    };
  }

  // Get tenant by slug
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const query = `
      SELECT * FROM tenants
      WHERE slug = $1 AND is_active = true
    `;

    const result = await executeQuerySingle<Tenant>(query, [slug.toLowerCase()]);

    if (!result) return null;

    return {
      ...result,
      createdAt: new Date((result as any).created_at),
      updatedAt: new Date((result as any).updated_at),
      settings: result.settings || {},
    };
  }

  // Update tenant
  async updateTenant(id: string, updates: UpdateTenantData): Promise<Tenant | null> {
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      params.push(updates.description);
    }

    if (updates.settings !== undefined) {
      updateFields.push(`settings = $${paramIndex++}`);
      params.push(updates.settings);
    }

    if (updates.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      params.push(updates.isActive);
    }

    if (updateFields.length === 0) return await this.getTenantById(id);

    updateFields.push('updated_at = NOW()');

    const query = `
      UPDATE tenants
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++}
      RETURNING *
    `;

    params.push(id);

    const result = await executeQuerySingle<Tenant>(query, params);

    if (!result) return null;

    return {
      ...result,
      createdAt: new Date((result as any).created_at),
      updatedAt: new Date((result as any).updated_at),
      settings: result.settings || {},
    };
  }

  // Delete tenant (soft delete)
  async deleteTenant(id: string): Promise<boolean> {
    const query = `
      UPDATE tenants
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `;

    const result = await executeQuery(query, [id]);
    return result.length > 0;
  }

  // List tenants with pagination
  async listTenants(options: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  } = {}): Promise<{ tenants: Tenant[]; total: number }> {
    const { limit = 50, offset = 0, isActive } = options;

    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex++}`;
      params.push(isActive);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM tenants WHERE ${whereClause}`;
    const countResult = await executeQuerySingle(countQuery, params);
    const total = parseInt(countResult?.total || '0');

    // Get tenants
    const tenantsQuery = `
      SELECT * FROM tenants
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(limit, offset);

    const tenants = await executeQuery<Tenant>(tenantsQuery, params);

    return {
      tenants: tenants.map(tenant => ({
        ...tenant,
        createdAt: (tenant as any).created_at ? new Date((tenant as any).created_at) : new Date(),
        updatedAt: (tenant as any).updated_at ? new Date((tenant as any).updated_at) : new Date(),
        settings: tenant.settings || {},
      })),
      total,
    };
  }

  // Get tenant statistics
  async getTenantStats(tenantId: string): Promise<{
    totalUsers: number;
    totalMemories: number;
    totalConversations: number;
    storageUsed: number; // in MB
    activeUsers: number;
  }> {
    const userQuery = 'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND is_active = true';
    const memoryQuery = 'SELECT COUNT(*) as count FROM memories WHERE tenant_id = $1 AND is_deleted = false';
    const conversationQuery = 'SELECT COUNT(*) as count FROM conversations WHERE tenant_id = $1 AND is_active = true';
    const activeUserQuery = 'SELECT COUNT(DISTINCT user_id) as count FROM memories WHERE tenant_id = $1 AND is_deleted = false AND created_at >= NOW() - INTERVAL \'30 days\'';

    const [userResult, memoryResult, conversationResult, activeUserResult] = await Promise.all([
      executeQuerySingle(userQuery, [tenantId]),
      executeQuerySingle(memoryQuery, [tenantId]),
      executeQuerySingle(conversationQuery, [tenantId]),
      executeQuerySingle(activeUserQuery, [tenantId]),
    ]);

    // Estimate storage used (rough calculation)
    const memoryCount = parseInt(memoryResult?.count || '0');
    const estimatedStorageMB = Math.round((memoryCount * 0.5) / 1024 / 1024 * 100) / 100; // Rough estimate per memory

    return {
      totalUsers: parseInt(userResult?.count || '0'),
      totalMemories: memoryCount,
      totalConversations: parseInt(conversationResult?.count || '0'),
      storageUsed: estimatedStorageMB,
      activeUsers: parseInt(activeUserResult?.count || '0'),
    };
  }

  // Get default tenant (for single-tenant setups)
  async getDefaultTenant(): Promise<Tenant | null> {
    return await this.getTenantBySlug('default');
  }

  // Validate tenant access for user
  async validateUserTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM users
      WHERE id = $1 AND tenant_id = $2 AND is_active = true
    `;

    const result = await executeQuerySingle(query, [userId, tenantId]);
    return parseInt(result?.count || '0') > 0;
  }

  // Transfer user to different tenant (admin operation)
  async transferUserToTenant(userId: string, newTenantId: string): Promise<boolean> {
    // Verify new tenant exists and is active
    const newTenant = await this.getTenantById(newTenantId);
    if (!newTenant) {
      throw new Error('Target tenant not found');
    }

    const query = `
      UPDATE users
      SET tenant_id = $1, updated_at = NOW()
      WHERE id = $2
    `;

    const result = await executeQuery(query, [newTenantId, userId]);
    return result.length > 0;
  }

  // Get tenant by user ID
  async getTenantByUserId(userId: string): Promise<Tenant | null> {
    const query = `
      SELECT t.* FROM tenants t
      JOIN users u ON t.id = u.tenant_id
      WHERE u.id = $1 AND u.is_active = true AND t.is_active = true
    `;

    const result = await executeQuerySingle<Tenant>(query, [userId]);

    if (!result) return null;

    return {
      ...result,
      createdAt: new Date((result as any).created_at),
      updatedAt: new Date((result as any).updated_at),
      settings: result.settings || {},
    };
  }
}

// Factory function to create tenant service
export const createTenantService = () => {
  return new TenantService();
};

// Middleware to extract tenant from request
export const extractTenant = async (req: any, res: any, next: any) => {
  try {
    // Try to get tenant from various sources
    let tenantId = req.headers['x-tenant-id'] ||
                   req.query.tenantId ||
                   req.body?.tenantId;

    // If no tenant specified, use default
    if (!tenantId) {
      const tenantService = createTenantService();
      const defaultTenant = await tenantService.getDefaultTenant();
      tenantId = defaultTenant?.id;
    }

    if (tenantId) {
      req.tenantId = tenantId;
    }

    next();
  } catch (error) {
    console.error('Tenant extraction error:', error);
    next();
  }
};
