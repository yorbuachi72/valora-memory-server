#!/bin/bash

# Valora Performance Test Script
# Tests system performance, load handling, and response times

# Removed set -e to allow script to continue on test failures

echo "⚡ Testing Valora Performance"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters and metrics
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TOTAL_RESPONSE_TIME=0
REQUEST_COUNT=0

# Performance thresholds (in seconds)
HEALTH_THRESHOLD=0.5
MEMORY_THRESHOLD=1.0
SEARCH_THRESHOLD=2.0

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

# Function to measure response time
measure_response_time() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"
    local threshold="$5"

    local auth_header="Authorization: Bearer test-api-key-for-testing"
    local curl_cmd="curl -s -w '%{time_total}' -o /dev/null"

    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json' -H '$auth_header' -d '$data'"
    else
        curl_cmd="$curl_cmd -X GET -H '$auth_header'"
    fi

    curl_cmd="$curl_cmd http://localhost:3001$endpoint"

    local response_time=$(eval "$curl_cmd")
    local result=$(echo "$response_time < $threshold" | bc -l)

    ((REQUEST_COUNT++))
    TOTAL_RESPONSE_TIME=$(echo "$TOTAL_RESPONSE_TIME + $response_time" | bc)

    if [ "$result" -eq 1 ]; then
        printf "${GREEN}[PASS]${NC} %s: %.3fs\n" "$description" "$response_time"
        return 0
    else
        printf "${RED}[FAIL]${NC} %s: %.3fs (threshold: %.3fs)\n" "$description" "$response_time" "$threshold"
        return 1
    fi
}

# Function to run load test
run_load_test() {
    local concurrent_requests="$1"
    local total_requests="$2"
    local endpoint="$3"
    local description="$4"

    print_status "Running load test: $description"
    print_status "Concurrent: $concurrent_requests, Total: $total_requests"

    local success_count=0
    local total_time=0

    # Run requests in parallel
    for i in $(seq 1 $concurrent_requests); do
        (
            for j in $(seq 1 $((total_requests / concurrent_requests))); do
                local start_time=$(date +%s%N)
                curl -s -H "Authorization: Bearer test-api-key-for-testing" \
                     "http://localhost:3001$endpoint" > /dev/null
                local end_time=$(date +%s%N)
                local request_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

                if [ $? -eq 0 ]; then
                    ((success_count++))
                fi

                total_time=$((total_time + request_time))
            done
        ) &
    done

    # Wait for all background processes to complete
    wait

    local avg_response_time=$((total_time / success_count))
    local success_rate=$((success_count * 100 / total_requests))

    if [ $success_rate -ge 95 ]; then
        printf "${GREEN}[PASS]${NC} Load test passed: %d/%d successful (%.1f%%), avg: %dms\n" \
               "$success_count" "$total_requests" "$success_rate" "$avg_response_time"
        return 0
    else
        printf "${RED}[FAIL]${NC} Load test failed: %d/%d successful (%.1f%%), avg: %dms\n" \
               "$success_count" "$total_requests" "$success_rate" "$avg_response_time"
        return 1
    fi
}

# Function to test memory operations performance
test_memory_performance() {
    print_status "Testing Memory Operations Performance..."

    # Test individual memory creation
    MEMORY_DATA='{"content":"Performance test memory","tags":["test","performance"],"source":"perf-test"}'
    measure_response_time "POST" "/memory" "$MEMORY_DATA" "Memory creation" "$MEMORY_THRESHOLD"

    # Test memory retrieval
    measure_response_time "GET" "/memory" "" "Memory listing" "$MEMORY_THRESHOLD"

    # Test memory search
    measure_response_time "GET" "/memory/search?q=test" "" "Memory search" "$SEARCH_THRESHOLD"

    # Create multiple memories for bulk operations
    print_status "Creating test data for bulk operations..."
    for i in {1..10}; do
        MEMORY_DATA='{"content":"Bulk test memory '$i'","tags":["bulk","test"],"source":"bulk-test"}'
        curl -s -X POST -H "Content-Type: application/json" \
             -H "Authorization: Bearer test-api-key-for-testing" \
             -d "$MEMORY_DATA" "http://localhost:3001/memory" > /dev/null
    done

    # Test bulk memory retrieval
    measure_response_time "GET" "/memory" "" "Bulk memory retrieval" "$MEMORY_THRESHOLD"

    # Test bulk search
    measure_response_time "GET" "/memory/search?q=bulk" "" "Bulk memory search" "$SEARCH_THRESHOLD"
}

