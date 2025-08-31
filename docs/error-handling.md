# Error Handling & Troubleshooting

Complete guide to understanding, diagnosing, and resolving errors in Valora.

## Common Error Types

### Authentication Errors

#### 401 Unauthorized
**Cause**: Invalid or missing API key
**Solution**: Verify API key is correct and included in headers

```bash
# Check API key
echo $VALORA_API_KEY

# Test authentication
curl -X GET http://localhost:3000/auth/status \
  -H "Authorization: Bearer your-api-key"
```

#### 403 Forbidden
**Cause**: API key doesn't have required permissions
**Solution**: Check API key configuration

```bash
# Verify API key in environment
env | grep VALORA_API_KEY

# Test with correct key
curl -X GET http://localhost:3000/auth/status \
  -H "Authorization: Bearer correct-api-key"
```

### Validation Errors

#### 400 Bad Request - Validation Failed
**Cause**: Invalid request data format
**Solution**: Check request body against API schema

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["content"],
      "message": "Expected string, received number"
    }
  ]
}
```

**Common validation issues:**
- Missing required fields
- Wrong data types
- Invalid UUID format
- Empty content

### Memory Errors

#### 404 Not Found - Memory Not Found
**Cause**: Memory ID doesn't exist
**Solution**: Verify memory ID and check if it exists

```bash
# Check if memory exists
curl -X GET http://localhost:3000/memory/memory-id \
  -H "Authorization: Bearer your-api-key"

# Search for memories
curl -X POST http://localhost:3000/memory/semantic-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"query": "your search term"}'
```

#### 409 Conflict - Memory Already Exists
**Cause**: Trying to create memory with existing ID
**Solution**: Use unique ID or let system generate one

### Server Errors

#### 500 Internal Server Error
**Cause**: Unexpected server error
**Solution**: Check server logs and restart if needed

```bash
# Check server logs
tail -f /var/log/valora/valora.log

# Check PM2 logs
pm2 logs valora

# Restart application
pm2 restart valora
```

#### 503 Service Unavailable
**Cause**: Service temporarily unavailable
**Solution**: Check if all services are running

```bash
# Check service status
pm2 status

# Check health endpoint
curl http://localhost:3000/health

# Restart services
pm2 restart all
```

## Rate Limiting Errors

### 429 Too Many Requests
**Cause**: Rate limit exceeded
**Solution**: Wait or increase rate limits

```bash
# Check rate limit headers
curl -I http://localhost:3000/memory \
  -H "Authorization: Bearer your-api-key"

# Response headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 0
# X-RateLimit-Reset: 1642234567
```

**Solutions:**
1. Wait for rate limit to reset
2. Implement request throttling
3. Increase rate limits in configuration
4. Use bulk operations to reduce requests

## Configuration Errors

### Missing Environment Variables

#### VALORA_SECRET_KEY not set
```bash
# Error message
FATAL: VALORA_SECRET_KEY environment variable not set

# Solution
export VALORA_SECRET_KEY="your-secret-key"
# or add to .env file
echo "VALORA_SECRET_KEY=your-secret-key" >> .env
```

#### VALORA_API_KEY not set
```bash
# Error message
FATAL: VALORA_API_KEY environment variable not set

# Solution
export VALORA_API_KEY="your-api-key"
# or add to .env file
echo "VALORA_API_KEY=your-api-key" >> .env
```

### Invalid Configuration

#### Port already in use
```bash
# Error message
Error: listen EADDRINUSE: address already in use :::3000

# Solution
# Check what's using the port
lsof -i :3000

# Kill the process or change port
export PORT=3001
npm start
```

#### Invalid encryption key
```bash
# Error message
FATAL: Decryption failed. The encryption key may be incorrect

# Solution
# Generate new key
export VALORA_SECRET_KEY="$(openssl rand -base64 32)"

# Clear existing data (WARNING: This will delete all data)
rm -rf ~/.valora
npm start
```

## Database Errors

### File System Errors

#### Permission denied
```bash
# Error message
Error: EACCES: permission denied, open '/home/user/.valora/db.json'

# Solution
# Fix permissions
sudo chown -R $USER:$USER ~/.valora
# or
chmod 755 ~/.valora
chmod 644 ~/.valora/db.json
```

#### Disk space full
```bash
# Error message
Error: ENOSPC: no space left on device

# Solution
# Check disk space
df -h

# Clean up space
sudo apt autoremove
sudo apt autoclean
```

### Corrupted Database

#### JSON parse error
```bash
# Error message
SyntaxError: Unexpected token in JSON at position 0

# Solution
# Backup corrupted file
cp ~/.valora/db.json ~/.valora/db.json.backup

# Try to repair or recreate
rm ~/.valora/db.json
npm start
```

## AI/ML Service Errors

### Embedding Model Errors

#### Model download failed
```bash
# Error message
Error: Failed to download model

# Solution
# Check internet connection
ping google.com

# Clear model cache
rm -rf ~/.cache/huggingface

