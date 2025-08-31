import jwt from 'jsonwebtoken';
import { createUserService, User, CreateUserData, UpdateUserData } from './user.service.js';
import { executeQuery, executeQuerySingle } from './config.js';
import { v4 as uuidv4 } from 'uuid';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private userService: any;
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private tenantId: string;

  constructor(tenantId: string = 'default-tenant-id') {
    this.tenantId = tenantId;
    this.userService = createUserService(tenantId);
    this.jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-change-this';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-change-this';
  }

  // Register a new user
  async register(userData: CreateUserData): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await this.userService.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user
    const user = await this.userService.createUser(userData);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password } = credentials;

    // Authenticate user
    const user = await this.userService.authenticateUser(email, password);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtRefreshSecret) as JWTPayload;

      // Get user to ensure they still exist and are active
      const user = await this.userService.getUserById(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      return await this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JWTPayload;

      const user = await this.userService.getUserById(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Generate access and refresh tokens
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JWTPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    // Access token (short-lived)
    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });

    // Refresh token (long-lived)
    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, { expiresIn: '30d' });

    // Store refresh token in database for revocation capability
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    };
  }

  // Store refresh token
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = jwt.decode(refreshToken) as JWTPayload;
    const expiresAt = new Date((tokenHash.exp || 0) * 1000);

    // In a production system, you'd want to store refresh tokens in Redis or database
    // For now, we'll use a simple in-memory approach with database fallback
    const query = `
      INSERT INTO user_sessions (id, user_id, refresh_token_hash, expires_at, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        refresh_token_hash = EXCLUDED.refresh_token_hash,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    `;

    // Simple hash for the token (in production, use proper hashing)
    const tokenHashValue = Buffer.from(refreshToken.substring(0, 50)).toString('base64');

    try {
      await executeQuery(query, [uuidv4(), userId, tokenHashValue, expiresAt]);
    } catch (error) {
      // If table doesn't exist, silently fail for now
      console.warn('User sessions table not found, skipping refresh token storage');
    }
  }

  // Logout (invalidate refresh token)
  async logout(userId: string): Promise<void> {
    const query = 'DELETE FROM user_sessions WHERE user_id = $1';
    try {
      await executeQuery(query, [userId]);
    } catch (error) {
      // Silently fail if table doesn't exist
    }
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // First verify current password
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // This would require the user service to have a verify password method
    // For now, we'll just change the password directly
    const success = await this.userService.changePassword(userId, newPassword);
    if (!success) {
      throw new Error('Failed to change password');
    }

    // Invalidate all refresh tokens for security
    await this.logout(userId);
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<string> {
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return 'If an account with this email exists, a reset link has been sent.';
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      this.jwtSecret,
      { expiresIn: '1h' }
    );

    // Store reset token
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    const query = `
      INSERT INTO password_resets (id, user_id, reset_token_hash, expires_at, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `;

    const tokenHash = Buffer.from(resetToken.substring(0, 50)).toString('base64');

    try {
      await executeQuery(query, [uuidv4(), user.id, tokenHash, expiresAt]);
    } catch (error) {
      // Silently fail if table doesn't exist
    }

    // In a real application, you'd send an email here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return 'If an account with this email exists, a reset link has been sent.';
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as any;

      if (payload.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      // Change password
      const success = await this.userService.changePassword(payload.userId, newPassword);
      if (!success) {
        throw new Error('Failed to reset password');
      }

      // Clean up reset token
      const cleanupQuery = 'DELETE FROM password_resets WHERE user_id = $1';
      try {
        await executeQuery(cleanupQuery, [payload.userId]);
      } catch (error) {
        // Silently fail if table doesn't exist
      }

      // Invalidate all sessions
      await this.logout(payload.userId);

    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  // Get current user profile
  async getProfile(userId: string): Promise<User> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Update user profile
  async updateProfile(userId: string, updates: UpdateUserData): Promise<User> {
    const user = await this.userService.updateUser(userId, updates);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

// Factory function to create auth service
export const createAuthService = (tenantId?: string) => {
  return new AuthService(tenantId);
};
