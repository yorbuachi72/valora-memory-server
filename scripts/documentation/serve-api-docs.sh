#!/bin/bash

# Valora API Documentation Server
# Serves the API documentation locally for development and testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
port_available() {
    ! lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to wait for port to be available
wait_for_port() {
    local port=$1
    local max_attempts=30
    local attempt=1
    
    print_info "Waiting for port $port to be available..."
    
    while [ $attempt -le $max_attempts ]; do
        if port_available $port; then
            print_success "Port $port is available"
            return 0
        fi
        
        print_info "Attempt $attempt/$max_attempts: Port $port is still in use, waiting..."
        sleep 2
        ((attempt++))
    done
    
    print_error "Port $port is still in use after $max_attempts attempts"
    return 1
}

# Function to start documentation server
start_docs_server() {
    local port=$1
    local docs_dir=$2
    
    print_info "Starting API documentation server on port $port..."
    
    if command_exists python3; then
        print_info "Using Python 3 HTTP server"
        cd "$docs_dir" && python3 -m http.server "$port" &
        SERVER_PID=$!
    elif command_exists python; then
        print_info "Using Python HTTP server"
        cd "$docs_dir" && python -m SimpleHTTPServer "$port" &
        SERVER_PID=$!
    elif command_exists node; then
        print_info "Using Node.js HTTP server"
        cd "$docs_dir" && npx http-server -p "$port" &
        SERVER_PID=$!
    elif command_exists php; then
        print_info "Using PHP HTTP server"
        cd "$docs_dir" && php -S "localhost:$port" &
        SERVER_PID=$!
    else
        print_error "No suitable HTTP server found. Please install Python, Node.js, or PHP."
        exit 1
    fi
    
    # Wait a moment for server to start
    sleep 2
    
    # Check if server started successfully
    if kill -0 $SERVER_PID 2>/dev/null; then
        print_success "Documentation server started successfully (PID: $SERVER_PID)"
        return 0
    else
        print_error "Failed to start documentation server"
        return 1
    fi
}

# Function to stop documentation server
stop_docs_server() {
    if [ ! -z "$SERVER_PID" ]; then
        print_info "Stopping documentation server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        print_success "Documentation server stopped"
    fi
}

# Function to open browser
open_browser() {
    local url=$1
    
    print_info "Opening browser to $url"
    
    if command_exists open; then
        open "$url"
    elif command_exists xdg-open; then
        xdg-open "$url"
    elif command_exists gnome-open; then
        gnome-open "$url"
    else
        print_warning "Could not automatically open browser. Please visit: $url"
    fi
}

# Function to validate documentation files
validate_docs() {
    local docs_dir=$1
    
    print_info "Validating documentation files..."
    
    # Check if required files exist
    local required_files=("openapi.yaml" "api-explorer.html" "README.md")
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$docs_dir/$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        print_error "Missing required documentation files:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        return 1
    fi
    
    # Validate OpenAPI specification
    if command_exists swagger-codegen; then
        print_info "Validating OpenAPI specification..."
        if swagger-codegen validate -i "$docs_dir/openapi.yaml" >/dev/null 2>&1; then
            print_success "OpenAPI specification is valid"
        else
            print_warning "OpenAPI specification validation failed (continuing anyway)"
        fi
    elif command_exists npx; then
        print_info "Validating OpenAPI specification with swagger-parser..."
        if npx swagger-parser validate "$docs_dir/openapi.yaml" >/dev/null 2>&1; then
            print_success "OpenAPI specification is valid"
        else
            print_warning "OpenAPI specification validation failed (continuing anyway)"
        fi
    else
        print_warning "No OpenAPI validator found, skipping validation"
    fi
    
    print_success "Documentation validation completed"
    return 0
}

# Function to show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --port PORT        Port to serve documentation on (default: 8080)"
    echo "  -d, --docs-dir DIR     Documentation directory (default: docs/api)"
    echo "  -o, --open             Open browser automatically"
    echo "  -v, --validate         Validate documentation files"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                     # Start server on default port 8080"
    echo "  $0 -p 3001            # Start server on port 3001"
    echo "  $0 -o                 # Start server and open browser"
    echo "  $0 -v                 # Validate documentation files"
    echo ""
    echo "The server will serve the following files:"
    echo "  - OpenAPI Specification: http://localhost:PORT/openapi.yaml"
    echo "  - Interactive Explorer: http://localhost:PORT/api-explorer.html"
    echo "  - API Documentation: http://localhost:PORT/README.md"
}

# Main script
main() {
    # Default values
    PORT=8080
    DOCS_DIR="docs/api"
    OPEN_BROWSER=false
    VALIDATE_ONLY=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--port)
                PORT="$2"
                shift 2
                ;;
            -d|--docs-dir)
                DOCS_DIR="$2"
                shift 2
                ;;
            -o|--open)
                OPEN_BROWSER=true
                shift
                ;;
            -v|--validate)
                VALIDATE_ONLY=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Check if docs directory exists
    if [ ! -d "$DOCS_DIR" ]; then
        print_error "Documentation directory not found: $DOCS_DIR"
        print_info "Please run this script from the project root directory"
        exit 1
    fi
    
    # Validate documentation files
    if ! validate_docs "$DOCS_DIR"; then
        print_error "Documentation validation failed"
        exit 1
    fi
    
    # If only validation is requested, exit here
    if [ "$VALIDATE_ONLY" = true ]; then
        print_success "Documentation validation completed successfully"
        exit 0
    fi
    
    # Check if port is available
    if ! port_available $PORT; then
        print_warning "Port $PORT is already in use"
        read -p "Do you want to try a different port? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Find next available port
            NEW_PORT=$((PORT + 1))
            while ! port_available $NEW_PORT; do
                NEW_PORT=$((NEW_PORT + 1))
            done
            PORT=$NEW_PORT
            print_info "Using port $PORT instead"
        else
            print_error "Port $PORT is not available. Please stop the service using that port or choose a different port."
            exit 1
        fi
    fi
    
    # Start documentation server
    if start_docs_server $PORT "$DOCS_DIR"; then
        local url="http://localhost:$PORT"
        print_success "API documentation server is running!"
        echo ""
        echo "📚 Documentation URLs:"
        echo "  📖 API Documentation: $url/README.md"
        echo "  🔍 Interactive Explorer: $url/api-explorer.html"
        echo "  📋 OpenAPI Spec: $url/openapi.yaml"
        echo ""
        echo "Press Ctrl+C to stop the server"
        
        # Open browser if requested
        if [ "$OPEN_BROWSER" = true ]; then
            open_browser "$url/api-explorer.html"
        fi
        
        # Wait for interrupt signal
        trap stop_docs_server INT
        wait
    else
        print_error "Failed to start documentation server"
        exit 1
    fi
}

# Run main function
main "$@"



