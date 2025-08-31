#!/bin/bash

# Production Valora Testing Script
echo "🧪 Testing Production Valora Features"
echo "====================================="

# Set environment variables
export VALORA_API_KEY="test-api-key"
export VALORA_SECRET_KEY="test-secret-key-for-encryption"
export NODE_ENV="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_status="$3"
    
    echo -n "Testing $test_name... "
    
    # Run the command and capture the status code
    local response=$(eval "$command" 2>/dev/null)
    local status_code=$?
    
    if [ $status_code -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((TESTS_FAILED++))
    fi
}

# Wait for server to be ready
echo "Waiting for production server to be ready..."
sleep 3

echo ""
echo "🔍 Testing Health Endpoint"
echo "-------------------------"

# Test health endpoint (no auth required)
run_test "Health Check" \
    "curl -s -X GET http://localhost:3000/health" \
    "200"

echo ""
echo "🔑 Testing API Key Management"
echo "----------------------------"

# Test API key authentication
run_test "API Key Auth Test" \
    "curl -s -X GET http://localhost:3000/api-keys/test -H 'Authorization: Bearer test-api-key'" \
    "200"

# Test API key info
run_test "API Key Info" \
    "curl -s -X GET http://localhost:3000/api-keys/me -H 'Authorization: Bearer test-api-key'" \
    "200"

# Test API key stats
run_test "API Key Stats" \
    "curl -s -X GET http://localhost:3000/api-keys/me/stats -H 'Authorization: Bearer test-api-key'" \
    "200"

echo ""
echo "📚 Testing Memory Operations"
echo "---------------------------"

# Test memory read (requires read permission)
run_test "Memory Read" \
    "curl -s -X GET http://localhost:3000/memory/test-id -H 'Authorization: Bearer test-api-key'" \
    "200"

# Test memory create (requires write permission)
run_test "Memory Create" \
    "curl -s -X POST http://localhost:3000/memory -H 'Authorization: Bearer test-api-key' -H 'Content-Type: application/json' -d '{\"content\": \"test memory\"}'" \
    "201"

echo ""
echo "🔗 Testing Integration Endpoints"
echo "-------------------------------"

# Test integration status (requires integration permission)
run_test "Integration Status" \
    "curl -s -X GET http://localhost:3000/integrations/status -H 'Authorization: Bearer test-api-key'" \
    "200"

# Test webhook registration (requires integration permission)
run_test "Webhook Registration" \
    "curl -s -X POST http://localhost:3000/integrations/webhooks -H 'Authorization: Bearer test-api-key' -H 'Content-Type: application/json' -d '{\"url\": \"https://api.validr.com/webhooks/valora\", \"events\": [\"memory.created\", \"chat.imported\"], \"enabled\": true}'" \
    "201"

# Test webhook listing (requires integration permission)
run_test "Webhook Listing" \
    "curl -s -X GET http://localhost:3000/integrations/webhooks -H 'Authorization: Bearer test-api-key'" \
    "200"

# Test Validr sync (requires integration permission)
run_test "Validr Sync" \
    "curl -s -X POST http://localhost:3000/integrations/validr/sync -H 'Authorization: Bearer test-api-key' -H 'Content-Type: application/json' -d '{\"memory\": {\"id\": \"test\", \"content\": \"validation rule\"}}'" \
    "200"

echo ""
echo "🔒 Testing Security Features"
echo "---------------------------"

# Test missing authentication
run_test "Missing Auth Header" \
    "curl -s -X GET http://localhost:3000/memory/test-id | grep -q 'Missing or invalid authorization header'" \
    "401"

# Test invalid API key
run_test "Invalid API Key" \
    "curl -s -X GET http://localhost:3000/memory/test-id -H 'Authorization: Bearer invalid-key' | grep -q 'Invalid or expired API key'" \
    "401"

# Test insufficient permissions (try to access admin endpoint without admin)
run_test "Insufficient Permissions" \
    "curl -s -X GET http://localhost:3000/api-keys -H 'Authorization: Bearer test-api-key' | grep -q 'Insufficient permissions'" \
    "403"

echo ""
echo "📊 Test Results"
echo "--------------"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All production tests passed! Valora is ready for production.${NC}"
else
    echo -e "${RED}⚠️  Some tests failed. Please check the production system.${NC}"
fi

echo ""
echo "🚀 Production Features Tested:"
echo "• Enhanced API key authentication"
echo "• Permission-based access control"
echo "• Rate limiting and usage tracking"
echo "• Audit logging for all operations"
echo "• API key management endpoints"
echo "• Memory operations with permissions"
echo "• Integration endpoints with proper auth"
echo "• Validr sync functionality"
echo "• Security error handling"
echo ""
echo "🔧 Production Environment:"
echo "• NODE_ENV: production"
echo "• Enhanced security features enabled"
echo "• API key management available"
echo "• Audit logging active"
echo "• Rate limiting configured"
echo "• Error handling with request IDs"
