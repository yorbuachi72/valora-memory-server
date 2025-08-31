#!/bin/bash

# Valora Test Environment Setup Script
# Sets up environment variables and test data for comprehensive testing

set -e

echo "🔧 Setting up Valora Test Environment"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Set environment variables for testing
export VALORA_API_KEY="test-api-key-for-testing"
export VALORA_SECRET_KEY="test-secret-key-for-encryption-testing"
export VALORA_JWT_SECRET="test-jwt-secret-for-testing"
export VALORA_PORT=3001
export VALORA_BRAND="on"
export NODE_ENV="test"

print_status "Environment variables set:"
echo "  VALORA_API_KEY: $VALORA_API_KEY"
echo "  VALORA_SECRET_KEY: $VALORA_SECRET_KEY"
echo "  VALORA_JWT_SECRET: $VALORA_JWT_SECRET"
echo "  VALORA_PORT: $VALORA_PORT"
echo "  VALORA_BRAND: $VALORA_BRAND"
echo "  NODE_ENV: $NODE_ENV"

# Create test data directory if it doesn't exist
TEST_DATA_DIR="./test-data"
if [ ! -d "$TEST_DATA_DIR" ]; then
    mkdir -p "$TEST_DATA_DIR"
    print_success "Created test data directory: $TEST_DATA_DIR"
else
    print_status "Test data directory already exists: $TEST_DATA_DIR"
fi

# Create sample test data files
print_status "Creating sample test data..."

# Sample memory data
cat > "$TEST_DATA_DIR/sample-memory.json" << 'EOF'
{
  "id": "test-memory-1",
  "content": "This is a test memory for Valora testing",
  "tags": ["test", "sample", "memory"],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "source": "test-suite"
}
EOF

# Sample chat data
cat > "$TEST_DATA_DIR/sample-chat.json" << 'EOF'
{
  "conversationId": "test-conversation-1",
  "messages": [
    {
      "participant": "user",
      "content": "Hello, can you help me test the Valora system?",
      "timestamp": "2024-01-01T10:00:00.000Z"
    },
    {
      "participant": "assistant",
      "content": "Yes, I'd be happy to help you test the Valora Memory Container Protocol server!",
      "timestamp": "2024-01-01T10:00:05.000Z"
    },
    {
      "participant": "user",
      "content": "What features should I test first?",
      "timestamp": "2024-01-01T10:01:00.000Z"
    }
  ],
  "source": "test-chat",
  "tags": ["test", "chat", "conversation"]
}
EOF

# Sample webhook configuration
cat > "$TEST_DATA_DIR/sample-webhook.json" << 'EOF'
{
  "url": "http://localhost:3002/webhook-test",
  "events": ["memory.created", "memory.updated", "chat.imported"],
  "secret": "test-webhook-secret",
  "headers": {
    "X-Test-Header": "test-value"
  }
}
EOF

# Sample API key configuration
cat > "$TEST_DATA_DIR/sample-api-key.json" << 'EOF'
{
  "name": "test-api-key",
  "permissions": ["read", "write", "admin"],
  "expiresAt": null,
  "metadata": {
    "createdBy": "test-suite",
    "purpose": "comprehensive-testing"
  }
}
EOF

print_success "Sample test data files created"

# Check if build exists, if not build it
if [ ! -d "build" ] || [ ! -f "build/cli/index.js" ]; then
    print_status "Building Valora..."
    if npm run build > /dev/null 2>&1; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
else
    print_status "Build already exists"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    if npm install > /dev/null 2>&1; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_status "Dependencies already installed"
fi

# Clean up any existing test databases
if [ -f "valora-test.db" ]; then
    rm -f "valora-test.db"
    print_success "Cleaned up existing test database"
fi

print_success "Test environment setup complete!"
echo ""
echo "🎯 Ready for testing. Available test commands:"
echo "  • ./scripts/testing/test-api.sh          - API functionality tests"
echo "  • ./scripts/testing/test-cli.sh          - CLI command tests"
echo "  • ./scripts/testing/test-security.sh     - Security and authentication tests"
echo "  • ./scripts/testing/test-performance.sh  - Performance and load tests"
echo "  • ./scripts/testing/test-e2e.sh          - End-to-end workflow tests"
echo "  • ./scripts/testing/test-all-workflows.sh - Run all test workflows"
echo ""
echo "💡 Start with: ./scripts/testing/test-all-workflows.sh"
