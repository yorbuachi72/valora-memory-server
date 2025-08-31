#!/bin/bash

# Valora Complete Test Orchestration Script
# Runs all test workflows to comprehensively validate the product

# Removed set -e to allow script to continue on test failures

echo "🚀 Valora Complete Test Orchestration"
echo "====================================="
echo ""
echo "██╗   ██╗ █████╗ ██╗      ██████╗ ██████╗  █████╗ "
echo "██║   ██║██╔══██╗██║     ██╔═══██╗██╔══██╗██╔══██╗"
echo "██║   ██║███████║██║     ██║   ██║██████╔╝███████║"
echo "╚██╗ ██╔╝██╔══██║██║     ██║   ██║██╔══██╗██╔══██║"
echo " ╚████╔╝ ██║  ██║███████╗╚██████╔╝██║  ██║██║  ██║"
echo "  ╚═══╝  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝"
echo ""
echo "Memory Container Protocol (MCP) Server"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Performance metrics
START_TIME=$(date +%s)
TOTAL_RESPONSE_TIME=0
REQUEST_COUNT=0

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((PASSED_SUITES++))
    ((TOTAL_SUITES++))
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((FAILED_SUITES++))
    ((TOTAL_SUITES++))
}

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
}

print_section() {
    echo ""
    echo -e "${PURPLE}┌─────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${PURPLE}│${NC} $1${NC}"
    echo -e "${PURPLE}└─────────────────────────────────────────────────────────────────┘${NC}"
}

# Function to run test suite
run_test_suite() {
    local suite_name="$1"
    local script_path="$2"
    local description="$3"

    print_section "$suite_name - $description"

    if [ -f "$script_path" ]; then
        print_status "Starting $suite_name tests..."

        # Capture test results
        local output
        local exit_code

        if output=$(bash "$script_path" 2>&1); then
            print_success "$suite_name tests completed successfully"

            # Extract test counts from output (if available)
            local suite_passed=$(echo "$output" | grep -o "Tests Passed: [0-9]*" | grep -o "[0-9]*" | tail -1)
            local suite_failed=$(echo "$output" | grep -o "Tests Failed: [0-9]*" | grep -o "[0-9]*" | tail -1)

            if [ -n "$suite_passed" ]; then
                ((PASSED_TESTS += suite_passed))
                ((TOTAL_TESTS += suite_passed))
            fi

            if [ -n "$suite_failed" ]; then
                ((FAILED_TESTS += suite_failed))
                ((TOTAL_TESTS += suite_passed + suite_failed))
            fi

            return 0
        else
            print_error "$suite_name tests failed"
            echo "$output"
            return 1
        fi
    else
        print_error "$suite_name test script not found: $script_path"
        return 1
    fi
}

# Function to check system prerequisites
check_prerequisites() {
    print_header "🔧 System Prerequisites Check"

    local all_good=true

    # Check if Node.js is installed
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        print_success "Node.js installed: $node_version"
    else
        print_error "Node.js not found"
        all_good=false
    fi

    # Check if npm is installed
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        print_success "npm installed: $npm_version"
    else
        print_error "npm not found"
        all_good=false
    fi

    # Check if curl is installed
    if command -v curl >/dev/null 2>&1; then
        print_success "curl is available"
    else
        print_error "curl not found"
        all_good=false
    fi

    # Check if build exists
    if [ -d "build" ] && [ -f "build/cli/index.js" ]; then
        print_success "Valora build exists"
    else
        print_error "Valora build not found. Run: npm run build"
        all_good=false
    fi

    # Check if test environment is set up
    if [ -d "test-data" ]; then
        print_success "Test environment is set up"
    else
        print_status "Test environment not found. Setting up..."
        if ./scripts/testing/setup-test-env.sh >/dev/null 2>&1; then
            print_success "Test environment setup completed"
        else
            print_error "Failed to set up test environment"
            all_good=false
        fi
    fi

    if [ "$all_good" = false ]; then
        echo ""
        echo -e "${RED}❌ Prerequisites check failed. Please resolve the issues above.${NC}"
        exit 1
    fi

    print_success "All prerequisites met"
}

