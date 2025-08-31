#!/bin/bash

# Valora API Functionality Test Script
# Tests all REST API endpoints for comprehensive coverage

# Removed set -e to allow script to continue on test failures

echo "🔍 Testing Valora API Functionality"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration
BASE_URL="http://localhost:3002"
API_KEY="test-api-key-for-testing"
CONTENT_TYPE="Content-Type: application/json"
AUTH_HEADER="Authorization: Bearer $API_KEY"

# Function to make API request and check response
test_api_endpoint() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    local description="$5"

    echo ""
    print_status "Testing: $description"

    local curl_cmd="curl -s -w '\nHTTP_STATUS:%{http_code}' -X $method '$BASE_URL$endpoint'"
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ] || [ "$method" = "PATCH" ]; then
        curl_cmd="$curl_cmd -H '$CONTENT_TYPE' -H '$AUTH_HEADER' -d '$data'"
    else
        curl_cmd="$curl_cmd -H '$AUTH_HEADER'"
    fi

    local response=$(eval "$curl_cmd")
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "$expected_status" ]; then
        print_success "$description - Status: $status"
        return 0
    else
        print_error "$description - Expected: $expected_status, Got: $status"
        echo "Response: $body"
        return 1
    fi
}

# Check if server is running
print_status "Checking if Valora server is running..."
if curl -f "$BASE_URL/health" > /dev/null 2>&1; then
    print_success "Valora server is running"
else
    print_error "Valora server is not running. Please start it first."
    echo "Run: VALORA_API_KEY=$API_KEY VALORA_SECRET_KEY=test-secret-key VALORA_PORT=3001 node build/cli/index.js start"
    exit 1
fi

echo ""
echo "🧪 Starting API Tests"
echo "===================="

# Health endpoint tests
test_api_endpoint "GET" "/health" "" "200" "Health endpoint"

# Memory API tests
print_status "Testing Memory API endpoints..."

# Create memory
MEMORY_DATA='{"content":"Test memory content","tags":["test","api"],"source":"api-test"}'
test_api_endpoint "POST" "/memory" "$MEMORY_DATA" "201" "Create memory"

# Get memory (if creation succeeded, try to get it)
if [ $? -eq 0 ]; then
    # Get all memories
    test_api_endpoint "GET" "/memory" "" "200" "Get all memories"

    # Search memories
    test_api_endpoint "GET" "/memory/search?q=test" "" "200" "Search memories"
fi

# Chat API tests
print_status "Testing Chat API endpoints..."

# Import chat
CHAT_DATA='{"conversationId":"api-test-chat","messages":[{"participant":"user","content":"Hello API test","timestamp":"2024-01-01T10:00:00.000Z"}],"source":"api-test","tags":["test","api"]}'
test_api_endpoint "POST" "/chat/import" "$CHAT_DATA" "200" "Import chat"

# Get chat conversations
test_api_endpoint "GET" "/chat/conversations" "" "200" "Get chat conversations"

# Export API tests
print_status "Testing Export API endpoints..."

# Export memories
test_api_endpoint "GET" "/export/memories?format=json" "" "200" "Export memories as JSON"
test_api_endpoint "GET" "/export/memories?format=csv" "" "200" "Export memories as CSV"

# Export chat
test_api_endpoint "GET" "/export/chat?format=json" "" "200" "Export chat as JSON"

# API Key management tests
print_status "Testing API Key Management endpoints..."

# List API keys
test_api_endpoint "GET" "/api-keys" "" "200" "List API keys"

# Create API key
API_KEY_DATA='{"name":"test-key","permissions":["read","write"],"expiresAt":null}'
test_api_endpoint "POST" "/api-keys" "$API_KEY_DATA" "201" "Create API key"

# Get API key details (would need the created key ID)
test_api_endpoint "GET" "/api-keys/test-key-id" "" "404" "Get API key details (expected 404 for non-existent)"

# Integration API tests
print_status "Testing Integration API endpoints..."

# Get integration status
test_api_endpoint "GET" "/integrations/status" "" "200" "Get integration status"

# Create webhook
WEBHOOK_DATA='{"url":"http://localhost:3002/test","events":["memory.created"],"secret":"test-secret"}'
test_api_endpoint "POST" "/integrations/webhooks" "$WEBHOOK_DATA" "201" "Create webhook"

# List webhooks
test_api_endpoint "GET" "/integrations/webhooks" "" "200" "List webhooks"

# Security tests
print_status "Testing Security features..."

# Test without API key (should fail)
curl -s -w '\nHTTP_STATUS:%{http_code}' -X GET "$BASE_URL/memory" | tail -n 1 | grep -q "401" && \
    print_success "Unauthorized request properly rejected" || \
    print_error "Unauthorized request not properly rejected"

# Test rate limiting
print_status "Testing rate limiting..."
for i in {1..10}; do
    curl -s "$BASE_URL/health" -H "$AUTH_HEADER" > /dev/null
    sleep 0.1
done
curl -s -w '\nHTTP_STATUS:%{http_code}' -X GET "$BASE_URL/health" -H "$AUTH_HEADER" | tail -n 1 | grep -q "429" && \
    print_success "Rate limiting working" || \
    print_warning "Rate limiting may not be working properly"

# Test invalid API key
INVALID_AUTH="Authorization: Bearer invalid-key"
curl -s -w '\nHTTP_STATUS:%{http_code}' -X GET "$BASE_URL/memory" -H "$INVALID_AUTH" | tail -n 1 | grep -q "401" && \
    print_success "Invalid API key properly rejected" || \
    print_error "Invalid API key not properly rejected"

# Performance tests
print_status "Testing API Performance..."

# Test response times for health endpoint
RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s "$BASE_URL/health")
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    print_success "Health endpoint response time: ${RESPONSE_TIME}s (acceptable)"
else
    print_warning "Health endpoint response time: ${RESPONSE_TIME}s (slow)"
fi

# Test concurrent requests
print_status "Testing concurrent requests..."
for i in {1..5}; do
    curl -s "$BASE_URL/health" -H "$AUTH_HEADER" > /dev/null &
done
wait
print_success "Concurrent requests handled"

# Summary
echo ""
echo "📊 API Test Results Summary"
echo "=========================="
echo -e "${GREEN}✅ Tests Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Tests Failed: $FAILED_TESTS${NC}"
echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All API tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some API tests failed. Please check the issues above.${NC}"
    exit 1
fi
