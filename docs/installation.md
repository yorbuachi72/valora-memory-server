# Installation Guide

This guide will walk you through installing and setting up Valora on your system.

## Prerequisites

Before installing Valora, ensure you have the following:

- **Node.js** (v20 or later recommended)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- **Docker** (optional, for containerized deployment)

### Checking Your System

Verify your Node.js version:

```bash
node --version
# Should be v20.0.0 or higher
```

Verify npm is available:

```bash
npm --version
# Should be 9.0.0 or higher
```

## Installation Methods

### Method 1: Docker Compose (Recommended for Production)

#### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/valora.git
cd valora
```

#### Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
# Database Configuration
DB_PASSWORD=your_secure_database_password
POSTGRES_PASSWORD=your_secure_database_password

# Authentication Secrets
VALORA_JWT_SECRET="$(openssl rand -base64 32)"
VALORA_API_KEY="$(openssl rand -hex 32)"

# Optional: pgAdmin Access (for database management)
PGADMIN_EMAIL=admin@yourcompany.com
PGADMIN_PASSWORD=secure_pgadmin_password

# Branding
VALORA_BRAND=on
```

#### Step 3: Start All Services

```bash
# Start PostgreSQL, Redis, Valora, Nginx, and pgAdmin
docker-compose up -d

# Check logs
docker-compose logs -f valora
```

You should see output confirming successful initialization:

```
██╗   ██╗ █████╗ ██╗      ██████╗ ██████╗  █████╗
██║   ██║██╔══██╗██║     ██╔═══██╗██╔══██╗██╔══██╗
██║   ██║███████║██║     ██║   ██║██████╔╝███████║
╚██╗ ██╔╝██╔══██║██║     ██║   ██║██╔══██╗██╔══██║
 ╚████╔╝ ██║  ██║███████╗╚██████╔╝██║  ██║██║  ██║
  ╚═══╝  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
Powered by Nkiru Technologies

🧠 Valora memory container initialized at /home/user/.valora/db.json
✅ PostgreSQL storage service initialized
✅ Vector search service initialized
✅ Tagging Service Initialized (Mock Mode).
🚀 Valora MCP Server running on http://localhost:3000
🔒 Security features enabled: CORS, Rate Limiting, Input Sanitization
📊 Monitoring enabled on /monitoring
```

#### Step 4: Access Your Services

- **Valora API**: http://localhost:3000
- **pgAdmin**: http://localhost:5050 (admin@yourcompany.com / your_password)
- **API Documentation**: http://localhost:3000/api/docs

### Method 2: From Source (Development)

#### Step 1: Install Prerequisites

**PostgreSQL Installation:**

```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15

# Enable pgvector extension
sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

**Node.js Installation:**

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

#### Step 2: Clone and Setup

```bash
git clone https://github.com/your-username/valora.git
cd valora
npm install
npm run build
```

#### Step 3: Configure Database

```bash
# Create database
createdb valora

# Run schema migration
psql -d valora -f src/database/schema.sql

# Enable pgvector extension
psql -d valora -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### Step 4: Configure Environment

Create a `.env` file:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=valora
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
VALORA_JWT_SECRET="$(openssl rand -base64 32)"
VALORA_API_KEY="$(openssl rand -hex 32)"

# Server Configuration
PORT=3000
NODE_ENV=development

# Multi-tenancy
DEFAULT_TENANT_ID=default
```

#### Step 5: Start the Server

```bash
npm start
```

### Method 2: Using Docker

#### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/valora.git
cd valora
```

#### Step 2: Create Environment File

Create a `.env` file with your configuration:

```bash
VALORA_SECRET_KEY="your-super-secret-encryption-key"
VALORA_API_KEY="your-secure-api-key"
PORT=3000
NODE_ENV=production
```

#### Step 3: Build and Run with Docker

```bash
# Build the Docker image
docker build -t valora .

# Run the container
docker run -d \
  --name valora \
  -p 3000:3000 \
  --env-file .env \
  valora
```

#### Step 4: Verify Installation

```bash
# Check if container is running
docker ps

# View logs
docker logs valora
```

### Method 3: Using npm (Global Installation)

```bash
# Install globally
npm install -g valora

# Set environment variables
export VALORA_SECRET_KEY="your-super-secret-encryption-key"
export VALORA_API_KEY="your-secure-api-key"

# Start the server
valora start
```

## Post-Installation Setup

### 1. Verify Installation

Test that Valora is running correctly:

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
{
  "status": "Valora MCP Server is running.",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. Test Authentication

Verify your API key works:

```bash
curl -X GET http://localhost:3000/auth/status \
  -H "Authorization: Bearer your-secure-api-key"

# Expected response:
{
  "authenticated": true,
  "user": "api-user",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### 3. Create Your First Memory

```bash
curl -X POST http://localhost:3000/memory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secure-api-key" \
  -d '{
    "content": "This is my first memory in Valora!",
    "source": "installation-test"
  }'
```

## Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VALORA_SECRET_KEY` | Yes | - | Encryption key for secure storage |
| `VALORA_API_KEY` | Yes | - | API key for authentication |
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Node environment |
| `ALLOWED_ORIGINS` | No | http://localhost:3000 | CORS allowed origins |

### Security Configuration

#### Generating Secure Keys

**For VALORA_SECRET_KEY:**
```bash
# Generate a 32-character random string
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**For VALORA_API_KEY:**
```bash
# Generate a secure API key
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Production Configuration

For production deployments, consider these additional settings:

```bash
# Production environment
NODE_ENV=production

# Custom port
PORT=8080

# CORS origins (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
lsof -i :3000

# Kill the process or change the port
export PORT=3001
npm start
```

#### 2. Permission Denied

```bash
# Fix permissions for the .valora directory
sudo chown -R $USER:$USER ~/.valora
```

#### 3. Memory Container Initialization Failed

```bash
# Check if the directory exists
ls -la ~/.valora

# Recreate if needed
rm -rf ~/.valora
npm start
```

#### 4. Docker Issues

```bash
# Check Docker logs
docker logs valora

# Restart container
docker restart valora

# Rebuild if needed
docker build --no-cache -t valora .
```

### Getting Help

If you encounter issues during installation:

1. Check the [Error Handling](error-handling.md) guide
2. Review the [Troubleshooting](troubleshooting.md) section
3. Create an issue on GitHub with:
   - Your operating system
   - Node.js version
   - Error messages
   - Steps to reproduce

## Next Steps

After successful installation:

1. Read the [Quick Start Guide](quick-start.md)
2. Learn about [Chat Continuity](chat-continuity.md)
3. Explore the [API Reference](api-reference.md)
4. Set up [Production Deployment](deployment.md)

---

*Last updated: January 2024*