# Function to start test server
start_test_server() {
    print_section "Starting Test Server"

    # Check if server is already running
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        print_success "Test server is already running"
        return 0
    fi

    print_status "Starting Valora test server on port 3001..."

    # Set environment variables
    export VALORA_API_KEY="test-api-key-for-testing"
    export VALORA_SECRET_KEY="test-secret-key-for-encryption-testing"
    export VALORA_JWT_SECRET="test-jwt-secret-for-testing"
    export VALORA_PORT=3001
    export VALORA_BRAND="on"
    export NODE_ENV="test"

    # Start server in background
    VALORA_API_KEY="$VALORA_API_KEY" \
    VALORA_SECRET_KEY="$VALORA_SECRET_KEY" \
    VALORA_JWT_SECRET="$VALORA_JWT_SECRET" \
    VALORA_PORT="$VALORA_PORT" \
    VALORA_BRAND="$VALORA_BRAND" \
    NODE_ENV="$NODE_ENV" \
    node build/cli/index.js start >/dev/null 2>&1 &

    local server_pid=$!
    echo $server_pid > .test-server.pid

    # Wait for server to start
    local attempts=0
    local max_attempts=30

    while [ $attempts -lt $max_attempts ]; do
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            print_success "Test server started successfully (PID: $server_pid)"
            return 0
        fi

        sleep 1
        ((attempts++))
        print_status "Waiting for server to start... ($attempts/$max_attempts)"
    done

    print_error "Failed to start test server after $max_attempts attempts"
    return 1
}

# Function to stop test server
stop_test_server() {
    print_section "Stopping Test Server"

    if [ -f ".test-server.pid" ]; then
        local server_pid=$(cat .test-server.pid)

        if kill -0 $server_pid 2>/dev/null; then
            print_status "Stopping test server (PID: $server_pid)..."
            kill $server_pid 2>/dev/null || true

            # Wait for server to stop
            local attempts=0
            local max_attempts=10

            while [ $attempts -lt $max_attempts ]; do
                if ! kill -0 $server_pid 2>/dev/null; then
                    print_success "Test server stopped"
                    rm -f .test-server.pid
                    return 0
                fi

                sleep 1
                ((attempts++))
            done

            # Force kill if still running
            print_warning "Force stopping test server..."
            kill -9 $server_pid 2>/dev/null || true
            rm -f .test-server.pid
            print_success "Test server force stopped"
        else
            print_warning "Test server process not found"
            rm -f .test-server.pid
        fi
    else
        print_status "No test server PID file found"
    fi
}

# Function to run unit tests
run_unit_tests() {
    print_section "Running Unit Tests"

    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        print_status "Running Jest unit tests..."

        if npm test >/dev/null 2>&1; then
            print_success "Unit tests passed"

            # Try to extract test counts from Jest output
            local test_output=$(npm test 2>/dev/null)
            local passed=$(echo "$test_output" | grep -o "Tests:.*[0-9]* passed" | grep -o "[0-9]*" | tail -1)
            local failed=$(echo "$test_output" | grep -o "Tests:.*[0-9]* failed" | grep -o "[0-9]*" | tail -1)

            if [ -n "$passed" ]; then
                ((PASSED_TESTS += passed))
                ((TOTAL_TESTS += passed))
            fi

            if [ -n "$failed" ]; then
                ((FAILED_TESTS += failed))
                ((TOTAL_TESTS += passed + failed))
            fi

            return 0
        else
            print_error "Unit tests failed"
            npm test 2>&1 | head -20
            return 1
        fi
    else
        print_warning "No unit tests configured"
        return 0
    fi
}

