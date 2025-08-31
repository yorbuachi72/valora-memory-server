import express, { Request, Response, NextFunction } from 'express';
import { createAuthService } from '../database/auth.service.js';
import { z } from 'zod';

// Validation schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().optional(),
  fullName: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

const UpdateProfileSchema = z.object({
  username: z.string().optional(),
  fullName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  settings: z.record(z.any()).optional(),
});

// Types
type RegisterRequest = z.infer<typeof RegisterSchema>;
type LoginRequest = z.infer<typeof LoginSchema>;
type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;
type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;

// Auth service instance
const authService = createAuthService();

// Middleware to extract user from JWT token
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user has required role
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Register new user
const register = async (req: Request, res: Response) => {
  try {
    const validatedData = RegisterSchema.parse(req.body);

    const result = await authService.register(validatedData);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        fullName: result.user.fullName,
        role: result.user.role,
        createdAt: result.user.createdAt,
      },
      tokens: result.tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
};

// Login user
const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const result = await authService.login({ email, password });

    res.json({
      message: 'Login successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        fullName: result.user.fullName,
        role: result.user.role,
        lastLoginAt: result.user.lastLoginAt,
      },
      tokens: result.tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
};

// Refresh access token
const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      message: 'Token refreshed successfully',
      tokens,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(401).json({ error: message });
  }
};

// Logout user
const logout = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await authService.logout(user.id);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    res.status(500).json({ error: message });
  }
};

// Get current user profile
const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const profile = await authService.getProfile(user.id);

    res.json({
      user: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        settings: profile.settings,
        role: profile.role,
        emailVerified: profile.emailVerified,
        lastLoginAt: profile.lastLoginAt,
        createdAt: profile.createdAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get profile';
    res.status(500).json({ error: message });
  }
};

// Update user profile
const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const validatedData = UpdateProfileSchema.parse(req.body);

    const updatedUser = await authService.updateProfile(user.id, validatedData);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        avatarUrl: updatedUser.avatarUrl,
        settings: updatedUser.settings,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    const message = error instanceof Error ? error.message : 'Profile update failed';
    res.status(400).json({ error: message });
  }
};

// Change password
const changePassword = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);

    await authService.changePassword(user.id, currentPassword, newPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    const message = error instanceof Error ? error.message : 'Password change failed';
    res.status(400).json({ error: message });
  }
};

// Request password reset
const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const message = await authService.requestPasswordReset(email);
    res.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password reset request failed';
    res.status(500).json({ error: message });
  }
};

// Reset password with token
const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = ResetPasswordSchema.parse(req.body);

    await authService.resetPassword(token, newPassword);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    const message = error instanceof Error ? error.message : 'Password reset failed';
    res.status(400).json({ error: message });
  }
};

// Create auth router
export const authRouter = express.Router();

// Public routes (no authentication required)
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refreshToken);
authRouter.post('/password/reset-request', requestPasswordReset);
authRouter.post('/password/reset', resetPassword);

// Protected routes (authentication required)
authRouter.use(authenticateToken);
authRouter.post('/logout', logout);
authRouter.get('/profile', getProfile);
authRouter.put('/profile', updateProfile);
authRouter.post('/password/change', changePassword);


