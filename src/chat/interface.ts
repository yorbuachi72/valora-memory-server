import * as readline from 'readline';
import { searchMemories, saveMemory, getMemory } from '../storage/container.js';
import { exportService } from '../export/service.js';
import { Memory } from '../types/memory.js';
import { randomUUID } from 'crypto';

interface ChatContext {
  lastSearchResults: Memory[];
  conversationHistory: string[];
}

class ChatInterfaceService {
  private rl: readline.Interface;
  private context: ChatContext;
  private apiKey: string;

  constructor() {
    this.context = {
      lastSearchResults: [],
      conversationHistory: [],
    };

    this.apiKey = process.env.VALORA_API_KEY || '';

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 Valora > ',
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.rl.on('line', async (input) => {
      await this.handleInput(input.trim());
    });

    this.rl.on('close', () => {
      console.log('\n👋 Goodbye! Your memories are safe with Valora.');
      process.exit(0);
    });
  }

  private async handleInput(input: string) {
    if (!input) {
      this.rl.prompt();
      return;
    }

    this.context.conversationHistory.push(input);

    // Handle special commands
    if (input.toLowerCase() === 'help' || input === '?') {
      this.showHelp();
      this.rl.prompt();
      return;
    }

    if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
      this.rl.close();
      return;
    }

    if (input.toLowerCase().startsWith('search ')) {
      const query = input.substring(7).trim();
      await this.handleSearch(query);
      return;
    }

    if (input.toLowerCase().startsWith('remember ')) {
      const content = input.substring(9).trim();
      await this.handleRemember(content);
      return;
    }

    if (input.toLowerCase().startsWith('show ')) {
      const id = input.substring(5).trim();
      await this.handleShow(id);
      return;
    }

    if (input.toLowerCase() === 'export last') {
      await this.handleExportLast();
      return;
    }

    if (input.toLowerCase() === 'history') {
      this.showHistory();
      this.rl.prompt();
      return;
    }

    // Default: treat as search query
    await this.handleSearch(input);
  }

  private showHelp() {
    console.log('\n🤖 Valora Chat Help');
    console.log('===================');
    console.log('Commands:');
    console.log('  help          - Show this help message');
    console.log('  quit/exit     - Exit the chat');
    console.log('  search <query> - Search memories');
    console.log('  remember <text> - Create a new memory');
    console.log('  show <id>     - Show a specific memory');
    console.log('  export last  - Export the last search results');
    console.log('  history      - Show conversation history');
    console.log('\nOr just type any question to search your memories!');
    console.log('');
  }

  private async handleSearch(query: string) {
    try {
      console.log(`🔍 Searching for: "${query}"`);

      const results = await searchMemories(query);
      this.context.lastSearchResults = results;

      if (results.length === 0) {
        console.log('❌ No memories found. Try a different search term.');
      } else {
        console.log(`📚 Found ${results.length} relevant memories:\n`);

        results.forEach((memory, index) => {
          console.log(`${index + 1}. 📝 Memory ${memory.id.slice(0, 8)}...`);
          console.log(`   Source: ${memory.source}`);
          console.log(`   Timestamp: ${memory.timestamp.toISOString()}`);
          console.log(`   Content: ${memory.content.slice(0, 100)}${memory.content.length > 100 ? '...' : ''}`);

          if (memory.inferredTags && memory.inferredTags.length > 0) {
            console.log(`   Tags: ${memory.tags.concat(memory.inferredTags).join(', ')}`);
          }

          console.log('');
        });

        console.log('💡 Type "export last" to get these as a bundle, or "show <id>" to see full details.');
      }
    } catch (error: any) {
      console.error('❌ Search failed:', error.message);
    }

    this.rl.prompt();
  }

  private async handleRemember(content: string) {
    try {
      console.log('💾 Creating new memory...');

      const newMemory: Memory = {
        id: randomUUID(),
        content,
        source: 'chat-interface',
        timestamp: new Date(),
        version: 1,
        tags: ['manual-entry'],
        metadata: {},
      };

      await saveMemory(newMemory);
      console.log(`✅ Memory saved! ID: ${newMemory.id.slice(0, 8)}...`);

    } catch (error: any) {
      console.error('❌ Failed to save memory:', error.message);
    }

    this.rl.prompt();
  }

  private async handleShow(id: string) {
    try {
      console.log(`🔍 Looking up memory: ${id}`);

      const memory = await getMemory(id);

      if (!memory) {
        console.log('❌ Memory not found. Try searching first to see available IDs.');
      } else {
        console.log('\n📖 Full Memory Details');
        console.log('======================');
        console.log(`ID: ${memory.id}`);
        console.log(`Source: ${memory.source}`);
        console.log(`Timestamp: ${memory.timestamp.toISOString()}`);
        console.log(`Version: ${memory.version}`);
        console.log(`Tags: ${memory.tags.join(', ')}`);

        if (memory.inferredTags && memory.inferredTags.length > 0) {
          console.log(`Inferred Tags: ${memory.inferredTags.join(', ')}`);
        }

        console.log('\nContent:');
        console.log(memory.content);

        if (memory.metadata && Object.keys(memory.metadata).length > 0) {
          console.log('\nMetadata:');
          console.log(JSON.stringify(memory.metadata, null, 2));
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to retrieve memory:', error.message);
    }

    this.rl.prompt();
  }

  private async handleExportLast() {
    try {
      if (this.context.lastSearchResults.length === 0) {
        console.log('❌ No recent search results to export. Try searching first.');
      } else {
        console.log('📦 Exporting last search results...\n');

        const formattedBundle = exportService.formatMemories(
          this.context.lastSearchResults,
          'markdown'
        );

        console.log('--- EXPORTED BUNDLE ---');
        console.log(formattedBundle);
        console.log('--- END BUNDLE ---');

        console.log('\n💡 Copy the content above to use as context in your AI tools!');
      }
    } catch (error: any) {
      console.error('❌ Export failed:', error.message);
    }

    this.rl.prompt();
  }

  private showHistory() {
    console.log('\n📜 Conversation History');
    console.log('=======================');

    if (this.context.conversationHistory.length === 0) {
      console.log('No conversation history yet.');
    } else {
      this.context.conversationHistory.forEach((message, index) => {
        console.log(`${index + 1}. ${message}`);
      });
    }

    console.log('');
  }

  public start() {
    console.log('🤖 Welcome to Valora Chat!');
    console.log('===========================');
    console.log('Type your questions or use commands. Type "help" for assistance.');
    console.log('');

    this.rl.prompt();
  }
}

export const chatInterfaceService = new ChatInterfaceService();
