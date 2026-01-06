# Redis Configuration Refactoring

## Overview

This document explains the Redis configuration refactoring that follows the same pattern as the database configuration, providing environment-specific Redis settings with proper separation of concerns.

## Architecture

### Configuration Structure

```
src/config/
├── redis.config.ts              # Main Redis config with environment switching
├── local/redis.ts               # Local development configuration
├── development/redis.ts         # Development server configuration
└── production/redis.ts          # Production server configuration
```

### Configuration Flow

1. **Main Config (`redis.config.ts`)**:
   - Reads `NODE_ENV` environment variable
   - Loads appropriate environment-specific configuration
   - Registers configuration with NestJS using `registerAs('redis')`

2. **Environment-Specific Configs**:
   - **Local**: Docker container setup with minimal security
   - **Development**: Remote server with optional TLS
   - **Production**: Enhanced security, TLS, clustering support

3. **Service Integration**:
   - `RedisService` uses `ConfigService` to access configuration
   - Automatic connection setup based on environment
   - Environment-aware logging and error handling

## Configuration Details

### Local Environment (`local/redis.ts`)

```typescript
// Optimized for Docker Compose development
{
  host: 'redis',                 // Docker service name
  port: 6379,
  password: 'nest_password',
  db: 0,
  connectTimeout: 10000,         // Fast local connection
  tls: undefined                 // No TLS for local Docker
}
```

### Development Environment (`development/redis.ts`)

```typescript
// Remote development server
{
  host: 'your-dev-redis.example.com',
  port: 6379,
  password: 'dev_redis_password',
  connectTimeout: 20000,         // Slower remote connection
  tls: {                         // Optional TLS support
    rejectUnauthorized: true
  },
  enableAutoPipelining: true     // Performance optimization
}
```

### Production Environment (`production/redis.ts`)

```typescript
// High-security production setup
{
  host: 'prod-redis.example.com',
  port: 6380,
  password: process.env.PROD_REDIS_PASSWORD, // Required
  connectTimeout: 30000,         // Conservative timeout
  tls: {                         // TLS enabled by default
    rejectUnauthorized: true,
    servername: 'prod-redis.example.com'
  },
  sentinels: [...],             // High availability support
  commandTimeout: 5000,         // Command timeout
  enableOfflineQueue: false     // Disable queue in production
}
```

## Environment Variables

### Local Development (NODE_ENV=local)

```bash
LOCAL_REDIS_HOST=redis
LOCAL_REDIS_PORT=6379
LOCAL_REDIS_PASSWORD=nest_password
LOCAL_REDIS_DB=0
```

### Development Server (NODE_ENV=development)

```bash
DEV_REDIS_HOST=your-dev-redis.example.com
DEV_REDIS_PORT=6379
DEV_REDIS_PASSWORD=dev_redis_password
DEV_REDIS_DB=0
DEV_REDIS_TLS=false
DEV_REDIS_CONNECTION_NAME=nest-starter-dev
```

### Production (NODE_ENV=production)

```bash
PROD_REDIS_HOST=prod-redis.example.com
PROD_REDIS_PORT=6380
PROD_REDIS_PASSWORD=super_secure_password
PROD_REDIS_DB=0
PROD_REDIS_TLS=true
PROD_REDIS_CONNECTION_NAME=nest-starter-prod
PROD_REDIS_TLS_SERVERNAME=prod-redis.example.com
```

## Integration with NestJS

### Service Usage

```typescript
// src/redis/redis.service.ts
@Injectable()
export class RedisService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisConfig = this.configService.get('redis');
    this.client = new Redis.Redis({
      ...redisConfig,
      retryStrategy: redisConfig.retryStrategy,
    });
  }
}
```

### For New Applications

1. **Choose Environment**:
   - Set `NODE_ENV` appropriately
   - Configure environment variables

2. **Deploy Configuration**:
   - Use provided environment variable templates
   - Adjust connection settings for your infrastructure

## Security Considerations

### Development

- Use strong passwords even in development
- Consider TLS for remote development servers
- Limit Redis access to application networks

### Production

- **Always use TLS** in production
- Use **strong, unique passwords**
- Configure **Redis AUTH** and **network security**
- Enable **connection logging** for monitoring
- Consider **Redis Sentinel** for high availability

## Performance Tuning

### Connection Optimization

- **Local**: Fast timeouts for quick development cycles
- **Development**: Balanced settings for stable remote connections
- **Production**: Conservative timeouts for reliability

### Memory Management

- **Local**: `noeviction` policy for development data
- **Production**: `allkeys-lru` for memory efficiency

### Advanced Features

- **Auto-pipelining**: Enabled for development and production
- **Command timeout**: Configured for production reliability
- **Offline queue**: Disabled in production for immediate failures

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Check Redis server is running
   - Verify host and port configuration
   - Check network connectivity

2. **Authentication Failed**:
   - Verify password configuration
   - Check environment variable values

3. **TLS Errors**:
   - Verify TLS configuration
   - Check certificate paths and validity

4. **Environment Variables Not Loading**:
   - Verify `.env` file location
   - Check `NODE_ENV` setting
   - Restart application after changes

### Debug Commands

```bash
# Check Redis configuration
redis-cli -h <host> -p <port> -a <password> ping

# Test Redis connection
redis-cli -h <host> -p <port> -a <password> info server

# Check Redis logs
docker compose logs redis
```

The configuration is now ready for deployment across all environments with appropriate security and performance characteristics.
