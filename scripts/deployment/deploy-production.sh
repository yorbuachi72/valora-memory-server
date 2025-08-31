#!/bin/bash

# Valora Production Deployment Script
# This script sets up a complete production environment with nginx

set -e

echo "🚀 Deploying Valora MCP Server to Production"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
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

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Prerequisites check passed"

# Create necessary directories
print_status "Creating directory structure..."
mkdir -p nginx ssl logs/nginx logs/valora monitoring

# Generate SSL certificates (self-signed for development)
print_status "Generating SSL certificates..."
if [ ! -f ssl/valora.crt ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/valora.key -out ssl/valora.crt \
        -subj "/C=US/ST=State/L=City/O=Valora/CN=valora.localhost"
    print_success "SSL certificates generated"
else
    print_warning "SSL certificates already exist"
fi

# Create environment file if it doesn't exist
if [ ! -f .env.production ]; then
    print_status "Creating production environment file..."
    cat > .env.production << EOF
# Valora Production Environment Variables
NODE_ENV=production

# Valora Configuration
VALORA_API_KEY=your-secure-production-api-key
VALORA_SECRET_KEY=your-secure-production-secret-key

# Validr Integration
VALIDR_API_URL=https://your-validr-api.com
VALIDR_API_KEY=your-validr-api-key

# Database Configuration
POSTGRES_USER=valora
POSTGRES_PASSWORD=your-secure-postgres-password
REDIS_PASSWORD=your-secure-redis-password

# Monitoring
GRAFANA_PASSWORD=your-secure-grafana-password

# Domain Configuration
DOMAIN=valora.yourdomain.com
EOF
    print_warning "Please update .env.production with your actual values"
else
    print_warning "Production environment file already exists"
fi

# Build and start services
print_status "Building and starting services..."
docker-compose -f docker-compose.production.yml build

print_status "Starting production stack..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Nginx is running and healthy"
else
    print_error "Nginx health check failed"
fi

# Check Valora instances
for port in 3000 3001 3002; do
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        print_success "Valora instance on port $port is healthy"
    else
        print_error "Valora instance on port $port health check failed"
    fi
done

# Check Redis
if docker exec valora-redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is running and healthy"
else
    print_error "Redis health check failed"
fi

# Check PostgreSQL
if docker exec valora-postgres pg_isready -U valora > /dev/null 2>&1; then
    print_success "PostgreSQL is running and healthy"
else
    print_error "PostgreSQL health check failed"
fi

# Test API endpoints
print_status "Testing API endpoints..."

# Test health endpoint
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Health endpoint is accessible"
else
    print_error "Health endpoint is not accessible"
fi

# Test API key endpoint (should return 401 without auth)
if curl -s http://localhost/api-keys/test | grep -q "Missing or invalid authorization header"; then
    print_success "API key authentication is working"
else
    print_error "API key authentication test failed"
fi

# Show service status
print_status "Production services status:"
docker-compose -f docker-compose.production.yml ps

# Show logs
print_status "Recent logs:"
docker-compose -f docker-compose.production.yml logs --tail=20

# Show access information
echo ""
echo "🎉 Production Deployment Complete!"
echo "================================"
echo ""
echo "📡 Access Points:"
echo "• Main API: https://localhost"
echo "• Health Check: https://localhost/health"
echo "• Grafana Dashboard: http://localhost:3000 (admin/admin)"
echo "• Prometheus: http://localhost:9090"
echo ""
echo "🔑 API Testing:"
echo "curl -X GET https://localhost/health"
echo "curl -X GET https://localhost/api-keys/test -H 'Authorization: Bearer your-api-key'"
echo ""
echo "📊 Monitoring:"
echo "• Grafana: http://localhost:3000 (admin/your-grafana-password)"
echo "• Prometheus: http://localhost:9090"
echo ""
echo "🔧 Management:"
echo "• View logs: docker-compose -f docker-compose.production.yml logs"
echo "• Stop services: docker-compose -f docker-compose.production.yml down"
echo "• Restart services: docker-compose -f docker-compose.production.yml restart"
echo ""
echo "⚠️  Important:"
echo "• Update .env.production with your actual values"
echo "• Replace SSL certificates with real ones for production"
echo "• Configure your domain in nginx/valora.conf"
echo "• Set up proper monitoring and alerting"
echo ""
print_success "Valora MCP Server is now running in production with nginx!"