# Retry with different model
export EMBEDDING_MODEL_NAME="all-MiniLM-L6-v2"
```

#### Out of memory
```bash
# Error message
Error: CUDA out of memory

# Solution
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Use CPU-only model
export EMBEDDING_DEVICE="cpu"
```

### Tagging Service Errors

#### Model initialization failed
```bash
# Error message
Error: Failed to initialize tagging model

# Solution
# Check model configuration
echo $TAGGING_MODEL_NAME

# Use fallback model
export TAGGING_MODEL_NAME="facebook/bart-large-mnli"
```

## Network Errors

### Connection Refused
```bash
# Error message
Error: connect ECONNREFUSED 127.0.0.1:3000

# Solution
# Check if server is running
ps aux | grep node

# Start server
npm start

# Check port
netstat -tlnp | grep :3000
```

### Timeout Errors
```bash
# Error message
Error: ETIMEDOUT

# Solution
# Increase timeout
export REQUEST_TIMEOUT=60000

# Check network connectivity
curl -I http://localhost:3000/health
```

## Debugging Techniques

### Enable Debug Logging

```bash
# Set debug environment variable
export DEBUG=valora:*

# Start with debug logging
DEBUG=valora:* npm start
```

### Verbose Error Output

```bash
# Enable verbose errors
export NODE_ENV=development
export LOG_LEVEL=debug

# Start application
npm start
```

### Log Analysis

```bash
# Check application logs
tail -f /var/log/valora/valora.log

# Check error logs
tail -f /var/log/valora/error.log

# Check security logs
tail -f /var/log/valora/security.log

# Search for specific errors
grep "ERROR" /var/log/valora/valora.log
```

## Health Checks

### Application Health

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response
{
  "status": "Valora MCP Server is running.",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0"
}
```

### Service Health

```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs valora

# Check system resources
htop
```

### Database Health

```bash
# Check database file
ls -la ~/.valora/

# Check database size
du -sh ~/.valora/

# Validate JSON structure
node -e "
const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('~/.valora/db.json', 'utf8'));
  console.log('Database is valid');
} catch (e) {
  console.error('Database is corrupted:', e.message);
}
"
```

## Recovery Procedures

### Application Recovery

```bash
# Restart application
pm2 restart valora

# If PM2 not available
pkill -f "node.*valora"
npm start

# Check if restarted successfully
curl http://localhost:3000/health
```

### Database Recovery

```bash
# Backup current database
cp ~/.valora/db.json ~/.valora/db.json.backup

# Try to repair JSON
node -e "
const fs = require('fs');
try {
  const data = fs.readFileSync('~/.valora/db.json', 'utf8');
  const parsed = JSON.parse(data);
  fs.writeFileSync('~/.valora/db.json.repaired', JSON.stringify(parsed, null, 2));
  console.log('Database repaired');
} catch (e) {
  console.error('Could not repair database');
}
"

# Replace with repaired version
mv ~/.valora/db.json.repaired ~/.valora/db.json
```

### Configuration Recovery

```bash
# Reset to default configuration
cp .env.example .env

# Regenerate keys
export VALORA_SECRET_KEY="$(openssl rand -base64 32)"
export VALORA_API_KEY="$(openssl rand -hex 32)"

# Update .env file
echo "VALORA_SECRET_KEY=$VALORA_SECRET_KEY" > .env
echo "VALORA_API_KEY=$VALORA_API_KEY" >> .env
```

## Prevention Strategies

### Regular Maintenance

```bash
# Daily health checks
curl -f http://localhost:3000/health || echo "Health check failed"

# Weekly log rotation
logrotate /etc/logrotate.d/valora

# Monthly backup verification
tar -tzf /opt/backups/valora/valora_backup_*.tar.gz
```

### Monitoring Setup

```bash
# Set up monitoring alerts
# Add to crontab
*/5 * * * * curl -f http://localhost:3000/health || echo "Alert: Valora is down" | mail -s "Valora Alert" admin@yourdomain.com
```

### Error Prevention

1. **Validate inputs** before sending to API
2. **Handle rate limits** in client code
3. **Implement retry logic** for transient errors
4. **Monitor disk space** and memory usage
5. **Regular backups** of database and configuration

## Getting Help

### Collecting Information

When reporting issues, include:

1. **Error message** and stack trace
2. **Environment details** (OS, Node.js version)
3. **Configuration** (relevant environment variables)
4. **Steps to reproduce**
5. **Logs** from the time of error

### Debug Information

```bash
# Collect debug information
echo "=== System Information ==="
uname -a
node --version
npm --version

echo "=== Environment Variables ==="
env | grep VALORA

echo "=== Application Status ==="
pm2 status
curl -s http://localhost:3000/health

echo "=== Logs ==="
tail -n 50 /var/log/valora/valora.log
```

### Support Channels

1. **GitHub Issues**: For bug reports and feature requests
2. **Documentation**: Check this guide and API reference
3. **Community**: Join discussions for help
4. **Security**: Use SECURITY.md for security issues

---

*Last updated: January 2024*



