import { Request, Response, NextFunction } from 'express';
import { apiKeyManager, APIKey } from './api-key-manager.js';

export interface AuthenticatedRequest extends Request {
  apiKey?: APIKey;
  user?: {
    type: 'api-key';
    id: string;
    permissions: string[];
  };
}

// Enhanced API Key Authentication Middleware
export const enhancedApiKeyAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const startTime = Date.now();
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ 
      error: 'Missing or invalid authorization header',
      code: 'MISSING_AUTH_HEADER'
    });
    return;
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  const validatedKey = await apiKeyManager.validateAPIKey(apiKey);

  if (!validatedKey) {
    res.status(401).json({ 
      error: 'Invalid or expired API key',
      code: 'INVALID_API_KEY'
    });
    return;
  }

  // Check rate limiting
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const withinRateLimit = await apiKeyManager.checkRateLimit(validatedKey, clientIP);

  if (!withinRateLimit) {
    res.status(429).json({ 
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED'
    });
    return;
  }

  // Add API key and user info to request
  req.apiKey = validatedKey;
  req.user = {
    type: 'api-key',
    id: validatedKey.id,
    permissions: validatedKey.permissions
  };

  // Log usage after response
  const responseTime = Date.now() - startTime;
  res.on('finish', () => {
    apiKeyManager.logUsage({
      keyId: validatedKey.id,
      endpoint: req.path,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      responseTime,
      statusCode: res.statusCode
    });
  });

  next();
};

// Permission-based middleware
export const requirePermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.apiKey) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const hasPermission = await apiKeyManager.checkPermission(req.apiKey, permission);
    
    if (!hasPermission) {
      res.status(403).json({ 
        error: `Insufficient permissions. Required: ${permission}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission,
        available: req.apiKey.permissions
      });
      return;
    }

    next();
  };
};

// Role-based middleware
export const requireRole = (roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.apiKey) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const hasRole = req.apiKey.permissions.some(permission => 
      roles.includes(permission) || permission === 'admin'
    );
    
    if (!hasRole) {
      res.status(403).json({ 
        error: `Insufficient role. Required: ${roles.join(' or ')}`,
        code: 'INSUFFICIENT_ROLE',
        required: roles,
        available: req.apiKey.permissions
      });
      return;
    }

    next();
  };
};

// Admin-only middleware
export const requireAdmin = requireRole(['admin']);

// Read-only middleware
export const requireRead = requirePermission('read');

// Write permission middleware
export const requireWrite = requirePermission('write');

// Integration permission middleware
export const requireIntegrations = requirePermission('integrations');

// Audit logging middleware
export const auditLog = (action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      if (req.apiKey) {
        console.log(`🔍 AUDIT: ${req.apiKey.name} (${req.apiKey.id}) performed ${action} on ${req.path} - Status: ${res.statusCode}`);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};
