import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeQuerySingle } from './config.js';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  settings: Record<string, any>;
  role: 'admin' | 'user' | 'viewer';
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
  tenantId?: string;
  role?: 'admin' | 'user' | 'viewer';
}

export interface UpdateUserData {
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  settings?: Record<string, any>;
  role?: 'admin' | 'user' | 'viewer';
  emailVerified?: boolean;
  isActive?: boolean;
}

export class UserService {
  private tenantId: string;

  constructor(tenantId: string = 'default-tenant-id') {
    this.tenantId = tenantId;
  }

  // Create a new user
  async createUser(userData: CreateUserData): Promise<User> {
    const { email, password, username, fullName, role = 'user' } = userData;
    const tenantId = userData.tenantId || this.tenantId;

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (
        id, tenant_id, email, username, full_name, password_hash, role
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const params = [
      uuidv4(),
      tenantId,
      email.toLowerCase(),
      username,
      fullName,
      passwordHash,
      role,
    ];

    const result = await executeQuerySingle<User>(query, params);

    if (!result) {
      throw new Error('Failed to create user');
    }

    return {
      ...result,
      lastLoginAt: (result as any).last_login_at ? new Date((result as any).last_login_at) : undefined,
      createdAt: new Date((result as any).created_at),
      updatedAt: new Date((result as any).updated_at),
      settings: result.settings || {},
    };
  }

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE id = $1 AND tenant_id = $2 AND is_active = true
    `;

    const result = await executeQuerySingle<User>(query, [id, this.tenantId]);

    if (!result) return null;

    return {
      ...result,
      lastLoginAt: (result as any).last_login_at ? new Date((result as any).last_login_at) : undefined,
      createdAt: new Date((result as any).created_at),
      updatedAt: new Date((result as any).updated_at),
      settings: result.settings || {},
    };
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE email = $1 AND tenant_id = $2 AND is_active = true
    `;

    const result = await executeQuerySingle<User>(query, [email.toLowerCase(), this.tenantId]);

    if (!result) return null;

    return {
      ...result,
      lastLoginAt: (result as any).last_login_at ? new Date((result as any).last_login_at) : undefined,
      createdAt: new Date((result as any).created_at),
      updatedAt: new Date((result as any).updated_at),
      settings: result.settings || {},
    };
  }

  // Authenticate user
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);

    if (!user) return null;

    // Get password hash from database
    const passwordQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const passwordResult = await executeQuerySingle(passwordQuery, [user.id]);

    if (!passwordResult?.password_hash) return null;

    // Verify password
    const isValidPassword = await bcrypt.compare(password, passwordResult.password_hash);

    if (!isValidPassword) return null;

    // Update last login
    await this.updateLastLogin(user.id);

    return user;
  }

  // Update user
  async updateUser(id: string, updates: UpdateUserData): Promise<User | null> {
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.username !== undefined) {
      updateFields.push(`username = $${paramIndex++}`);
      params.push(updates.username);
    }

    if (updates.fullName !== undefined) {
      updateFields.push(`full_name = $${paramIndex++}`);
      params.push(updates.fullName);
    }

    if (updates.avatarUrl !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex++}`);
      params.push(updates.avatarUrl);
    }

    if (updates.settings !== undefined) {
      updateFields.push(`settings = $${paramIndex++}`);
      params.push(updates.settings);
    }

    if (updates.role !== undefined) {
      updateFields.push(`role = $${paramIndex++}`);
      params.push(updates.role);
    }

    if (updates.emailVerified !== undefined) {
      updateFields.push(`email_verified = $${paramIndex++}`);
      params.push(updates.emailVerified);
    }

    if (updates.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      params.push(updates.isActive);
    }

    if (updateFields.length === 0) return await this.getUserById(id);

    updateFields.push('updated_at = NOW()');

    const query = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
      RETURNING *
    `;

    params.push(id, this.tenantId);

    const result = await executeQuerySingle<User>(query, params);

    if (!result) return null;

    return {
      ...result,
      lastLoginAt: (result as any).last_login_at ? new Date((result as any).last_login_at) : undefined,
      createdAt: new Date((result as any).created_at),
      updatedAt: new Date((result as any).updated_at),
      settings: result.settings || {},
    };
  }

  // Delete user (soft delete)
  async deleteUser(id: string): Promise<boolean> {
    const query = `
      UPDATE users
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await executeQuery(query, [id, this.tenantId]);
    return result.length > 0;
  }

  // Change password
  async changePassword(id: string, newPassword: string): Promise<boolean> {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
    `;

    const result = await executeQuery(query, [passwordHash, id, this.tenantId]);
    return result.length > 0;
  }

  // List users with pagination
  async listUsers(options: {
    limit?: number;
    offset?: number;
    role?: string;
    isActive?: boolean;
  } = {}): Promise<{ users: User[]; total: number }> {
    const { limit = 50, offset = 0, role, isActive } = options;

    let whereClause = 'tenant_id = $1';
    const params: any[] = [this.tenantId];
    let paramIndex = 2;

    if (role) {
      whereClause += ` AND role = $${paramIndex++}`;
      params.push(role);
    }

    if (isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex++}`;
      params.push(isActive);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
    const countResult = await executeQuerySingle(countQuery, params.slice(0, paramIndex - 1));
    const total = parseInt(countResult?.total || '0');

    // Get users
    const usersQuery = `
      SELECT * FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    params.push(limit, offset);

    const users = await executeQuery<User>(usersQuery, params);

    return {
      users: users.map(user => ({
        ...user,
        lastLoginAt: (user as any).last_login_at ? new Date((user as any).last_login_at) : undefined,
        createdAt: (user as any).created_at ? new Date((user as any).created_at) : new Date(),
        updatedAt: (user as any).updated_at ? new Date((user as any).updated_at) : new Date(),
        settings: user.settings || {},
      })),
      total,
    };
  }

  // Update last login timestamp
  private async updateLastLogin(id: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
    `;

    await executeQuery(query, [id, this.tenantId]);
  }

  // Get user statistics
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
    recentSignups: number; // Last 30 days
  }> {
    const totalQuery = 'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1';
    const activeQuery = 'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND is_active = true';
    const roleQuery = 'SELECT role, COUNT(*) as count FROM users WHERE tenant_id = $1 GROUP BY role';
    const recentQuery = 'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL \'30 days\'';

    const [totalResult, activeResult, roleResults, recentResult] = await Promise.all([
      executeQuerySingle(totalQuery, [this.tenantId]),
      executeQuerySingle(activeQuery, [this.tenantId]),
      executeQuery(roleQuery, [this.tenantId]),
      executeQuerySingle(recentQuery, [this.tenantId]),
    ]);

    const usersByRole: Record<string, number> = {};
    roleResults.forEach((row: any) => {
      usersByRole[row.role] = parseInt(row.count);
    });

    return {
      totalUsers: parseInt(totalResult?.count || '0'),
      activeUsers: parseInt(activeResult?.count || '0'),
      usersByRole,
      recentSignups: parseInt(recentResult?.count || '0'),
    };
  }
}

// Factory function to create user service
export const createUserService = (tenantId?: string) => {
  return new UserService(tenantId);
};
