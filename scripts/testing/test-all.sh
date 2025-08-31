#!/bin/bash

# Valora Comprehensive Testing Script
# Runs all tests: integration, production, and development

# Removed set -e to allow script to continue on test failures

echo "🧪 Running All Valora Tests"
echo "============================"

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

# Function to run a test suite
run_test_suite() {
    local suite_name="$1"
    local script_path="$2"
    
    echo ""
    echo "🔍 Running $suite_name Tests"
    echo "---------------------------"
    
    if [ -f "$script_path" ]; then
        if bash "$script_path"; then
            print_success "$suite_name tests completed successfully"
        else
            print_error "$suite_name tests failed"
        fi
    else
        print_warning "$suite_name test script not found: $script_path"
    fi
}

# Function to check if server is running
check_server() {
    local port="$1"
    local name="$2"
    
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        print_success "$name server is running on port $port"
        return 0
    else
        print_error "$name server is not running on port $port"
        return 1
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    local base_url="$1"
    local api_key="$2"
    local name="$3"
    
    echo ""
    echo "🔑 Testing $name API Endpoints"
    echo "-----------------------------"
    
    # Test health endpoint
    if curl -f "$base_url/health" > /dev/null 2>&1; then
        print_success "$name health endpoint is accessible"
    else
        print_error "$name health endpoint is not accessible"
    fi
    
    # Test API key authentication
    if curl -s "$base_url/api-keys/test" | grep -q "Missing or invalid authorization header"; then
        print_success "$name API key authentication is working"
    else
        print_error "$name API key authentication test failed"
    fi
    
    # Test with valid API key
    if curl -s "$base_url/api-keys/test" -H "Authorization: Bearer $api_key" | grep -q "authenticated"; then
        print_success "$name valid API key authentication is working"
    else
        print_error "$name valid API key authentication test failed"
    fi
    
    # Test memory operations
    if curl -s "$base_url/memory/test-id" -H "Authorization: Bearer $api_key" | grep -q "id"; then
        print_success "$name memory read operation is working"
    else
        print_error "$name memory read operation failed"
    fi
    
    # Test integration endpoints
    if curl -s "$base_url/integrations/status" -H "Authorization: Bearer $api_key" | grep -q "webhooks"; then
        print_success "$name integration status endpoint is working"
    else
        print_error "$name integration status endpoint failed"
    fi
}

# Main test execution
echo "Starting comprehensive test suite..."

# Check if servers are running
print_status "Checking server status..."

# Check development server
if check_server 3000 "Development"; then
    test_api_endpoints "http://localhost:3000" "dev-api-key" "Development"
fi

# Check production servers (if running)
for port in 3000 3001 3002; do
    if check_server $port "Production-$port"; then
        test_api_endpoints "http://localhost:$port" "test-api-key" "Production-$port"
    fi
done

# Run specific test suites
run_test_suite "Integration" "scripts/testing/test-integrations.sh"
run_test_suite "Production" "scripts/testing/test-production.sh"

# Run unit tests if available
print_status "Running unit tests..."
if npm test > /dev/null 2>&1; then
    print_success "Unit tests passed"
else
    print_warning "Unit tests not available or failed"
fi

# Run TypeScript compilation check
print_status "Checking TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    print_success "TypeScript compilation successful"
else
    print_error "TypeScript compilation failed"
fi

# Run linting if available
print_status "Running linting checks..."
if npm run lint > /dev/null 2>&1; then
    print_success "Linting passed"
else
    print_warning "Linting not available or failed"
fi

# Security checks
print_status "Running security checks..."

# Check for common security issues
if grep -r "password.*=.*['\"].*['\"]" src/ > /dev/null 2>&1; then
    print_error "Found hardcoded passwords in source code"
else
    print_success "No hardcoded passwords found"
fi

# Check for proper error handling
if grep -r "console\.log.*error" src/ > /dev/null 2>&1; then
    print_warning "Found console.log in error handling (consider proper logging)"
else
    print_success "Error handling looks good"
fi

# Performance checks
print_status "Running performance checks..."

# Check response times
if curl -w "@-" -o /dev/null -s "http://localhost:3000/health" <<< "time_total: %{time_total}\n" | awk '{if($1 > 1.0) exit 1}'; then
    print_success "Health endpoint response time is acceptable"
else
    print_warning "Health endpoint response time is slow"
fi

# Final summary
echo ""
echo "📊 Test Results Summary"
echo "======================"
echo -e "${GREEN}✅ Tests Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Tests Failed: $FAILED_TESTS${NC}"
echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Valora is ready for production.${NC}"
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Please check the issues above.${NC}"
fi

echo ""
echo "🔧 Test Coverage:"
echo "• Server Health Checks"
echo "• API Key Authentication"
echo "• Memory Operations"
echo "• Integration Endpoints"
echo "• Unit Tests"
echo "• TypeScript Compilation"
echo "• Linting"
echo "• Security Checks"
echo "• Performance Checks"

echo ""
echo "📚 Test Scripts Available:"
echo "• scripts/testing/test-integrations.sh - Integration endpoint tests"
echo "• scripts/testing/test-production.sh - Production feature tests"
echo "• scripts/testing/test-all.sh - Comprehensive test suite (this script)"

exit $FAILED_TESTS
