# CLI Integration Guide

## Overview

Valora provides a powerful command-line interface (CLI) that enables developers and power users to interact with their personal memory store directly from the terminal. The CLI offers comprehensive memory management capabilities with an intuitive command structure.

## Key Features

- **🚀 Fast Memory Operations**: High-performance CLI for memory management
- **📊 Rich Data Visualization**: Beautiful terminal output with tables and formatting
- **🔍 Advanced Search**: Powerful search with filters and fuzzy matching
- **📤 Flexible Export**: Multiple export formats (JSON, Markdown, CSV)
- **🔄 Batch Operations**: Process multiple memories efficiently
- **🎨 Interactive Mode**: Guided workflows for complex operations
- **📈 Analytics**: Memory usage statistics and insights
- **🔧 Extensible**: Plugin system for custom commands

## Installation & Setup

### 1. Global Installation

```bash
# Install globally via npm
npm install -g valora-memory-server

# Verify installation
valora --version
```

### 2. Environment Configuration

```bash
# Set required environment variable
export VALORA_SECRET_KEY="your-secure-32-character-key-here"

# Optional: Set custom storage location
export VALORA_STORAGE_PATH="$HOME/.valora/memories"

# Optional: Enable debug logging
export VALORA_DEBUG=true
```

### 3. Shell Integration

Add to your shell profile for enhanced experience:

```bash
# Add to ~/.bashrc or ~/.zshrc
export VALORA_SECRET_KEY="your-key-here"

# Enable auto-completion (if available)
source <(valora completion bash)
# or for zsh: source <(valora completion zsh)
```

## Core Commands

### Memory Management

#### `valora import`
Import conversations from various sources.

```bash
# Import from ChatGPT conversation file
valora import chatgpt conversation.md

# Import from Claude conversation
valora import claude conversation.txt

# Import from URL
valora import url "https://chat.openai.com/share/conversation-id"

# Batch import from directory
valora import batch /path/to/conversations/

# Import with custom metadata
valora import chatgpt conversation.md \
  --title "React Best Practices Discussion" \
  --tags "react,frontend,best-practices" \
  --source "chatgpt"
```

#### `valora search`
Search through your memory store.

```bash
# Basic search
valora search "machine learning"

# Advanced search with filters
valora search "API design" \
  --source chatgpt \
  --tags "backend,api" \
  --since "2024-01-01" \
  --limit 20

# Fuzzy search
valora search "machin lerning" --fuzzy

# Search with context
valora search "error handling" --context 3

# Export search results
valora search "typescript" --export results.json
```

#### `valora export`
Export memories in various formats.

```bash
# Export all memories as JSON
valora export all memories.json

# Export filtered memories
valora export search "react hooks" hooks-memories.md

# Export by date range
valora export date-range \
  --from "2024-01-01" \
  --to "2024-01-31" \
  --format markdown

# Export conversation format
valora export conversation "conversation-id" chat.md

# Export with compression
valora export all memories.tar.gz --compress
```

#### `valora list`
List and browse memories.

```bash
# List recent memories
valora list --recent

# List by source
valora list --source chatgpt

# List with pagination
valora list --page 2 --per-page 50

# Interactive browsing
valora list --interactive

# List with statistics
valora list --stats
```

### Analytics & Insights

#### `valora stats`
View memory usage statistics.

```bash
# Overall statistics
valora stats

# Statistics by source
valora stats --by-source

# Statistics by tags
valora stats --by-tags

# Time-based statistics
valora stats --by-month

# Export statistics
valora stats --export stats.json
```

#### `valora analyze`
Analyze memory patterns and insights.

```bash
# General analysis
valora analyze

# Topic analysis
valora analyze topics

# Conversation patterns
valora analyze conversations

# Learning progress analysis
valora analyze learning
```

### Maintenance & Management

#### `valora clean`
Clean up and optimize memory store.

```bash
# Remove duplicate memories
valora clean duplicates

# Remove old memories
valora clean old --days 90

# Optimize storage
valora clean optimize

# Clean with dry run
valora clean duplicates --dry-run
```

#### `valora backup`
Create and manage backups.

```bash
# Create backup
valora backup create

# List backups
valora backup list

# Restore from backup
valora backup restore backup-2024-01-15.tar.gz

# Backup to cloud
valora backup sync --provider dropbox
```

#### `valora config`
Manage configuration settings.

