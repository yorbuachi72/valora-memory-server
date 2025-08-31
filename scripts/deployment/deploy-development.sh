#!/bin/bash

# Valora Development Deployment Script
# Quick setup for development environment

set -e

echo "🚀 Deploying Valora MCP Server for Development"
echo "==============================================="

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "Prerequisites check passed"

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the project
print_status "Building project..."
npm run build

# Set development environment variables
print_status "Setting up development environment..."
export NODE_ENV=development
export VALORA_API_KEY="dev-api-key"
export VALORA_SECRET_KEY="dev-secret-key"
export PORT=3000

# Start development server
print_status "Starting development server..."
node production-valora.js &
SERVER_PID=$!

# Wait for server to be ready
print_status "Waiting for server to be ready..."
sleep 5

# Test the server
print_status "Testing development server..."

# Test health endpoint
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Development server is running and healthy"
else
    print_error "Development server health check failed"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Test API key authentication
if curl -s http://localhost:3000/api-keys/test | grep -q "Missing or invalid authorization header"; then
    print_success "API key authentication is working"
else
    print_error "API key authentication test failed"
fi

# Show access information
echo ""
echo "🎉 Development Deployment Complete!"
echo "=================================="
echo ""
echo "📡 Access Points:"
echo "• Development API: http://localhost:3000"
echo "• Health Check: http://localhost:3000/health"
echo ""
echo "🔑 API Testing:"
echo "curl -X GET http://localhost:3000/health"
echo "curl -X GET http://localhost:3000/api-keys/test -H 'Authorization: Bearer dev-api-key'"
echo ""
echo "🔧 Management:"
echo "• Server PID: $SERVER_PID"
echo "• Stop server: kill $SERVER_PID"
echo "• View logs: tail -f logs/valora.log"
echo ""
echo "⚠️  Development Mode:"
echo "• NODE_ENV=development"
echo "• Debug logging enabled"
echo "• Hot reload available"
echo ""
print_success "Valora MCP Server is now running in development mode!"
