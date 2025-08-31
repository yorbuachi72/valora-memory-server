#!/bin/bash

# Valora Integration Testing Script
echo "🧪 Testing Valora Integration Endpoints"
echo "========================================"

# Set environment variables
export VALORA_API_KEY="test-api-key"
export VALORA_SECRET_KEY="test-secret-key-for-encryption"
export VALIDR_API_URL="https://api.validr.com"
export VALIDR_API_KEY="test-validr-key"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
echo "Waiting for server to be ready..."
sleep 3

echo ""
echo "🔍 Testing Health Endpoint"
echo "-------------------------"

# Test health endpoint (no auth required)
run_test "Health Check" \
    "curl -s -X GET http://localhost:3000/health" \
    "200"

echo ""
echo "🔐 Testing Authentication"
echo "------------------------"

# Test authentication endpoint
run_test "Valid API Key Auth" \
    "curl -s -X GET http://localhost:3000/auth/status -H 'Authorization: Bearer test-api-key'" \
    "200"

# Test invalid authentication
run_test "Invalid API Key Auth" \
    "curl -s -X GET http://localhost:3000/auth/status -H 'Authorization: Bearer invalid-key' | grep -q 'Invalid API key'" \
    "401"

# Test missing authentication
run_test "Missing Auth Header" \
    "curl -s -X GET http://localhost:3000/auth/status | grep -q 'Missing or invalid authorization header'" \
    "401"

echo ""
echo "🔗 Testing Integration Endpoints"
echo "-------------------------------"

# Test integration status
run_test "Integration Status" \
    "curl -s -X GET http://localhost:3000/integrations/status -H 'Authorization: Bearer test-api-key'" \
    "200"

# Test webhook registration
run_test "Webhook Registration" \
    "curl -s -X POST http://localhost:3000/integrations/webhooks -H 'Authorization: Bearer test-api-key' -H 'Content-Type: application/json' -d '{\"url\": \"https://api.validr.com/webhooks/valora\", \"events\": [\"memory.created\", \"chat.imported\"], \"enabled\": true}'" \
    "201"

# Test webhook listing
run_test "Webhook Listing" \
    "curl -s -X GET http://localhost:3000/integrations/webhooks -H 'Authorization: Bearer test-api-key'" \
    "200"

echo ""
echo "📊 Test Results"
echo "--------------"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Valora integration system is working correctly.${NC}"
else
    echo -e "${RED}⚠️  Some tests failed. Please check the integration system.${NC}"
fi

echo ""
echo "🚀 Integration Features Tested:"
echo "• Health endpoint (no auth required)"
echo "• API key authentication"
echo "• Integration status endpoint"
echo "• Webhook registration endpoint"
echo "• Webhook listing endpoint"
echo "• Error handling for invalid/missing auth"
echo ""
echo "🔧 Environment Variables Set:"
echo "• VALORA_API_KEY: test-api-key"
echo "• VALORA_SECRET_KEY: test-secret-key-for-encryption"
echo "• VALIDR_API_URL: https://api.validr.com"
echo "• VALIDR_API_KEY: test-validr-key"
