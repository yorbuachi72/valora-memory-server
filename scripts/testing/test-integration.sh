#!/bin/bash

# Valora Integration Test Script
# Tests webhook and plugin integration functionality

# Removed set -e to allow script to continue on test failures

echo "🔗 Testing Valora Integration Features"
echo "====================================="

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
API_KEY="test-api-key-for-testing"
CONTENT_TYPE="Content-Type: application/json"
AUTH_HEADER="Authorization: Bearer $API_KEY"

# Function to make API request
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"

    local curl_cmd="curl -s -w '\nHTTP_STATUS:%{http_code}' -X $method '$BASE_URL$endpoint'"
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        curl_cmd="$curl_cmd -H '$CONTENT_TYPE' -H '$AUTH_HEADER' -d '$data'"
    else
        curl_cmd="$curl_cmd -H '$AUTH_HEADER'"
    fi

    eval "$curl_cmd"
}

# Function to test webhook functionality
test_webhook_integration() {
    print_status "Testing Webhook Integration..."

    # Create a webhook
    WEBHOOK_DATA='{
        "url": "http://localhost:3002/webhook-test",
        "events": ["memory.created", "memory.updated", "chat.imported"],
        "secret": "test-webhook-secret",
        "headers": {
            "X-Test-Header": "integration-test"
        }
    }'

    response=$(make_request "POST" "/integrations/webhooks" "$WEBHOOK_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Webhook creation"
        webhook_id=$(echo "$response" | head -n -1 | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        print_error "Webhook creation failed - Status: $status"
        return 1
    fi

    # List webhooks
    response=$(make_request "GET" "/integrations/webhooks" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Webhook listing"
    else
        print_error "Webhook listing failed - Status: $status"
    fi

    # Test webhook triggering by creating a memory
    MEMORY_DATA='{
        "content": "Test memory for webhook integration",
        "tags": ["test", "webhook", "integration"],
        "source": "integration-test"
    }'

    response=$(make_request "POST" "/memory" "$MEMORY_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Memory creation for webhook trigger"
    else
        print_error "Memory creation failed - Status: $status"
    fi

    # Delete webhook
    if [ -n "$webhook_id" ]; then
        response=$(make_request "DELETE" "/integrations/webhooks/$webhook_id" "")
        status=$(echo "$response" | tail -n 1 | cut -d: -f2)

        if [ "$status" = "200" ]; then
            print_success "Webhook deletion"
        else
            print_error "Webhook deletion failed - Status: $status"
        fi
    fi
}

# Function to test plugin system
test_plugin_system() {
    print_status "Testing Plugin System..."

    # Test plugin registration
    PLUGIN_DATA='{
        "name": "test-plugin",
        "version": "1.0.0",
        "capabilities": ["memory.sync", "chat.sync"],
        "config": {
            "endpoint": "http://localhost:3003/plugin",
            "apiKey": "test-plugin-key"
        }
    }'

    response=$(make_request "POST" "/integrations/plugins" "$PLUGIN_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Plugin registration"
        plugin_id=$(echo "$response" | head -n -1 | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        print_error "Plugin registration failed - Status: $status"
        return 1
    fi

    # List plugins
    response=$(make_request "GET" "/integrations/plugins" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Plugin listing"
    else
        print_error "Plugin listing failed - Status: $status"
    fi

    # Test plugin notification
    NOTIFICATION_DATA='{
        "event": "memory.created",
        "data": {
            "id": "test-memory-id",
            "content": "Plugin notification test",
            "timestamp": "2024-01-01T00:00:00.000Z"
        }
    }'

    response=$(make_request "POST" "/integrations/plugins/notify" "$NOTIFICATION_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Plugin notification"
    else
        print_error "Plugin notification failed - Status: $status"
    fi

    # Unregister plugin
    if [ -n "$plugin_id" ]; then
        response=$(make_request "DELETE" "/integrations/plugins/$plugin_id" "")
        status=$(echo "$response" | tail -n 1 | cut -d: -f2)

        if [ "$status" = "200" ]; then
            print_success "Plugin unregistration"
        else
            print_error "Plugin unregistration failed - Status: $status"
        fi
    fi
}

# Function to test external integrations
test_external_integrations() {
    print_status "Testing External Service Integrations..."

    # Test Validr plugin integration
    VALIDA_PLUGIN_DATA='{
        "name": "validr-integration",
        "version": "1.0.0",
        "capabilities": ["validation.sync"],
        "config": {
            "validrEndpoint": "https://api.validr.com/v1",
            "apiKey": "test-validr-key",
            "syncInterval": 300000
        }
    }'

    response=$(make_request "POST" "/integrations/plugins" "$VALIDA_PLUGIN_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Validr plugin integration setup"
    else
        print_warning "Validr plugin integration setup failed - Status: $status"
    fi

    # Test integration status endpoint
    response=$(make_request "GET" "/integrations/status" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Integration status endpoint"
        body=$(echo "$response" | head -n -1)
        if echo "$body" | grep -q "webhooks\|plugins"; then
            print_success "Integration status contains expected data"
        else
            print_warning "Integration status data format unexpected"
        fi
    else
        print_error "Integration status endpoint failed - Status: $status"
    fi
}

# Function to test webhook retry logic
test_webhook_retry_logic() {
    print_status "Testing Webhook Retry Logic..."

    # Create webhook with failing endpoint
    WEBHOOK_DATA='{
        "url": "http://localhost:9999/unreachable-endpoint",
        "events": ["memory.created"],
        "secret": "test-secret",
        "retryPolicy": {
            "maxRetries": 3,
            "backoffMs": 1000
        }
    }'

    response=$(make_request "POST" "/integrations/webhooks" "$WEBHOOK_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Webhook with retry policy creation"
    else
        print_error "Webhook with retry policy creation failed - Status: $status"
        return 1
    fi

    # Trigger webhook by creating memory
    MEMORY_DATA='{
        "content": "Test webhook retry logic",
        "tags": ["test", "retry", "webhook"],
        "source": "retry-test"
    }'

    response=$(make_request "POST" "/memory" "$MEMORY_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Memory creation triggering webhook retry"
    else
        print_error "Memory creation failed - Status: $status"
    fi

    # Check webhook delivery status (would need webhook manager to expose this)
    print_warning "Webhook retry status checking not fully implemented in API yet"
}

# Function to test concurrent integrations
test_concurrent_integrations() {
    print_status "Testing Concurrent Integration Operations..."

    # Create multiple webhooks
    for i in {1..3}; do
        WEBHOOK_DATA='{
            "url": "http://localhost:3002/webhook-'$i'",
            "events": ["memory.created"],
            "secret": "test-secret-'$i'"
        }'

        response=$(make_request "POST" "/integrations/webhooks" "$WEBHOOK_DATA")
        status=$(echo "$response" | tail -n 1 | cut -d: -f2)

        if [ "$status" = "201" ]; then
            print_success "Concurrent webhook $i creation"
        else
            print_error "Concurrent webhook $i creation failed - Status: $status"
        fi
    done

    # Create memory to trigger all webhooks
    MEMORY_DATA='{
        "content": "Test concurrent webhook triggering",
        "tags": ["test", "concurrent", "webhooks"],
        "source": "concurrent-test"
    }'

    response=$(make_request "POST" "/memory" "$MEMORY_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Concurrent webhook triggering"
    else
        print_error "Concurrent webhook triggering failed - Status: $status"
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
echo "🧪 Starting Integration Tests"
echo "============================"

# Run all integration tests
test_webhook_integration
test_plugin_system
test_external_integrations
test_webhook_retry_logic
test_concurrent_integrations

# Summary
echo ""
echo "📊 Integration Test Results Summary"
echo "=================================="
echo -e "${GREEN}✅ Tests Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Tests Failed: $FAILED_TESTS${NC}"
echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All integration tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some integration tests failed. Please check the issues above.${NC}"
    exit 1
fi
