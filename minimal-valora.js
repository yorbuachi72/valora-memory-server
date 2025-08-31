import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check (no authentication required)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Valora MCP Server is running.',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// Simple API key auth for testing
const apiKeyAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
    }

    const apiKey = authHeader.substring(7);
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

    next();
};

// Test protected endpoint
app.get('/auth/status', apiKeyAuth, (req, res) => {
    res.json({
        authenticated: true,
        user: { type: 'api-key', id: 'api-user' },
        timestamp: new Date().toISOString(),
    });
});

// Integration test endpoints
app.get('/integrations/status', apiKeyAuth, (req, res) => {
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
        ]
    });
});

app.post('/integrations/webhooks', apiKeyAuth, (req, res) => {
    res.status(201).json({
        id: 'test-webhook-id',
        message: 'Webhook registered successfully',
        config: req.body
    });
});

app.get('/integrations/webhooks', apiKeyAuth, (req, res) => {
    res.json([]);
});

app.listen(PORT, () => {
    console.log(`🚀 Minimal Valora MCP Server running on http://localhost:${PORT}`);
    console.log(`🔒 API Key: ${process.env.VALORA_API_KEY || 'NOT SET'}`);
});