```bash
# View current configuration
valora config list

# Set configuration value
valora config set storage.path "/custom/path"

# Reset to defaults
valora config reset

# Export configuration
valora config export config.json
```

## Advanced Workflows

### 1. Daily Memory Management

```bash
#!/bin/bash
# daily-memory-sync.sh

# Export today's memories
TODAY=$(date +%Y-%m-%d)
valora export date-range --from $TODAY --to $TODAY --format markdown > "memories-$TODAY.md"

# Clean up old temporary files
valora clean old --days 30

# Backup if it's Sunday
if [ $(date +%w) = 0 ]; then
    valora backup create
fi
```

### 2. Research Project Management

```bash
#!/bin/bash
# research-project.sh

PROJECT_NAME="ai-ethics-research"
TAGS="research,ai,ethics"

# Search for relevant memories
valora search "artificial intelligence ethics" --tags $TAGS --export research-memories.json

# Export in academic format
valora export search "AI ethics" --format markdown --template academic > "$PROJECT_NAME-notes.md"

# Generate summary statistics
valora analyze topics --query "AI ethics" > "$PROJECT_NAME-analysis.txt"
```

### 3. Development Knowledge Base

```bash
#!/bin/bash
# dev-knowledge-sync.sh

# Import recent code discussions
find ~/chat-logs -name "*.md" -newer $(date -v-1d) -exec valora import chatgpt {} \;

# Tag development-related memories
valora search "typescript react" --export dev-memories.json

# Create documentation
valora export search "best practices" --format markdown > development-guide.md

# Update team knowledge base
valora export all --format json | jq '.memories[] | select(.tags[] | contains("team"))' > team-knowledge.json
```

### 4. Learning Progress Tracking

```bash
#!/bin/bash
# learning-progress.sh

# Track learning progress
echo "=== Learning Progress Report ==="
valora analyze learning

# Export recent learning memories
valora export date-range --from $(date -v-7d) --format markdown > weekly-learning.md

# Identify knowledge gaps
valora search "TODO learn" --export learning-goals.json

# Generate learning recommendations
valora analyze topics --recommend > learning-recommendations.txt
```

## Integration Examples

### Git Integration

Add Valora to your Git workflow:

```bash
# .git/hooks/post-commit
#!/bin/bash
# Save commit messages and context
echo "Commit: $(git log -1 --oneline)" | valora import custom - --tags "git,commit,development"

# Save code review comments (if available)
# valora import github-pr $PR_NUMBER --tags "code-review,feedback"
```

### IDE Integration

#### Vim/Neovim Integration

```vim
" .vimrc or init.vim
command! -nargs=* ValoraSearch :execute '!valora search ' . <q-args>
command! -nargs=0 ValoraStats :execute '!valora stats'
command! -nargs=0 ValoraRecent :execute '!valora list --recent --limit 10'

" Key mappings
nnoremap <leader>vs :ValoraSearch<space>
nnoremap <leader>vt :ValoraStats<CR>
nnoremap <leader>vr :ValoraRecent<CR>
```

#### VS Code Integration

```json
// .vscode/settings.json
{
  "terminal.integrated.shellArgs.linux": [
    "-c",
    "export VALORA_SECRET_KEY=your-key-here; /bin/bash"
  ]
}

// Keybindings for common commands
[
  {
    "key": "ctrl+shift+v",
    "command": "workbench.action.terminal.sendSequence",
    "args": {
      "text": "valora search \"\""
    }
  },
  {
    "key": "ctrl+shift+s",
    "command": "workbench.action.terminal.sendSequence",
    "args": { "text": "valora stats\n" }
  }
]
```

### Shell Scripting

#### Zsh Functions

```zsh
# .zshrc
function valora-search() {
    valora search "$*" | less
}

function valora-quick-import() {
    pbpaste | valora import custom - --title "Quick Import $(date)" --tags "quick,clipboard"
}

function valora-daily-summary() {
    echo "=== Daily Memory Summary ==="
    valora stats
    echo -e "\n=== Recent Memories ==="
    valora list --recent --limit 5
}
```

#### Bash Aliases

```bash
# .bashrc
alias vs='valora search'
alias vi='valora import chatgpt'
alias vl='valora list --recent'
alias vst='valora stats'
alias vexp='valora export all memories-$(date +%Y%m%d).json'
```

