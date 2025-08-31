#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { crawlDirectory } from '../crawler/service.js';
import { initMemoryContainer } from '../storage/container.js';
import express, { Request, Response, NextFunction } from 'express';
import { registerMemoryRoutes } from '../api/memory.routes.js';
import { registerExportRoutes } from '../api/export.routes.js';
import { registerChatRoutes } from '../api/chat.routes.js';
import { registerIntegrationRoutes } from '../api/integration.routes.js';
import { authRouter } from '../api/auth.routes.js';
import { apiKeyRouter } from '../api/api-key.routes.js';
import { chatInterfaceService } from '../chat/interface.js';
import { chatImportService } from '../chat/service.js';
import { ChatParser } from '../chat/parser.js';
import {
  securityHeaders,
  corsOptions,
  apiRateLimiter,
  requestSizeLimiter,
  sanitizeInput,
  securityLogger,
} from '../security/middleware.js';
import { monitoringRouter, metricsMiddleware } from '../monitoring/routes.js';
import { recordResponseMetrics } from '../monitoring/metrics.js';
import { apiKeyAuth, bruteForceProtection } from '../security/auth.js';
import dotenv from 'dotenv';

const program = new Command();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, '../../package.json');

function readPackageVersion(): string {
  try {
    const raw = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function isBrandingEnabled(): boolean {
  return (process.env.VALORA_BRAND || 'on').toLowerCase() !== 'off';
}

function printBanner(): void {
  if (!isBrandingEnabled()) return;
  const asciiLogo = `
██╗   ██╗ █████╗ ██╗      ██████╗ ██████╗  █████╗
██║   ██║██╔══██╗██║     ██╔═══██╗██╔══██╗██╔══██╗
██║   ██║███████║██║     ██║   ██║██████╔╝███████║
╚██╗ ██╔╝██╔══██║██║     ██║   ██║██╔══██╗██╔══██║
 ╚████╔╝ ██║  ██║███████╗╚██████╔╝██║  ██║██║  ██║
  ╚═══╝  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝

`;
  console.log(asciiLogo);
  if (isBrandingEnabled()) {
    console.log('Powered by Nkiru Technologies');
  }
}

const startServer = async () => {
  dotenv.config();
  printBanner();
  const app = express();
  const PORT = process.env.VALORA_PORT || process.env.PORT || 3000;

  // Security middleware (order matters!)
  app.use(securityHeaders);
  app.use(corsOptions);
  app.use(requestSizeLimiter);
  app.use(sanitizeInput);
  app.use(securityLogger);
  app.use(apiRateLimiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Monitoring routes (before rate limiting and other middleware)
  app.use('/monitoring', monitoringRouter);

  // Apply metrics middleware to all other routes
  app.use(metricsMiddleware);

  // Brute force protection for authentication endpoints
  app.use('/auth', (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (bruteForceProtection.isBlocked(clientIP)) {
      res.status(429).json({
        error: 'Too many failed attempts. Please try again later.',
      });
      return;
    }

    next();
  });

  // Register routes with enhanced security
  registerMemoryRoutes(app);
  registerExportRoutes(app);
  registerChatRoutes(app);
  registerIntegrationRoutes(app);

  // Authentication and user management routes
  app.use('/auth', authRouter);
  app.use('/api-keys', apiKeyRouter);

  // Start memory container
  await initMemoryContainer();

  // Health check (no authentication required)
  const healthCheckHandler = (req: Request, res: Response) => {
    res.json({
      status: 'Valora MCP Server is running.',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  };
  app.get('/health', healthCheckHandler);

  // Security endpoint for checking authentication
  app.get('/auth/status', apiKeyAuth, (req: Request, res: Response) => {
    res.json({
      authenticated: true,
      user: (req as any).user,
      timestamp: new Date().toISOString(),
    });
  });

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    recordResponseMetrics(res);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  // 404 handler
  app.use('*', (req: Request, res: Response) => {
    recordResponseMetrics(res);
    res.status(404).json({ error: 'Endpoint not found' });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Valora MCP Server running on http://localhost:${PORT}`);
    console.log(`🔒 Security features enabled: CORS, Rate Limiting, Input Sanitization`);
  });
}

program
  .command('start')
  .description('Start the Valora MCP Server.')
  .action(startServer);

program
  .command('crawl')
  .description('Crawl a directory and ingest files into the memory container.')
  .option(
    '-e, --ext <extensions>',
    'Comma-separated list of file extensions to ingest (e.g., .ts,.js,.md)',
    '.ts,.tsx,.js,.jsx,.md'
  )
  .action(async (directory, options) => {
    await initMemoryContainer();
    const extensions = options.ext.split(',');
    console.log(
      `Crawling directory "${directory}" for files with extensions: ${extensions.join(
        ', '
      )}`
    );
    await crawlDirectory(directory, extensions);
    console.log('✅ Crawl complete.');
  });

program
  .command('about')
  .description('Show information about Valora')
  .action(() => {
    printBanner();
    const version = readPackageVersion();
    console.log(`Valora MCP Server v${version}`);
    console.log('A Memory Container Protocol (MCP) Server for sovereign, encrypted knowledge storage and retrieval.');
    console.log(`Branding: ${isBrandingEnabled() ? 'Enabled' : 'Disabled'}`);
    if (isBrandingEnabled()) {
      console.log('Company: Nkiru Technologies');
    }
  });

program
  .command('chat')
  .description('Start an interactive chat interface to search and manage memories')
  .action(async () => {
    await initMemoryContainer();
    chatInterfaceService.start();
  });

program
  .command('import-chat <file>')
  .description('Import a chat conversation from a JSON file')
  .option('-s, --source <source>', 'Source of the chat (e.g., "chatgpt", "claude")', 'chat-import')
  .action(async (file, options) => {
    try {
      await initMemoryContainer();

      if (!fs.existsSync(file)) {
        console.error(`❌ File not found: ${file}`);
        process.exit(1);
      }

      const fileContent = fs.readFileSync(file, 'utf-8');
      const chatData = JSON.parse(fileContent);

      console.log(`📥 Importing chat from ${file}...`);
      console.log(`📊 Found ${chatData.messages?.length || 0} messages`);

      const memories = await chatImportService.importChat(chatData);

      console.log(`✅ Successfully imported ${memories.length} messages`);
      console.log(`🆔 Conversation ID: ${chatData.conversationId}`);
      console.log(`🏷️  Tags: ${chatData.tags?.join(', ') || 'none'}`);

    } catch (error: any) {
      console.error('❌ Failed to import chat:', error.message);
      process.exit(1);
    }
  });

program
  .command('paste-chat')
  .description('Convert copy/pasted chat content to JSON format for import')
  .option('-f, --format <format>', 'Chat format: chatgpt, claude, or generic', 'auto')
  .option('-i, --id <id>', 'Custom conversation ID')
  .option('-t, --tags <tags>', 'Comma-separated tags to add', '')
  .action(async (options) => {
    console.log('📋 Paste your chat conversation below (press Ctrl+D when done):');
    console.log('='.repeat(60));

    const chunks: string[] = [];
    process.stdin.on('data', (chunk) => {
      chunks.push(chunk.toString());
    });

    process.stdin.on('end', async () => {
      try {
        const chatText = chunks.join('');

        if (!chatText.trim()) {
          console.error('❌ No content provided');
          process.exit(1);
        }

        console.log('\n🔄 Parsing chat content...');

        let format: 'chatgpt' | 'claude' | 'generic' | undefined;
        if (options.format !== 'auto') {
          format = options.format;
        }

        const chatData = ChatParser.parse(chatText, format, options.id);

        // Add custom tags if provided
        if (options.tags) {
          const customTags = options.tags.split(',').map((tag: string) => tag.trim());
          chatData.tags = [...(chatData.tags || []), ...customTags];
        }

        console.log(`📊 Parsed ${chatData.messages.length} messages`);
        console.log(`🔍 Detected format: ${chatData.source}`);
        console.log(`🏷️  Tags: ${chatData.tags?.join(', ') || 'none'}`);

        // Save to temporary file
        const tempFile = `/tmp/valora-chat-${Date.now()}.json`;
        fs.writeFileSync(tempFile, JSON.stringify(chatData, null, 2));

        console.log(`\n💾 JSON saved to: ${tempFile}`);
        console.log('\n🚀 To import this chat, run:');
        console.log(`   node build/cli/index.js import-chat "${tempFile}"`);
        console.log('\n📋 Or use the JSON content above with the API endpoint:');
        console.log('   POST /chat/import');

      } catch (error: any) {
        console.error('❌ Failed to parse chat:', error.message);
        process.exit(1);
      }
    });

    process.stdin.setEncoding('utf8');
    process.stdin.resume();
  });

program.parse(process.argv);