# Function to generate comprehensive report
generate_comprehensive_report() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local avg_response_time="0"

    if [ $REQUEST_COUNT -gt 0 ]; then
        avg_response_time=$(echo "scale=3; $TOTAL_RESPONSE_TIME / $REQUEST_COUNT" | bc 2>/dev/null || echo "0")
    fi

    print_header "📊 Comprehensive Test Report"

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                           VALORA TEST RESULTS                              ║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    printf "║ Test Suites Run:     %-50s ║\n" "$TOTAL_SUITES"
    printf "║ Suites Passed:       %-50s ║\n" "$PASSED_SUITES"
    printf "║ Suites Failed:       %-50s ║\n" "$FAILED_SUITES"
    printf "║ Individual Tests:    %-50s ║\n" "$TOTAL_TESTS"
    printf "║ Tests Passed:        %-50s ║\n" "$PASSED_TESTS"
    printf "║ Tests Failed:        %-50s ║\n" "$FAILED_TESTS"
    printf "║ Total Duration:      %-50s ║\n" "${duration}s"
    printf "║ Average Response:    %-50s ║\n" "${avg_response_time}s"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"

    echo ""
    echo "📈 Test Coverage:"
    echo "• ✅ Environment Setup & Prerequisites"
    echo "• 🔍 API Functionality & Endpoints"
    echo "• 💻 CLI Commands & Branding"
    echo "• 🔗 Integration Features (Webhooks & Plugins)"
    echo "• 🔒 Security & Authentication"
    echo "• ⚡ Performance & Load Testing"
    echo "• 🔄 End-to-End User Workflows"
    echo "• 🧪 Unit Tests (Jest)"

    echo ""
    echo "🎯 Key Features Tested:"
    echo "• Memory Container Protocol (MCP) Implementation"
    echo "• Encrypted Knowledge Storage & Retrieval"
    echo "• Chat Import/Export Functionality"
    echo "• API Key Management & Authentication"
    echo "• Webhook & Plugin Integration System"
    echo "• Rate Limiting & Security Features"
    echo "• Multi-format Data Export (JSON/CSV)"
    echo "• CLI with Branding & Help System"

    if [ $FAILED_SUITES -eq 0 ] && [ $FAILED_TESTS -eq 0 ]; then
        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                                                                            ║${NC}"
        echo -e "${GREEN}║                         🎉 ALL TESTS PASSED! 🎉                          ║${NC}"
        echo -e "${GREEN}║                                                                            ║${NC}"
        echo -e "${GREEN}║               Valora MCP Server is PRODUCTION READY!                     ║${NC}"
        echo -e "${GREEN}║                                                                            ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"

        echo ""
        echo "🚀 Next Steps:"
        echo "• Deploy to staging environment"
        echo "• Run integration tests with external services"
        echo "• Set up monitoring and alerting"
        echo "• Create production deployment scripts"
        echo "• Document API for external developers"

    else
        echo ""
        echo -e "${RED}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                                                                            ║${NC}"
        echo -e "${RED}║                        ⚠️  ISSUES DETECTED ⚠️                           ║${NC}"
        echo -e "${RED}║                                                                            ║${NC}"
        echo -e "${RED}║              Please review failed tests before deployment                ║${NC}"
        echo -e "${RED}║                                                                            ║${NC}"
        echo -e "${RED}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"

        echo ""
        echo "🔧 Troubleshooting:"
        echo "• Check server logs for error details"
        echo "• Verify environment variables are set correctly"
        echo "• Ensure all dependencies are installed"
        echo "• Review network connectivity for integration tests"
        echo "• Check system resources for performance tests"
    fi

    echo ""
    echo "📋 Test Scripts Available:"
    echo "• scripts/testing/setup-test-env.sh     - Environment setup"
    echo "• scripts/testing/test-api.sh           - API functionality tests"
    echo "• scripts/testing/test-cli.sh           - CLI command tests"
    echo "• scripts/testing/test-integration.sh   - Integration tests"
    echo "• scripts/testing/test-security.sh      - Security tests"
    echo "• scripts/testing/test-performance.sh   - Performance tests"
    echo "• scripts/testing/test-e2e.sh           - End-to-end tests"
    echo "• scripts/testing/test-all-workflows.sh - Complete test suite (this script)"
}

# Main test execution
main() {
    print_header "🚀 Starting Complete Valora Test Orchestration"

    # Check prerequisites
    check_prerequisites

    # Start test server
    if ! start_test_server; then
        print_error "Cannot proceed without test server"
        exit 1
    fi

    # Run unit tests first
    run_unit_tests

    # Run API tests
    run_test_suite "API Tests" "scripts/testing/test-api.sh" "REST API functionality and endpoints"

    # Run CLI tests
    run_test_suite "CLI Tests" "scripts/testing/test-cli.sh" "Command-line interface and branding"

    # Run Integration tests
    run_test_suite "Integration Tests" "scripts/testing/test-integration.sh" "Webhooks and plugin systems"

    # Run Security tests
    run_test_suite "Security Tests" "scripts/testing/test-security.sh" "Authentication, authorization, and security features"

    # Run Performance tests
    run_test_suite "Performance Tests" "scripts/testing/test-performance.sh" "Load testing and performance benchmarks"

    # Run End-to-End tests
    run_test_suite "End-to-End Tests" "scripts/testing/test-e2e.sh" "Complete user workflow validation"

    # Stop test server
    stop_test_server

    # Generate comprehensive report
    generate_comprehensive_report

    # Exit with appropriate code
    if [ $FAILED_SUITES -eq 0 ] && [ $FAILED_TESTS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Trap to ensure cleanup on exit
trap 'stop_test_server' EXIT INT TERM

# Run main function
main "$@"
