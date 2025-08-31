import { z } from 'zod';

// Base validation schemas
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();

// Content validation
export const contentSchema = z.string()
  .min(1, 'Content cannot be empty')
  .max(1000000, 'Content too large (max 1MB)')
  .refine((content) => {
    // Check for potentially malicious content
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(content));
  }, 'Content contains potentially malicious code');

// Source validation
export const sourceSchema = z.string()
  .min(1, 'Source cannot be empty')
  .max(500, 'Source too long')
  .refine((source) => {
    // Validate source format
    const validPatterns = [
      /^file:\/\/.+/,
      /^https?:\/\/.+/,
      /^manual-.+/,
      /^import-.+/,
      /^chat-.+/,
    ];
    
    return validPatterns.some(pattern => pattern.test(source));
  }, 'Invalid source format');

// Tag validation
export const tagSchema = z.string()
  .min(1, 'Tag cannot be empty')
  .max(50, 'Tag too long')
  .regex(/^[a-zA-Z0-9\-\_]+$/, 'Tag contains invalid characters');

// Memory creation schema
export const createMemorySchema = z.object({
  content: contentSchema,
  source: sourceSchema,
  tags: z.array(tagSchema).optional(),
  metadata: z.record(z.any()).optional(),
});

// Memory update schema
export const updateMemorySchema = createMemorySchema.partial();

// Search query validation
export const searchQuerySchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(1000, 'Query too long')
    .refine((query) => {
      // Check for SQL injection patterns
      const sqlPatterns = [
        /(\b(union|select|insert|update|delete|drop|create|alter)\b)/gi,
        /(\b(and|or)\b\s+\d+\s*[=<>])/gi,
        /(\b(and|or)\b\s+['"][^'"]*['"])/gi,
      ];
      
      return !sqlPatterns.some(pattern => pattern.test(query));
    }, 'Query contains potentially malicious patterns'),
});

// Export bundle schema
export const exportBundleSchema = z.object({
  memoryIds: z.array(uuidSchema)
    .min(1, 'At least one memory ID required')
    .max(100, 'Too many memory IDs (max 100)'),
  format: z.enum(['markdown', 'text', 'json', 'conversation']).optional(),
});

// Chat import schemas
export const chatMessageSchema = z.object({
  participant: z.string()
    .min(1, 'Participant cannot be empty')
    .max(100, 'Participant name too long')
    .regex(/^[a-zA-Z0-9\-\_\s]+$/, 'Invalid participant name'),
  content: contentSchema,
  timestamp: z.coerce.date().optional(),
});

export const chatImportSchema = z.object({
  conversationId: z.string()
    .min(1, 'Conversation ID cannot be empty')
    .max(200, 'Conversation ID too long')
    .regex(/^[a-zA-Z0-9\-\_]+$/, 'Invalid conversation ID'),
  messages: z.array(chatMessageSchema)
    .min(1, 'At least one message required')
    .max(1000, 'Too many messages (max 1000)'),
  source: sourceSchema,
  tags: z.array(tagSchema).optional(),
  metadata: z.record(z.any()).optional(),
  context: z.string().max(1000, 'Context too long').optional(),
});

export const formatImportSchema = z.object({
  content: contentSchema,
  format: z.enum(['json', 'text', 'markdown']),
  source: sourceSchema,
  conversationId: z.string()
    .max(200, 'Conversation ID too long')
    .regex(/^[a-zA-Z0-9\-\_]+$/, 'Invalid conversation ID')
    .optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['timestamp', 'content', 'source']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Filter schema
export const filterSchema = z.object({
  contentType: z.enum(['chat', 'code', 'documentation', 'note']).optional(),
  tags: z.array(tagSchema).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  conversationId: z.string().optional(),
});

// Input sanitization functions
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
};

// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
};

// Query parameter validation
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors,
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
};