### CI/CD Integration

#### GitHub Actions

```yaml
# .github/workflows/valora-sync.yml
name: Sync Memories
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Valora
        run: npm install -g valora-memory-server

      - name: Sync Memories
        run: |
          export VALORA_SECRET_KEY=${{ secrets.VALORA_KEY }}
          valora import batch ./chat-logs/
          valora clean optimize
          valora backup create

      - name: Generate Report
        run: |
          valora stats > memory-report.txt
          valora export date-range --from $(date -d '7 days ago' +%Y-%m-%d) --format markdown > weekly-memories.md
```

#### Docker Integration

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install Valora CLI
RUN npm install -g valora-memory-server

# Set working directory
WORKDIR /app

# Copy memory files
COPY memories/ ./memories/

# Set environment
ENV VALORA_SECRET_KEY="your-key-here"
ENV VALORA_STORAGE_PATH="/app/memories"

# Default command
CMD ["valora", "stats"]
```

## Command Reference

### Global Options

```bash
valora [command] [options]

Global Options:
  --help, -h        Show help
  --version, -v     Show version
  --verbose         Enable verbose output
  --quiet           Suppress output
  --json            Output in JSON format
  --config <file>   Use custom config file
  --dry-run         Show what would be done without executing
```

### Import Commands

```bash
valora import <source> <file|url|content>

Sources:
  chatgpt     Import ChatGPT conversations
  claude      Import Claude conversations
  custom      Import custom formatted content
  url         Import from web URL
  batch       Import multiple files from directory

Options:
  --title <title>           Set memory title
  --tags <tags>             Comma-separated tags
  --source <source>         Override source detection
  --date <date>             Set custom date
  --skip-duplicates         Skip duplicate content
```

### Search Commands

```bash
valora search <query> [options]

Options:
  --source <source>         Filter by source
  --tags <tags>             Filter by tags
  --since <date>            Filter by date (from)
  --until <date>            Filter by date (to)
  --limit <number>          Limit results
  --offset <number>         Skip results
  --fuzzy                   Enable fuzzy matching
  --context <lines>         Show context lines
  --export <file>           Export results to file
  --sort <field>            Sort by field (date, relevance, source)
  --order <asc|desc>        Sort order
```

### Export Commands

```bash
valora export <type> <query|file> [options]

Types:
  all                       Export all memories
  search <query>            Export search results
  date-range                Export by date range
  conversation <id>         Export specific conversation

Formats:
  --format <format>         json, markdown, csv, txt, html
  --template <template>     Use custom template
  --compress                Compress output
  --pretty                  Pretty-print JSON
  --include-metadata        Include metadata in export
```

### Maintenance Commands

```bash
valora clean <operation> [options]

Operations:
  duplicates                Remove duplicate memories
  old --days <days>         Remove memories older than N days
  optimize                  Optimize storage and indexes
  corrupted                 Find and repair corrupted memories

Options:
  --dry-run                 Show what would be cleaned
  --force                   Skip confirmation prompts
  --backup                  Create backup before cleaning
```

### Configuration Commands

```bash
valora config <operation> [key] [value]

Operations:
  list                      Show all configuration
  get <key>                 Get configuration value
  set <key> <value>         Set configuration value
  reset                    Reset to defaults
  export <file>            Export configuration
  import <file>            Import configuration
```

## Customization & Extension

### Custom Templates

Create custom export templates:

```javascript
// templates/academic.js
module.exports = {
  format: 'markdown',
  header: '# Academic Research Notes\n\nDate: {{date}}\n\n',
  memoryTemplate: '## {{title}}\n\n**Source:** {{source}}\n**Tags:** {{tags}}\n\n{{content}}\n\n---\n\n',
  footer: '\n\n---\n*Generated by Valora CLI*'
};
```

### Plugin Development

Extend CLI with custom commands:

```javascript
// plugins/custom-plugin.js
module.exports = {
  command: 'analyze-sentiment',
  description: 'Analyze sentiment of memories',
  action: async (options) => {
    const memories = await searchMemories(options.query);
    // Sentiment analysis logic
    console.log('Sentiment analysis complete');
  }
};
```

### Custom Scripts

Create reusable scripts:

```javascript
#!/usr/bin/env node
// scripts/project-summary.js
const { execSync } = require('child_process');

