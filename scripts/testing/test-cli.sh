#!/bin/bash

# Valora CLI Command Test Script
# Tests all CLI commands and their functionality

# Removed set -e to allow script to continue on test failures

echo "💻 Testing Valora CLI Commands"
echo "=============================="

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

# Function to test CLI command
test_cli_command() {
    local command="$1"
    local expected_output="$2"
    local description="$3"
    local should_fail="$4"

    echo ""
    print_status "Testing CLI: $description"

    local output
    local exit_code

    if [ "$should_fail" = "true" ]; then
        # Command should fail
        if eval "$command" > /dev/null 2>&1; then
            print_error "$description - Expected to fail but succeeded"
            return 1
        else
            print_success "$description - Correctly failed as expected"
            return 0
        fi
    else
        # Command should succeed
        output=$(eval "$command" 2>&1)
        exit_code=$?

        if [ $exit_code -eq 0 ]; then
            if [ -n "$expected_output" ]; then
                if echo "$output" | grep -q "$expected_output"; then
                    print_success "$description - Output contains expected content"
                    return 0
                else
                    print_error "$description - Expected output not found"
                    echo "Output: $output"
                    return 1
                fi
            else
                print_success "$description - Command executed successfully"
                return 0
            fi
        else
            print_error "$description - Command failed with exit code $exit_code"
            echo "Output: $output"
            return 1
        fi
    fi
}

# Set CLI path
CLI_CMD="node build/cli/index.js"

echo ""
echo "🧪 Starting CLI Tests"
echo "===================="

# Test help command
test_cli_command "$CLI_CMD --help" "valora" "Help command"

# Test version command
test_cli_command "$CLI_CMD --version" "1.0.0" "Version command"

# Test version with branding enabled (default)
test_cli_command "$CLI_CMD --version" "Nkiru Technologies" "Version with branding"

# Test version with branding disabled
test_cli_command "VALORA_BRAND=off $CLI_CMD --version" "" "Version without branding"
if [ $? -eq 0 ]; then
    output=$(VALORA_BRAND=off $CLI_CMD --version 2>&1)
    if echo "$output" | grep -q "Nkiru Technologies"; then
        print_error "Version without branding - Branding still present"
    else
        print_success "Version without branding - Branding correctly disabled"
    fi
fi

# Test about command
test_cli_command "$CLI_CMD about" "Valora" "About command"
test_cli_command "$CLI_CMD about" "Nkiru Technologies" "About command with branding"

# Test about command with branding disabled
test_cli_command "VALORA_BRAND=off $CLI_CMD about" "" "About command without branding"
if [ $? -eq 0 ]; then
    output=$(VALORA_BRAND=off $CLI_CMD about 2>&1)
    if echo "$output" | grep -q "Nkiru Technologies"; then
        print_error "About without branding - Branding still present"
    else
        print_success "About without branding - Branding correctly disabled"
    fi
fi

# Test ASCII logo display
test_cli_command "$CLI_CMD about" "██╗" "ASCII logo display"

# Test invalid command
test_cli_command "$CLI_CMD invalid-command" "" "Invalid command handling" "true"

# Test start command (should fail without proper env vars)
print_status "Testing start command requirements..."
output=$($CLI_CMD start --help 2>&1)
if echo "$output" | grep -q "start"; then
    print_success "Start command help is available"
else
    print_error "Start command help not available"
fi

# Test branding in help text
output=$($CLI_CMD --help 2>&1)
if echo "$output" | grep -q "Memory Container Protocol"; then
    print_success "Help text contains proper description"
else
    print_error "Help text missing proper description"
fi

# Test command structure
print_status "Testing command structure..."
commands=("start" "about")
for cmd in "${commands[@]}"; do
    if $CLI_CMD $cmd --help > /dev/null 2>&1; then
        print_success "Command '$cmd' has help available"
    else
        print_error "Command '$cmd' missing help"
    fi
done

# Test environment variable handling
print_status "Testing environment variable handling..."
export VALORA_BRAND="off"
output=$($CLI_CMD about 2>&1)
if echo "$output" | grep -q "Nkiru Technologies"; then
    print_error "Environment variable VALORA_BRAND=off not working"
else
    print_success "Environment variable VALORA_BRAND=off working correctly"
fi

export VALORA_BRAND="on"
output=$($CLI_CMD about 2>&1)
if echo "$output" | grep -q "Nkiru Technologies"; then
    print_success "Environment variable VALORA_BRAND=on working correctly"
else
    print_error "Environment variable VALORA_BRAND=on not working"
fi

# Test error handling
print_status "Testing error handling..."
output=$($CLI_CMD nonexistent 2>&1)
if echo "$output" | grep -q "error\|Error\|unknown"; then
    print_success "Error handling for unknown commands"
else
    print_warning "Error handling for unknown commands could be improved"
fi

# Test command completion and suggestions
print_status "Testing command completion hints..."
output=$($CLI_CMD 2>&1)
if echo "$output" | grep -q "about\|start\|help\|version"; then
    print_success "Command suggestions available"
else
    print_warning "Command suggestions could be improved"
fi

# Summary
echo ""
echo "📊 CLI Test Results Summary"
echo "=========================="
echo -e "${GREEN}✅ Tests Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Tests Failed: $FAILED_TESTS${NC}"
echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All CLI tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some CLI tests failed. Please check the issues above.${NC}"
    exit 1
fi
