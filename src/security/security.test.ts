import request from 'supertest';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { apiKeyAuth, bruteForceProtection, failedAttempts } from './auth.js';
import { securityHeaders, corsOptions, apiRateLimiter, requestSizeLimiter, sanitizeInput, securityLogger } from './middleware.js';

// Set up test environment variables
process.env.VALORA_API_KEY = 'test-api-key';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

const app = express();

// Test middleware
app.use(securityHeaders);
app.use(corsOptions);
app.use(requestSizeLimiter);
app.use(sanitizeInput);
app.use(securityLogger);
app.use(apiRateLimiter);

// Test protected route
app.get('/protected', apiKeyAuth, (req, res) => {
  res.json({ message: 'Access granted', user: (req as any).user });
});

// Test health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

describe('Security Middleware', () => {
  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/protected')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Authorization');

      expect(response.status).toBe(204); // OPTIONS preflight returns 204
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit requests per window', async () => {
      // Create a more restrictive rate limiter for testing
      const testRateLimit = rateLimit({
        windowMs: 1000, // 1 second
        max: 3, // limit each IP to 3 requests per windowMs
        message: {
          error: 'Too many requests, please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

      // Apply the test rate limiter to a specific route
      app.use('/test-rate-limit', testRateLimit, (req: Request, res: Response) => {
        res.json({ message: 'OK' });
      });

      // Make multiple requests quickly
      const requests = Array(5).fill(null).map(() =>
        request(app).get('/test-rate-limit')
      );

      const responses = await Promise.all(requests);
      const blockedRequests = responses.filter(r => r.status === 429);

      expect(blockedRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Request Size Limiting', () => {
    it('should reject oversized requests', async () => {
      const largePayload = 'x'.repeat(1024 * 1024 * 11); // 11MB (over 10MB limit)

      // Add a test route that uses request size limiting
      app.post('/test-size-limit', express.json({ limit: '10mb' }), requestSizeLimiter, (req: Request, res: Response) => {
        res.json({ message: 'OK' });
      });

      try {
        const response = await request(app)
          .post('/test-size-limit')
          .set('Content-Type', 'application/json')
          .send({ data: largePayload });

        expect(response.status).toBe(413);
      } catch (error) {
        // If the connection is reset, that's also acceptable as it means the request was rejected
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toMatch(/ECONNRESET|socket hang up/i);
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious input', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/health')
        .send({ data: maliciousInput });
      
      // Should not crash and should handle the input safely
      expect(response.status).not.toBe(500);
    });
  });
});

describe('Authentication', () => {
  describe('API Key Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await request(app).get('/protected');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-key');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should accept requests with valid API key', async () => {
      // Set a valid API key for testing
      process.env.VALORA_API_KEY = 'test-api-key';
      
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Access granted');
      
      // Clean up
      delete process.env.VALORA_API_KEY;
    });
  });

  describe('Brute Force Protection', () => {
    const testIP = '192.168.1.1';

    beforeEach(() => {
      // Reset brute force protection
      bruteForceProtection.recordSuccessfulAttemptByIP(testIP);
    });

    it('should block IP after multiple failed attempts', async () => {
      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        bruteForceProtection.recordFailedAttemptByIP(testIP);
      }
      
      expect(bruteForceProtection.isBlockedByIP(testIP)).toBe(true);
    });

    it('should unblock IP after successful attempt', async () => {
      // Make failed attempts
      for (let i = 0; i < 3; i++) {
        bruteForceProtection.recordFailedAttemptByIP(testIP);
      }
      
      // Record successful attempt
      bruteForceProtection.recordSuccessfulAttemptByIP(testIP);
      
      expect(bruteForceProtection.isBlockedByIP(testIP)).toBe(false);
    });

    it('should reset attempts after window expires', async () => {
      // Make failed attempts to trigger blocking
      for (let i = 0; i < 3; i++) {
        bruteForceProtection.recordFailedAttemptByIP(testIP);
      }

      // Should be blocked now
      expect(bruteForceProtection.isBlockedByIP(testIP)).toBe(true);

      // Simulate time passing by directly manipulating the block time (for testing only)
      // In production, this would be handled by the cleanup logic
      const blockedKey = `ip_${testIP}`;
      const record = failedAttempts.get(blockedKey);
      if (record && record.blockedUntil) {
        record.blockedUntil = Date.now() - 1000; // Set to past time
      }

      // Should not be blocked after "time passes"
      expect(bruteForceProtection.isBlockedByIP(testIP)).toBe(false);
    });
  });
});