function generateProjectSummary(projectName) {
  console.log(`Generating summary for ${projectName}...`);

  // Search for project-related memories
  execSync(`valora search "${projectName}" --export project-memories.json`);

  // Generate statistics
  execSync(`valora stats --by-tags --export project-stats.json`);

  console.log('Project summary generated successfully!');
}

// Usage: node scripts/project-summary.js "My Project"
const projectName = process.argv[2];
if (projectName) {
  generateProjectSummary(projectName);
}
```

## Performance & Optimization

### CLI Performance Tips

```bash
# Use parallel processing for large imports
valora import batch large-directory/ --parallel 4

# Optimize search with specific filters
valora search "query" --source chatgpt --limit 100

# Use streaming for large exports
valora export all large-export.json --stream

# Enable caching for frequent queries
valora config set cache.enabled true
```

### Memory Management

```bash
# Monitor memory usage
valora stats --memory

# Optimize database
valora clean optimize

# Archive old memories
valora clean old --days 365 --archive

# Defragment storage
valora maintenance defrag
```

## Security & Privacy

### Encryption

```bash
# Change encryption key
valora security rotate-key

# Validate encryption
valora security validate

# Emergency decryption (use with caution)
valora security emergency-decrypt --backup
```

### Access Control

```bash
# Set access permissions
valora security permissions set user read-write

# View access logs
valora security audit logs

# Lock memory store
valora security lock

# Unlock with key
valora security unlock
```

### Data Privacy

```bash
# Anonymize memories
valora privacy anonymize --fields names,email,urls

# Export without sensitive data
valora export all clean-export.json --privacy-safe

# Delete sensitive memories
valora privacy delete --query "contains sensitive data"
```

## Troubleshooting

### Common Issues

#### 1. Command Not Found
```bash
# Check if Valora is installed
which valora

# Reinstall if missing
npm install -g valora-memory-server

# Check PATH
echo $PATH
```

#### 2. Import Failures
```bash
# Validate file format
valora validate conversation.md

# Check file permissions
ls -la conversation.md

# Try with verbose output
valora import chatgpt conversation.md --verbose
```

#### 3. Search Returning No Results
```bash
# Check if memories exist
valora stats

# Try broader search
valora search "keyword" --fuzzy

# Check search index
valora maintenance rebuild-index
```

#### 4. Performance Issues
```bash
# Check system resources
valora stats --system

# Optimize database
valora clean optimize

# Clear cache
valora maintenance clear-cache
```

### Debug Mode

Enable detailed logging:

```bash
# Enable debug logging
export VALORA_DEBUG=true

# Run command with debug output
valora search "query" --verbose

# Check debug logs
tail -f ~/.valora/debug.log
```

## API Integration

### REST API Access

```bash
# Start local API server
valora api start --port 8080

# Make API calls
curl http://localhost:8080/api/memories/search?q=machine%20learning

# Use with other tools
valora api export --format json | jq '.memories[0]'
```

### Programmatic Usage

```javascript
// Use as Node.js module
const valora = require('valora-memory-server');

async function searchMemories(query) {
  return await valora.search({ query });
}

async function importMemory(content, metadata) {
  return await valora.import({ content, ...metadata });
}
```

## Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/valora.git
cd valora

# Install dependencies
npm install

# Build CLI
npm run build:cli

# Test changes
npm test

# Run in development mode
npm run dev:cli
```

### Adding New Commands

1. **Create Command File:**
```typescript
// src/cli/commands/new-command.ts
export class NewCommand {
  static command = 'new <param>';
  static description = 'Description of new command';

  static action(param: string, options: any) {
    // Command implementation
    console.log(`New command executed with ${param}`);
  }
}
```

2. **Register Command:**
```typescript
// src/cli/index.ts
import { NewCommand } from './commands/new-command';

// Register command
program.addCommand(NewCommand);
```

3. **Add Tests:**
```typescript
// test/cli/new-command.test.ts
describe('NewCommand', () => {
  it('should execute successfully', () => {
    // Test implementation
  });
});
```

## Support & Resources

- **Documentation:** https://docs.valora.dev/cli
- **GitHub Issues:** https://github.com/your-org/valora/issues
- **Community Forum:** https://community.valora.dev
- **CLI Reference:** https://cli.valora.dev

---

**🎯 Complete CLI Integration!** The Valora CLI provides comprehensive memory management capabilities for developers and power users.
