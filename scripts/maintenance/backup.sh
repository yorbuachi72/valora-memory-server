#!/bin/bash

# Valora Backup and Maintenance Script
# Handles backups, cleanup, and maintenance tasks

set -e

echo "🔧 Valora Backup and Maintenance"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backup counters
TOTAL_BACKUPS=0
SUCCESSFUL_BACKUPS=0
FAILED_BACKUPS=0

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((SUCCESSFUL_BACKUPS++))
    ((TOTAL_BACKUPS++))
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((FAILED_BACKUPS++))
    ((TOTAL_BACKUPS++))
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

print_status "Created backup directory: $BACKUP_DIR"

# Function to backup configuration files
backup_config() {
    print_status "Backing up configuration files..."
    
    # Backup environment files
    if [ -f ".env" ]; then
        cp .env "$BACKUP_DIR/env.backup"
        print_success "Environment file backed up"
    fi
    
    if [ -f ".env.production" ]; then
        cp .env.production "$BACKUP_DIR/env.production.backup"
        print_success "Production environment file backed up"
    fi
    
    # Backup nginx configuration
    if [ -d "nginx" ]; then
        cp -r nginx "$BACKUP_DIR/nginx.backup"
        print_success "Nginx configuration backed up"
    fi
    
    # Backup SSL certificates
    if [ -d "ssl" ]; then
        cp -r ssl "$BACKUP_DIR/ssl.backup"
        print_success "SSL certificates backed up"
    fi
    
    # Backup scripts
    if [ -d "scripts" ]; then
        cp -r scripts "$BACKUP_DIR/scripts.backup"
        print_success "Scripts backed up"
    fi
}

# Function to backup logs
backup_logs() {
    print_status "Backing up log files..."
    
    if [ -d "logs" ]; then
        cp -r logs "$BACKUP_DIR/logs.backup"
        print_success "Log files backed up"
    else
        print_warning "No logs directory found"
    fi
}

# Function to backup database (if using Docker)
backup_database() {
    print_status "Backing up database..."
    
    if command -v docker >/dev/null 2>&1; then
        # Backup PostgreSQL
        if docker ps --format "table {{.Names}}" | grep -q "valora-postgres"; then
            docker exec valora-postgres pg_dump -U valora valora > "$BACKUP_DIR/database.sql"
            print_success "PostgreSQL database backed up"
        else
            print_warning "PostgreSQL container not running"
        fi
        
        # Backup Redis
        if docker ps --format "table {{.Names}}" | grep -q "valora-redis"; then
            docker exec valora-redis redis-cli --rdb /data/dump.rdb
            docker cp valora-redis:/data/dump.rdb "$BACKUP_DIR/redis.rdb"
            print_success "Redis database backed up"
        else
            print_warning "Redis container not running"
        fi
    else
        print_warning "Docker not available, skipping database backup"
    fi
}

# Function to backup application data
backup_application() {
    print_status "Backing up application data..."
    
    # Backup source code
    if [ -d "src" ]; then
        cp -r src "$BACKUP_DIR/src.backup"
        print_success "Source code backed up"
    fi
    
    # Backup build artifacts
    if [ -d "build" ]; then
        cp -r build "$BACKUP_DIR/build.backup"
        print_success "Build artifacts backed up"
    fi
    
    # Backup package files
    if [ -f "package.json" ]; then
        cp package.json "$BACKUP_DIR/package.json.backup"
        print_success "Package.json backed up"
    fi
    
    if [ -f "package-lock.json" ]; then
        cp package-lock.json "$BACKUP_DIR/package-lock.json.backup"
        print_success "Package-lock.json backed up"
    fi
}

# Function to create compressed backup
create_compressed_backup() {
    print_status "Creating compressed backup..."
    
    local backup_name="valora_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    if tar -czf "$backup_name" -C "$BACKUP_DIR" .; then
        print_success "Compressed backup created: $backup_name"
        
        # Move to backups directory
        mv "$backup_name" "backups/"
        
        # Clean up temporary backup directory
        rm -rf "$BACKUP_DIR"
        
        print_success "Backup completed successfully"
    else
        print_error "Failed to create compressed backup"
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up old backups..."
    
    # Keep only last 7 days of backups
    find backups/ -name "valora_backup_*.tar.gz" -mtime +7 -delete
    
    print_success "Old backups cleaned up"
}

# Function to cleanup logs
cleanup_logs() {
    print_status "Cleaning up old log files..."
    
    # Clean up logs older than 30 days
    find logs/ -name "*.log" -mtime +30 -delete
    
    print_success "Old log files cleaned up"
}

# Function to cleanup temporary files
cleanup_temp_files() {
    print_status "Cleaning up temporary files..."
    
    # Remove temporary files
    find . -name "*.tmp" -delete
    find . -name "*.temp" -delete
    
    # Clean up node_modules if it's too large
    if [ -d "node_modules" ]; then
        local node_modules_size=$(du -sh node_modules | cut -f1)
        print_status "node_modules size: $node_modules_size"
    fi
    
    print_success "Temporary files cleaned up"
}

# Function to check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    local available_space=$(df -h / | tail -1 | awk '{print $4}')
    
    echo "Disk usage: ${disk_usage}%"
    echo "Available space: $available_space"
    
    if [ "$disk_usage" -gt 90 ]; then
        print_error "Disk space is critically low!"
    elif [ "$disk_usage" -gt 80 ]; then
        print_warning "Disk space is getting low"
    else
        print_success "Disk space is adequate"
    fi
}

# Function to restart services
restart_services() {
    print_status "Restarting services..."
    
    # Stop any running Valora processes
    pkill -f "production-valora.js" || true
    pkill -f "node.*valora" || true
    
    # Wait a moment
    sleep 2
    
    # Start services if Docker is available
    if command -v docker >/dev/null 2>&1; then
        if [ -f "docker-compose.production.yml" ]; then
            docker-compose -f docker-compose.production.yml restart
            print_success "Docker services restarted"
        fi
    else
        print_warning "Docker not available, skipping service restart"
    fi
}

# Main execution
echo "Starting backup and maintenance tasks..."

# Check disk space first
check_disk_space

# Perform backups
backup_config
backup_logs
backup_database
backup_application

# Create compressed backup
create_compressed_backup

# Perform cleanup
cleanup_old_backups
cleanup_logs
cleanup_temp_files

# Restart services if requested
if [ "$1" = "--restart" ]; then
    restart_services
fi

# Final summary
echo ""
echo "📊 Backup and Maintenance Summary"
echo "================================"
echo -e "${GREEN}✅ Successful Operations: $SUCCESSFUL_BACKUPS${NC}"
echo -e "${RED}❌ Failed Operations: $FAILED_BACKUPS${NC}"
echo -e "${BLUE}📊 Total Operations: $TOTAL_BACKUPS${NC}"

if [ $FAILED_BACKUPS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All backup and maintenance tasks completed successfully!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some operations failed. Please check the issues above.${NC}"
    exit 1
fi
