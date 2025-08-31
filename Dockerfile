# Valora MCP Server Dockerfile
FROM node:24-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    redis \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM base AS production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S valora && \
    adduser -S valora -u 1001

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R valora:valora /app

# Switch to non-root user
USER valora

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/monitoring/health/simple || exit 1

# Start the application
CMD ["npm", "start"]

# Development stage
FROM base AS development

# Install development dependencies
RUN npm install

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]