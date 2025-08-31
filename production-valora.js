import express from 'express';
import dotenv from 'dotenv';
import { enhancedApiKeyAuth, requireRead, requireWrite, requireIntegrations, auditLog } from './src/security/enhanced-auth.js';
import { apiKeyManager } from './src/security/api-key-manager.js';
import { registerAPIKeyRoutes } from './src/api/api-key.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request ID for tracking
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  next();
});

// Health check (no authentication required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Valora MCP Server is running.',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API key management routes
registerAPIKeyRoutes(app);

// Memory operations (with permissions)
app.get('/memory/:id', enhancedApiKeyAuth, requireRead, auditLog('read memory'), (req, res) => {
  res.json({
    id: req.params.id,
    content: 'Sample memory content',
    timestamp: new Date().toISOString(),
    apiKey: req.apiKey?.name
  });
});

app.post('/memory', enhancedApiKeyAuth, requireWrite, auditLog('create memory'), (req, res) => {
  res.status(201).json({
    id: Math.random().toString(36).substr(2, 9),
    content: req.body.content,
    timestamp: new Date().toISOString(),
    apiKey: req.apiKey?.name
  });
});

// Integration endpoints (with integration permissions)
app.get('/integrations/status', enhancedApiKeyAuth, requireIntegrations, auditLog('check integration status'), (req, res) => {
  res.json({
    webhooks: { total: 0, enabled: 0, disabled: 0 },
    plugins: { total: 0, enabled: 0, disabled: 0 },
    events: [
      'memory.created',
      'memory.updated',
      'memory.deleted',
      'chat.imported',
      'search.performed',
      'export.completed'
    ],
    apiKey: req.apiKey?.name
  });
});

app.post('/integrations/webhooks', enhancedApiKeyAuth, requireIntegrations, auditLog('register webhook'), (req, res) => {
  res.status(201).json({
    id: 'webhook_' + Math.random().toString(36).substr(2, 9),
    message: 'Webhook registered successfully',
    config: req.body,
    apiKey: req.apiKey?.name
  });
});

app.get('/integrations/webhooks', enhancedApiKeyAuth, requireIntegrations, auditLog('list webhooks'), (req, res) => {
  res.json([]);
});

// Validr integration endpoints
app.post('/integrations/validr/sync', enhancedApiKeyAuth, requireIntegrations, auditLog('sync to validr'), (req, res) => {
  res.json({
    message: 'Synced to Validr successfully',
    data: req.body,
    apiKey: req.apiKey?.name,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    requestId: req.id
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    requestId: req.id
  });
});

// Cleanup expired API keys periodically
setInterval(async () => {
  try {
    await apiKeyManager.cleanupExpiredKeys();
  } catch (error) {
    console.error('Failed to cleanup expired API keys:', error);
  }
}, 60 * 60 * 1000); // Run every hour

app.listen(PORT, () => {
  console.log(`🚀 Production Valora MCP Server running on http://localhost:${PORT}`);
  console.log(`🔒 Enhanced security features enabled`);
  console.log(`🔑 API Key management available at /api-keys`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log available API keys
  apiKeyManager.listAPIKeys().then(keys => {
    console.log(`🔑 Available API Keys: ${keys.length}`);
  });
});
