#!/bin/bash

# Valora Health Check Monitoring Script
# Monitors all services and endpoints

set -e

echo "🏥 Valora Health Check Monitor"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check counters
TOTAL_CHECKS=0
HEALTHY_SERVICES=0
UNHEALTHY_SERVICES=0

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[HEALTHY]${NC} $1"
    ((HEALTHY_SERVICES++))
    ((TOTAL_CHECKS++))
}

print_error() {
    echo -e "${RED}[UNHEALTHY]${NC} $1"
    ((UNHEALTHY_SERVICES++))
    ((TOTAL_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check service health
check_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "Checking $service_name... "
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        print_success "$service_name"
        return 0
    else
        print_error "$service_name"
        return 1
    fi
}

# Function to check API endpoint with authentication
check_api_endpoint() {
    local endpoint_name="$1"
    local url="$2"
    local api_key="$3"
    
    echo -n "Checking $endpoint_name... "
    
    if curl -f -s "$url" -H "Authorization: Bearer $api_key" > /dev/null 2>&1; then
        print_success "$endpoint_name"
        return 0
    else
        print_error "$endpoint_name"
        return 1
    fi
}

# Function to check response time
check_response_time() {
    local service_name="$1"
    local url="$2"
    local max_time="$3"
    
    echo -n "Checking $service_name response time... "
    
    local response_time=$(curl -w "%{time_total}" -o /dev/null -s "$url")
    
    if (( $(echo "$response_time < $max_time" | bc -l) )); then
        print_success "$service_name (${response_time}s)"
        return 0
    else
        print_error "$service_name (${response_time}s - slow)"
        return 1
    fi
}

# Function to check Docker containers
check_docker_container() {
    local container_name="$1"
    
    echo -n "Checking Docker container $container_name... "
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        if docker inspect "$container_name" | grep -q '"Status": "running"'; then
            print_success "$container_name"
            return 0
        else
            print_error "$container_name (not running)"
            return 1
        fi
    else
        print_error "$container_name (not found)"
        return 1
    fi
}

# Main health check execution
echo "Starting comprehensive health checks..."

# Check development server
print_status "Checking development server..."
check_service "Development Server" "http://localhost:3000/health"

# Check production servers
print_status "Checking production servers..."
for port in 3000 3001 3002; do
    check_service "Production Server $port" "http://localhost:$port/health"
done

# Check API endpoints with authentication
print_status "Checking API endpoints..."
check_api_endpoint "API Key Test" "http://localhost:3000/api-keys/test" "dev-api-key"
check_api_endpoint "Memory Read" "http://localhost:3000/memory/test-id" "dev-api-key"
check_api_endpoint "Integration Status" "http://localhost:3000/integrations/status" "dev-api-key"

# Check Docker containers (if using Docker)
print_status "Checking Docker containers..."
if command -v docker >/dev/null 2>&1; then
    check_docker_container "valora-nginx"
    check_docker_container "valora-mcp-1"
    check_docker_container "valora-mcp-2"
    check_docker_container "valora-mcp-3"
    check_docker_container "valora-redis"
    check_docker_container "valora-postgres"
else
    print_warning "Docker not available, skipping container checks"
fi

# Check response times
print_status "Checking response times..."
check_response_time "Health Endpoint" "http://localhost:3000/health" "1.0"
check_response_time "API Key Test" "http://localhost:3000/api-keys/test" "2.0"

# Check disk space
print_status "Checking disk space..."
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    print_success "Disk space (${DISK_USAGE}% used)"
else
    print_error "Disk space (${DISK_USAGE}% used - low space)"
fi

# Check memory usage
print_status "Checking memory usage..."
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -lt 90 ]; then
    print_success "Memory usage (${MEMORY_USAGE}% used)"
else
    print_error "Memory usage (${MEMORY_USAGE}% used - high usage)"
fi

# Check log files
print_status "Checking log files..."
if [ -f "logs/valora.log" ]; then
    LOG_SIZE=$(du -h logs/valora.log | cut -f1)
    print_success "Log file exists (size: $LOG_SIZE)"
else
    print_warning "Log file not found"
fi

# Check SSL certificates (if using HTTPS)
print_status "Checking SSL certificates..."
if [ -f "ssl/valora.crt" ]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in ssl/valora.crt | cut -d= -f2)
    print_success "SSL certificate exists (expires: $CERT_EXPIRY)"
else
    print_warning "SSL certificate not found"
fi

# Check environment variables
print_status "Checking environment variables..."
if [ -n "$VALORA_API_KEY" ]; then
    print_success "VALORA_API_KEY is set"
else
    print_error "VALORA_API_KEY is not set"
fi

if [ -n "$VALORA_SECRET_KEY" ]; then
    print_success "VALORA_SECRET_KEY is set"
else
    print_error "VALORA_SECRET_KEY is not set"
fi

# Final summary
echo ""
echo "📊 Health Check Summary"
echo "======================"
echo -e "${GREEN}✅ Healthy Services: $HEALTHY_SERVICES${NC}"
echo -e "${RED}❌ Unhealthy Services: $UNHEALTHY_SERVICES${NC}"
echo -e "${BLUE}📊 Total Checks: $TOTAL_CHECKS${NC}"

if [ $UNHEALTHY_SERVICES -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All services are healthy!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some services are unhealthy. Please check the issues above.${NC}"
    exit 1
fi