# Function to test chat operations performance
test_chat_performance() {
    print_status "Testing Chat Operations Performance..."

    # Create test chat data
    CHAT_DATA='{
        "conversationId": "perf-test-chat",
        "messages": [
            {"participant": "user", "content": "Hello performance test", "timestamp": "2024-01-01T10:00:00.000Z"},
            {"participant": "assistant", "content": "Hi there! This is a performance test.", "timestamp": "2024-01-01T10:00:05.000Z"}
        ],
        "source": "perf-test",
        "tags": ["performance", "test"]
    }'

    # Test chat import
    measure_response_time "POST" "/chat/import" "$CHAT_DATA" "Chat import" "2.0"

    # Test chat retrieval
    measure_response_time "GET" "/chat/conversations" "" "Chat conversations" "$MEMORY_THRESHOLD"

    # Test chat export
    measure_response_time "GET" "/export/chat?format=json" "" "Chat export JSON" "1.5"
    measure_response_time "GET" "/export/chat?format=csv" "" "Chat export CSV" "1.5"
}

# Function to test API key operations performance
test_api_key_performance() {
    print_status "Testing API Key Operations Performance..."

    # Test API key creation
    API_KEY_DATA='{"name":"perf-test-key","permissions":["read","write"],"expiresAt":null}'
    measure_response_time "POST" "/api-keys" "$API_KEY_DATA" "API key creation" "1.0"

    # Test API key listing
    measure_response_time "GET" "/api-keys" "" "API key listing" "$MEMORY_THRESHOLD"

    # Test API key validation (through memory operation)
    measure_response_time "GET" "/memory" "" "API key validation" "$MEMORY_THRESHOLD"
}

# Function to test concurrent operations
test_concurrent_operations() {
    print_status "Testing Concurrent Operations..."

    # Test concurrent memory operations
    run_load_test 5 20 "/memory" "Concurrent memory listing"

    # Test concurrent health checks
    run_load_test 10 50 "/health" "Concurrent health checks"

    # Test mixed concurrent operations
    print_status "Testing mixed concurrent operations..."
    (
        curl -s -H "Authorization: Bearer test-api-key-for-testing" "http://localhost:3001/memory" > /dev/null &
        curl -s -H "Authorization: Bearer test-api-key-for-testing" "http://localhost:3001/health" > /dev/null &
        curl -s -H "Authorization: Bearer test-api-key-for-testing" "http://localhost:3001/api-keys" > /dev/null &
        wait
    )
    print_success "Mixed concurrent operations completed"
}

# Function to test memory usage
test_memory_usage() {
    print_status "Testing Memory Usage..."

    # Get initial memory usage
    if command -v ps >/dev/null 2>&1; then
        local initial_memory=$(ps -o rss= -p $(pgrep -f "node.*valora") | awk '{print $1}')
        print_status "Initial memory usage: ${initial_memory} KB"

        # Perform operations that should increase memory usage
        for i in {1..50}; do
            curl -s -X POST -H "Content-Type: application/json" \
                 -H "Authorization: Bearer test-api-key-for-testing" \
                 -d '{"content":"Memory usage test '$i'","tags":["memory","test"]}' \
                 "http://localhost:3001/memory" > /dev/null
        done

        # Get final memory usage
        local final_memory=$(ps -o rss= -p $(pgrep -f "node.*valora") | awk '{print $1}')
        print_status "Final memory usage: ${final_memory} KB"

        local memory_increase=$((final_memory - initial_memory))
        print_status "Memory increase: ${memory_increase} KB"

        if [ $memory_increase -lt 50000 ]; then # Less than 50MB increase
            print_success "Memory usage is reasonable"
        else
            print_warning "Memory usage increased significantly: ${memory_increase} KB"
        fi
    else
        print_warning "ps command not available for memory monitoring"
    fi
}

