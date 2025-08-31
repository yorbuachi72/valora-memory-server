#!/usr/bin/env node

import express from 'express';

const app = express();
const PORT = 3002;

// Minimal middleware
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'Valora Test Server is running.',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Minimal Test Server running on http://localhost:${PORT}`);
});
