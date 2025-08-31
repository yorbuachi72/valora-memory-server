import { Request, Response, NextFunction } from 'express';

// Simple API Key Authentication Middleware
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  const expectedApiKey = process.env.VALORA_API_KEY;

  if (!expectedApiKey) {
    console.error('VALORA_API_KEY environment variable not set');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  if (apiKey !== expectedApiKey) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  // Add user info to request
  (req as any).user = { type: 'api-key', id: 'api-user' };
  
  next();
};

// Simple brute force protection (in-memory for MVP)
interface AttemptRecord {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const failedAttempts = new Map<string, AttemptRecord>();

// Export for testing purposes
export { failedAttempts };
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 60 * 1000; // 1 minute

export const bruteForceProtection = {
  isBlocked: (identifier: string): boolean => {
    const record = failedAttempts.get(identifier);
    if (!record) return false;

    if (record.blockedUntil && Date.now() < record.blockedUntil) {
      return true;
    }

    // Reset if block duration has passed
    if (record.blockedUntil && Date.now() >= record.blockedUntil) {
      failedAttempts.delete(identifier);
      return false;
    }

    return false;
  },

  recordFailedAttempt: (identifier: string): void => {
    const record = failedAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    record.count++;
    record.lastAttempt = Date.now();

    if (record.count >= MAX_ATTEMPTS) {
      record.blockedUntil = Date.now() + BLOCK_DURATION;
    }

    failedAttempts.set(identifier, record);
  },

  recordSuccessfulAttempt: (identifier: string): void => {
    failedAttempts.delete(identifier);
  },

  isBlockedByIP: (ip: string): boolean => {
    return bruteForceProtection.isBlocked(`ip_${ip}`);
  },

  recordFailedAttemptByIP: (ip: string): void => {
    bruteForceProtection.recordFailedAttempt(`ip_${ip}`);
  },

  recordSuccessfulAttemptByIP: (ip: string): void => {
    bruteForceProtection.recordSuccessfulAttempt(`ip_${ip}`);
  },
};
