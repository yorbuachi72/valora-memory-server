import express from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'Valora MCP Server is running.',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Minimal test server running on http://localhost:${PORT}`);
});