# Function to test database performance
test_database_performance() {
    print_status "Testing Database Performance..."

    # Test database connection time
    local start_time=$(date +%s%N)
    curl -s -H "Authorization: Bearer test-api-key-for-testing" "http://localhost:3001/memory" > /dev/null
    local end_time=$(date +%s%N)
    local db_time=$(( (end_time - start_time) / 1000000 ))

    if [ $db_time -lt 100 ]; then # Less than 100ms
        printf "${GREEN}[PASS]${NC} Database connection time: %dms\n" "$db_time"
    else
        printf "${YELLOW}[SLOW]${NC} Database connection time: %dms\n" "$db_time"
    fi

    # Test query performance with different data sizes
    print_status "Creating large dataset for query performance test..."
    for i in {1..100}; do
        curl -s -X POST -H "Content-Type: application/json" \
             -H "Authorization: Bearer test-api-key-for-testing" \
             -d '{"content":"Large dataset test memory '$i' with some additional content to make it longer","tags":["large","dataset","test","performance"]}' \
             "http://localhost:3001/memory" > /dev/null
    done

    # Test search performance on large dataset
    local search_start=$(date +%s%N)
    curl -s -H "Authorization: Bearer test-api-key-for-testing" \
         "http://localhost:3001/memory/search?q=large" > /dev/null
    local search_end=$(date +%s%N)
    local search_time=$(( (search_end - search_start) / 1000000 ))

    if [ $search_time -lt 1000 ]; then # Less than 1 second
        printf "${GREEN}[PASS]${NC} Large dataset search: %dms\n" "$search_time"
    else
        printf "${YELLOW}[SLOW]${NC} Large dataset search: %dms\n" "$search_time"
    fi
}

# Function to generate performance report
generate_performance_report() {
    print_status "Generating Performance Report..."

    local avg_response_time="0"
    if [ $REQUEST_COUNT -gt 0 ]; then
        avg_response_time=$(echo "scale=3; $TOTAL_RESPONSE_TIME / $REQUEST_COUNT" | bc)
    fi

    echo ""
    echo "📊 Performance Test Report"
    echo "=========================="
    echo "Total Requests: $REQUEST_COUNT"
    echo "Average Response Time: ${avg_response_time}s"
    echo "Tests Passed: $PASSED_TESTS"
    echo "Tests Failed: $FAILED_TESTS"
    echo ""

    # Performance recommendations
    echo "💡 Performance Recommendations:"
    if (( $(echo "$avg_response_time > 1.0" | bc -l) )); then
        echo "• Consider optimizing database queries"
        echo "• Review indexing strategy"
        echo "• Consider caching frequently accessed data"
    fi

    if [ $FAILED_TESTS -gt 0 ]; then
        echo "• Address slow endpoints identified in tests"
        echo "• Review server configuration for bottlenecks"
    fi

    echo "• Monitor memory usage in production"
    echo "• Set up proper load balancing for high traffic"
    echo "• Consider implementing response compression"
}

# Check if server is running
print_status "Checking if Valora server is running..."
if curl -f "http://localhost:3001/health" > /dev/null 2>&1; then
    print_success "Valora server is running"
else
    print_error "Valora server is not running. Please start it first."
    echo "Run: ./scripts/testing/setup-test-env.sh"
    exit 1
fi

echo ""
echo "🧪 Starting Performance Tests"
echo "============================"

# Run all performance tests
test_memory_performance
test_chat_performance
test_api_key_performance
test_concurrent_operations
test_memory_usage
test_database_performance

# Generate performance report
generate_performance_report

# Summary
echo ""
echo "📊 Performance Test Results Summary"
echo "==================================="
echo -e "${GREEN}✅ Tests Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Tests Failed: $FAILED_TESTS${NC}"
echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All performance tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some performance tests failed. Please check the issues above.${NC}"
    exit 1
fi
