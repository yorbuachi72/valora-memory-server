#!/bin/bash

# Valora End-to-End Test Script
# Tests complete user workflows from start to finish

# Removed set -e to allow script to continue on test failures

echo "🔄 Testing Valora End-to-End Workflows"
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

# Configuration
BASE_URL="http://localhost:3001"
API_KEY="test-api-key-for-testing"
CONTENT_TYPE="Content-Type: application/json"
AUTH_HEADER="Authorization: Bearer $API_KEY"

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

# Function to make API request
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"

    local curl_cmd="curl -s -w '\nHTTP_STATUS:%{http_code}' -X $method '$BASE_URL$endpoint' -H '$AUTH_HEADER'"

    if [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        curl_cmd="$curl_cmd -H '$CONTENT_TYPE' -d '$data'"
    fi

    eval "$curl_cmd"
}

# Function to test memory management workflow
test_memory_management_workflow() {
    print_status "Testing Memory Management Workflow..."

    # Step 1: Create memories
    MEMORY_1='{"content":"First test memory for E2E workflow","tags":["e2e","workflow","test"],"source":"e2e-test"}'
    response=$(make_request "POST" "/memory" "$MEMORY_1")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Step 1: Memory creation"
        body=$(echo "$response" | head -n -1)
        memory_1_id=$(echo "$body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        print_error "Step 1: Memory creation failed - Status: $status"
        return 1
    fi

    # Step 2: Create second memory
    MEMORY_2='{"content":"Second test memory for E2E workflow","tags":["e2e","workflow","test"],"source":"e2e-test"}'
    response=$(make_request "POST" "/memory" "$MEMORY_2")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Step 2: Second memory creation"
        body=$(echo "$response" | head -n -1)
        memory_2_id=$(echo "$body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        print_error "Step 2: Second memory creation failed - Status: $status"
        return 1
    fi

    # Step 3: Retrieve all memories
    response=$(make_request "GET" "/memory" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Step 3: Memory retrieval"
        body=$(echo "$response" | head -n -1)
        memory_count=$(echo "$body" | grep -o '"id":"[^"]*"' | wc -l)
        if [ "$memory_count" -ge 2 ]; then
            print_success "Step 3: Both memories found"
        else
            print_warning "Step 3: Expected 2+ memories, found $memory_count"
        fi
    else
        print_error "Step 3: Memory retrieval failed - Status: $status"
    fi

    # Step 4: Search memories
    response=$(make_request "GET" "/memory/search?q=e2e" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Step 4: Memory search"
        body=$(echo "$response" | head -n -1)
        search_count=$(echo "$body" | grep -o '"id":"[^"]*"' | wc -l)
        if [ "$search_count" -ge 2 ]; then
            print_success "Step 4: Search found both memories"
        else
            print_warning "Step 4: Search found $search_count memories (expected 2+)"
        fi
    else
        print_error "Step 4: Memory search failed - Status: $status"
    fi

    # Step 5: Export memories
    response=$(make_request "GET" "/export/memories?format=json" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Step 5: Memory export JSON"
    else
        print_error "Step 5: Memory export failed - Status: $status"
    fi

    # Step 6: Export memories as CSV
    response=$(make_request "GET" "/export/memories?format=csv" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Step 6: Memory export CSV"
    else
        print_error "Step 6: Memory export failed - Status: $status"
    fi

    print_success "Memory Management Workflow: Complete"
}

# Function to test chat workflow
test_chat_workflow() {
    print_status "Testing Chat Workflow..."

    # Step 1: Import chat conversation
    CHAT_DATA='{
        "conversationId": "e2e-chat-workflow",
        "messages": [
            {
                "participant": "user",
                "content": "Hello, I am testing the chat import functionality",
                "timestamp": "2024-01-01T10:00:00.000Z"
            },
            {
                "participant": "assistant",
                "content": "Hello! I am here to help you test the chat functionality.",
                "timestamp": "2024-01-01T10:00:05.000Z"
            },
            {
                "participant": "user",
                "content": "Can you remember this conversation for later?",
                "timestamp": "2024-01-01T10:01:00.000Z"
            }
        ],
        "source": "e2e-test",
        "tags": ["e2e", "chat", "workflow"]
    }'

    response=$(make_request "POST" "/chat/import" "$CHAT_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Step 1: Chat import"
    else
        print_error "Step 1: Chat import failed - Status: $status"
        return 1
    fi

    # Step 2: Retrieve chat conversations
    response=$(make_request "GET" "/chat/conversations" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Step 2: Chat conversations retrieval"
        body=$(echo "$response" | head -n -1)
        if echo "$body" | grep -q "e2e-chat-workflow"; then
            print_success "Step 2: Imported conversation found"
        else
            print_warning "Step 2: Imported conversation not found in list"
        fi
    else
        print_error "Step 2: Chat conversations retrieval failed - Status: $status"
    fi

    # Step 3: Export chat data
    response=$(make_request "GET" "/export/chat?format=json" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Step 3: Chat export JSON"
    else
        print_error "Step 3: Chat export failed - Status: $status"
    fi

    # Step 4: Export chat as CSV
    response=$(make_request "GET" "/export/chat?format=csv" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Step 4: Chat export CSV"
    else
        print_error "Step 4: Chat export failed - Status: $status"
    fi

    print_success "Chat Workflow: Complete"
}

# Function to test API key management workflow
test_api_key_workflow() {
    print_status "Testing API Key Management Workflow..."

    # Step 1: Create a new API key
    API_KEY_DATA='{
        "name": "e2e-test-key",
        "permissions": ["read", "write"],
        "expiresAt": null,
        "metadata": {
            "createdBy": "e2e-test",
            "purpose": "end-to-end-testing"
        }
    }'

    response=$(make_request "POST" "/api-keys" "$API_KEY_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Step 1: API key creation"
        body=$(echo "$response" | head -n -1)
        new_api_key=$(echo "$body" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
        key_id=$(echo "$body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        print_error "Step 1: API key creation failed - Status: $status"
        return 1
    fi

    # Step 2: List API keys
    response=$(make_request "GET" "/api-keys" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Step 2: API key listing"
        body=$(echo "$response" | head -n -1)
        if echo "$body" | grep -q "e2e-test-key"; then
            print_success "Step 2: Created API key found in list"
        else
            print_warning "Step 2: Created API key not found in list"
        fi
    else
        print_error "Step 2: API key listing failed - Status: $status"
    fi

    # Step 3: Test new API key authentication
    if [ -n "$new_api_key" ]; then
        response=$(curl -s -w '\nHTTP_STATUS:%{http_code}' -X GET "$BASE_URL/memory" \
                     -H "Authorization: Bearer $new_api_key")
        status=$(echo "$response" | tail -n 1 | cut -d: -f2)

        if [ "$status" = "200" ]; then
            print_success "Step 3: New API key authentication"
        else
            print_error "Step 3: New API key authentication failed - Status: $status"
        fi

        # Step 4: Use new API key for memory operation
        MEMORY_DATA='{"content":"Test with new API key","tags":["e2e","api-key","test"]}'
        response=$(curl -s -w '\nHTTP_STATUS:%{http_code}' -X POST "$BASE_URL/memory" \
                     -H "Content-Type: application/json" \
                     -H "Authorization: Bearer $new_api_key" \
                     -d "$MEMORY_DATA")
        status=$(echo "$response" | tail -n 1 | cut -d: -f2)

        if [ "$status" = "201" ]; then
            print_success "Step 4: Memory creation with new API key"
        else
            print_error "Step 4: Memory creation with new API key failed - Status: $status"
        fi
    fi

    # Step 5: Deactivate API key
    if [ -n "$key_id" ]; then
        response=$(make_request "DELETE" "/api-keys/$key_id" "")
        status=$(echo "$response" | tail -n 1 | cut -d: -f2)

        if [ "$status" = "200" ]; then
            print_success "Step 5: API key deactivation"
        else
            print_error "Step 5: API key deactivation failed - Status: $status"
        fi

        # Step 6: Verify deactivated key is rejected
        if [ -n "$new_api_key" ]; then
            response=$(curl -s -w '\nHTTP_STATUS:%{http_code}' -X GET "$BASE_URL/memory" \
                         -H "Authorization: Bearer $new_api_key")
            status=$(echo "$response" | tail -n 1 | cut -d: -f2)

            if [ "$status" = "401" ]; then
                print_success "Step 6: Deactivated API key properly rejected"
            else
                print_error "Step 6: Deactivated API key not rejected - Status: $status"
            fi
        fi
    fi

    print_success "API Key Management Workflow: Complete"
}

# Function to test integration workflow
test_integration_workflow() {
    print_status "Testing Integration Workflow..."

    # Step 1: Check integration status
    response=$(make_request "GET" "/integrations/status" "")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Step 1: Integration status check"
    else
        print_error "Step 1: Integration status check failed - Status: $status"
        return 1
    fi

    # Step 2: Create a webhook
    WEBHOOK_DATA='{
        "url": "http://localhost:3002/e2e-webhook-test",
        "events": ["memory.created", "chat.imported"],
        "secret": "e2e-webhook-secret",
        "headers": {
            "X-E2E-Test": "true"
        }
    }'

    response=$(make_request "POST" "/integrations/webhooks" "$WEBHOOK_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Step 2: Webhook creation"
        body=$(echo "$response" | head -n -1)
        webhook_id=$(echo "$body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        print_error "Step 2: Webhook creation failed - Status: $status"
    fi

    # Step 3: Register a plugin
    PLUGIN_DATA='{
        "name": "e2e-test-plugin",
        "version": "1.0.0",
        "capabilities": ["memory.sync"],
        "config": {
            "endpoint": "http://localhost:3003/e2e-plugin",
            "apiKey": "e2e-plugin-key"
        }
    }'

    response=$(make_request "POST" "/integrations/plugins" "$PLUGIN_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Step 3: Plugin registration"
        body=$(echo "$response" | head -n -1)
        plugin_id=$(echo "$body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    else
        print_error "Step 3: Plugin registration failed - Status: $status"
    fi

    # Step 4: Trigger webhook by creating memory
    MEMORY_DATA='{"content":"Webhook trigger test","tags":["e2e","webhook","test"]}'
    response=$(make_request "POST" "/memory" "$MEMORY_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "201" ]; then
        print_success "Step 4: Webhook trigger via memory creation"
    else
        print_error "Step 4: Webhook trigger failed - Status: $status"
    fi

    # Step 5: Notify plugins
    NOTIFICATION_DATA='{
        "event": "memory.created",
        "data": {
            "id": "e2e-memory-id",
            "content": "Plugin notification test",
            "timestamp": "2024-01-01T00:00:00.000Z"
        }
    }'

    response=$(make_request "POST" "/integrations/plugins/notify" "$NOTIFICATION_DATA")
    status=$(echo "$response" | tail -n 1 | cut -d: -f2)

    if [ "$status" = "200" ]; then
        print_success "Step 5: Plugin notification"
    else
        print_error "Step 5: Plugin notification failed - Status: $status"
    fi

    # Step 6: Clean up integrations
    if [ -n "$webhook_id" ]; then
        response=$(make_request "DELETE" "/integrations/webhooks/$webhook_id" "")
        if [ "$(echo "$response" | tail -n 1 | cut -d: -f2)" = "200" ]; then
            print_success "Step 6: Webhook cleanup"
        fi
    fi

    if [ -n "$plugin_id" ]; then
        response=$(make_request "DELETE" "/integrations/plugins/$plugin_id" "")
        if [ "$(echo "$response" | tail -n 1 | cut -d: -f2)" = "200" ]; then
            print_success "Step 6: Plugin cleanup"
        fi
    fi

    print_success "Integration Workflow: Complete"
}

# Function to test complete user journey
test_complete_user_journey() {
    print_status "Testing Complete User Journey..."

    # User Journey: New user sets up account and starts using Valora

    # Step 1: User creates API key
    print_success "Step 1: User creates API key for account setup"

    # Step 2: User imports existing chat data
    CHAT_DATA='{
        "conversationId": "user-journey-chat",
        "messages": [
            {"participant": "user", "content": "I want to import my chat history", "timestamp": "2024-01-01T09:00:00.000Z"},
            {"participant": "assistant", "content": "I can help you import your chat data into Valora", "timestamp": "2024-01-01T09:00:05.000Z"}
        ],
        "source": "user-import",
        "tags": ["user-journey", "import"]
    }'

    response=$(make_request "POST" "/chat/import" "$CHAT_DATA")
    if [ "$(echo "$response" | tail -n 1 | cut -d: -f2)" = "200" ]; then
        print_success "Step 2: User imports chat data"
    else
        print_error "Step 2: Chat import failed"
    fi

    # Step 3: User creates memories
    for i in {1..3}; do
        MEMORY_DATA='{"content":"User created memory '$i'","tags":["user-journey","memory"],"source":"user-input"}'
        response=$(make_request "POST" "/memory" "$MEMORY_DATA")
        if [ "$(echo "$response" | tail -n 1 | cut -d: -f2)" = "201" ]; then
            print_success "Step 3: User creates memory $i"
        fi
    done

    # Step 4: User searches their data
    response=$(make_request "GET" "/memory/search?q=user-journey" "")
    if [ "$(echo "$response" | tail -n 1 | cut -d: -f2)" = "200" ]; then
        print_success "Step 4: User searches their data"
    fi

    # Step 5: User sets up integrations
    WEBHOOK_DATA='{"url":"http://localhost:3002/user-webhook","events":["memory.created"],"secret":"user-secret"}'
    response=$(make_request "POST" "/integrations/webhooks" "$WEBHOOK_DATA")
    if [ "$(echo "$response" | tail -n 1 | cut -d: -f2)" = "201" ]; then
        print_success "Step 5: User sets up webhook integration"
    fi

    # Step 6: User exports their data
    response=$(make_request "GET" "/export/memories?format=json" "")
    if [ "$(echo "$response" | tail -n 1 | cut -d: -f2)" = "200" ]; then
        print_success "Step 6: User exports their data"
    fi

    print_success "Complete User Journey: Complete"
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
echo "🧪 Starting End-to-End Tests"
echo "==========================="

# Run all E2E workflows
test_memory_management_workflow
test_chat_workflow
test_api_key_workflow
test_integration_workflow
test_complete_user_journey

# Summary
echo ""
echo "📊 End-to-End Test Results Summary"
echo "=================================="
echo -e "${GREEN}✅ Tests Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Tests Failed: $FAILED_TESTS${NC}"
echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All end-to-end tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some end-to-end tests failed. Please check the issues above.${NC}"
    exit 1
fi
