#!/bin/bash

# Valora Security Test Script
# Tests authentication, authorization, rate limiting, and security features

# Removed set -e to allow script to continue on test failures

echo "🔒 Testing Valora Security Features"
echo "==================================="

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
BASE_URL="http://localhost:3001"
VALID_API_KEY="test-api-key-for-testing"
INVALID_API_KEY="invalid-api-key"
CONTENT_TYPE="Content-Type: application/json"

# Function to make authenticated request
make_auth_request() {
    local method="$1"
    local endpoint="$2"
    local api_key="$3"
    local data="$4"

    local auth_header="Authorization: Bearer $api_key"
    local curl_cmd="curl -s -w '\nHTTP_STATUS:%{http_code}' -X $method '$BASE_URL$endpoint' -H '$CONTENT_TYPE'"

    if [ -n "$api_key" ]; then
        curl_cmd="$curl_cmd -H '$auth_header'"
    fi

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi

    eval "$curl_cmd"
}

# Function to test authentication
test_authentication() {
    print_status "Testing Authentication..."

    # Test missing authorization header
    response=$(make_auth_request "GET" "/memory" "" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "401" ]; then
        print_success "Missing authorization header rejected"
    else
        print_error "Missing authorization header not rejected - Status: $status"
    fi

    # Test invalid API key
    response=$(make_auth_request "GET" "/memory" "$INVALID_API_KEY" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "401" ]; then
        print_success "Invalid API key rejected"
    else
        print_error "Invalid API key not rejected - Status: $status"
    fi

    # Test valid API key
    response=$(make_auth_request "GET" "/memory" "$VALID_API_KEY" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Valid API key accepted"
    else
        print_error "Valid API key rejected - Status: $status"
    fi

    # Test malformed authorization header
    curl -s -w '\nHTTP_STATUS:%{http_code}' -X GET "$BASE_URL/memory" -H "Authorization: malformed" | tail -n 1 | grep -q "401" && \
        print_success "Malformed authorization header rejected" || \
        print_error "Malformed authorization header not rejected"
}

# Function to test API key management
test_api_key_management() {
    print_status "Testing API Key Management..."

    # Create a new API key
    API_KEY_DATA='{
        "name": "test-security-key",
        "permissions": ["read", "write"],
        "expiresAt": null,
        "metadata": {
            "createdBy": "security-test",
            "purpose": "security-testing"
        }
    }'

    response=$(make_auth_request "POST" "/api-keys" "$VALID_API_KEY" "$API_KEY_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "API key creation"
        body=$(echo "$response" | head -n -1)
        new_api_key=$(echo "$body" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
        key_id=$(echo "$body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        print_error "API key creation failed - Status: $status"
        return 1
    fi

    # Test new API key
    if [ -n "$new_api_key" ]; then
        response=$(make_auth_request "GET" "/memory" "$new_api_key" "")
        status=$(echo "$response" | tail -n 1 | cut -d: -f2)

        if [ "$status" = "200" ]; then
            print_success "New API key authentication"
        else
            print_error "New API key authentication failed - Status: $status"
        fi
    fi

    # List API keys
    response=$(make_auth_request "GET" "/api-keys" "$VALID_API_KEY" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "API key listing"
    else
        print_error "API key listing failed - Status: $status"
    fi

    # Test permission-based access
    # Try to create API key with limited permissions
    LIMITED_KEY_DATA='{
        "name": "limited-test-key",
        "permissions": ["read"],
        "expiresAt": null
    }'

    response=$(make_auth_request "POST" "/api-keys" "$VALID_API_KEY" "$LIMITED_KEY_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Limited permission API key creation"
        body=$(echo "$response" | head -n -1)
        limited_key=$(echo "$body" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
        limited_key_id=$(echo "$body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        print_error "Limited permission API key creation failed - Status: $status"
    fi

    # Test write operation with read-only key (should fail)
    if [ -n "$limited_key" ]; then
        MEMORY_DATA='{"content":"Test with limited key","tags":["test","security"]}'
        response=$(make_auth_request "POST" "/memory" "$limited_key" "$MEMORY_DATA")
        status=$(echo "$response" | tail -n 1 | cut -d: -f2)

        if [ "$status" = "403" ]; then
            print_success "Write operation properly rejected with read-only key"
        else
            print_warning "Write operation with read-only key - Status: $status (expected 403)"
        fi
    fi

    # Deactivate API key
    if [ -n "$key_id" ]; then
        response=$(make_auth_request "DELETE" "/api-keys/$key_id" "$VALID_API_KEY" "")
        status=$(echo "$response" | tail -n 1 | cut -d: -f2)

        if [ "$status" = "200" ]; then
            print_success "API key deactivation"
        else
            print_error "API key deactivation failed - Status: $status"
        fi
    fi
}

# Function to test rate limiting
test_rate_limiting() {
    print_status "Testing Rate Limiting..."

    local request_count=0
    local rate_limited=false

    # Make multiple requests in quick succession
    for i in {1..15}; do
        response=$(make_auth_request "GET" "/health" "$VALID_API_KEY" "")
        status=$(echo "$response" | tail -n 1 | cut -d: -f2)
        ((request_count++))

        if [ "$status" = "429" ]; then
            rate_limited=true
            break
        fi

        # Small delay to avoid overwhelming
        sleep 0.1
    done

    if [ "$rate_limited" = true ]; then
        print_success "Rate limiting activated after $request_count requests"
    else
        print_warning "Rate limiting may not be working (made $request_count requests)"
    fi

    # Test rate limit reset
    print_status "Testing rate limit recovery..."
    sleep 5  # Wait for rate limit to reset

    response=$(make_auth_request "GET" "/health" "$VALID_API_KEY" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Rate limit reset working"
    else
        print_warning "Rate limit may not have reset properly - Status: $status"
    fi
}

# Function to test input validation
test_input_validation() {
    print_status "Testing Input Validation..."

    # Test SQL injection attempt
    MALICIOUS_DATA='{"content":"test'; DROP TABLE memories; --","tags":["test"]}'
    response=$(make_auth_request "POST" "/memory" "$VALID_API_KEY" "$MALICIOUS_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "400" ]; then
        print_success "SQL injection attempt rejected"
    else
        print_error "SQL injection attempt not properly handled - Status: $status"
    fi

    # Test XSS attempt
    XSS_DATA='{"content":"<script>alert(\\"xss\\")</script>","tags":["test"]}'
    response=$(make_auth_request "POST" "/memory" "$VALID_API_KEY" "$XSS_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "400" ]; then
        print_success "XSS attempt rejected"
    else
        print_warning "XSS attempt handling - Status: $status"
    fi

    # Test oversized payload
    LARGE_DATA=$(printf '{"content":"%*s","tags":["test"]}' 10000 | tr ' ' 'x')
    response=$(make_auth_request "POST" "/memory" "$VALID_API_KEY" "$LARGE_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "413" ]; then
        print_success "Oversized payload rejected"
    else
        print_warning "Oversized payload handling - Status: $status"
    fi

    # Test invalid JSON
    INVALID_JSON='{"content":"test","tags":invalid}'
    response=$(make_auth_request "POST" "/memory" "$VALID_API_KEY" "$INVALID_JSON")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "400" ]; then
        print_success "Invalid JSON rejected"
    else
        print_error "Invalid JSON not rejected - Status: $status"
    fi
}

# Function to test security headers
test_security_headers() {
    print_status "Testing Security Headers..."

    response=$(curl -s -I "$BASE_URL/health")
    headers=$(echo "$response" | tr -d '\r')

    # Check for important security headers
    security_headers=(
        "X-Content-Type-Options"
        "X-Frame-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
        "Content-Security-Policy"
    )

    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -i "^$header:" > /dev/null; then
            print_success "Security header present: $header"
        else
            print_warning "Security header missing: $header"
        fi
    done

    # Check for server info leakage
    if echo "$headers" | grep -i "^Server:" > /dev/null; then
        print_warning "Server header exposes server information"
    else
        print_success "Server information properly hidden"
    fi
}

# Function to test brute force protection
test_brute_force_protection() {
    print_status "Testing Brute Force Protection..."

    # Simulate multiple failed login attempts
    for i in {1..10}; do
        response=$(make_auth_request "GET" "/memory" "$INVALID_API_KEY" "")
        status=$(echo "$response" | tail -n 1 | cut -d: -f2)
        sleep 0.1
    done

    # Check if IP is blocked
    response=$(make_auth_request "GET" "/health" "" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "429" ]; then
        print_success "Brute force protection activated"
    else
        print_warning "Brute force protection may not be working - Status: $status"
    fi

    print_status "Waiting for brute force protection to reset..."
    sleep 10

    response=$(make_auth_request "GET" "/health" "" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Brute force protection reset"
    else
        print_warning "Brute force protection may not have reset"
    fi
}

# Check if server is running
print_status "Checking if Valora server is running..."
if curl -f "$BASE_URL/health" > /dev/null 2>&1; then
    print_success "Valora server is running"
else
    print_error "Valora server is not running. Please start it first."
    echo "Run: ./scripts/testing/setup-test-env.sh"
    exit 1
fi

echo ""
echo "🧪 Starting Security Tests"
echo "========================="

# Run all security tests
test_authentication
test_api_key_management
test_rate_limiting
test_input_validation
test_security_headers
test_brute_force_protection

# Summary
echo ""
echo "📊 Security Test Results Summary"
echo "==============================="
echo -e "${GREEN}✅ Tests Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Tests Failed: $FAILED_TESTS${NC}"
echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All security tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some security tests failed. Please check the issues above.${NC}"
    exit 1
fi
