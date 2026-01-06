# Dedicated Database Configuration Structure

This project now uses a dedicated file structure for database configurations, making it easier to manage environment-specific settings.

## Directory Structure

```text
src/config/
├── database.config.ts          # Main config loader
├── local/
│   └── database.ts             # Local development config
├── development/
│   └── database.ts             # Remote development server config
└── production/
    └── database.ts             # Production config
```

## Configuration Files

### 1. Local Environment (`src/config/local/database.ts`)

- **Purpose**: Docker containers and localhost development
- **Features**:
  - Basic connection pool (2-10 connections)
  - Debug mode support
  - No SSL required
  - Fast connection timeouts

### 2. Development Environment (`src/config/development/database.ts`)

- **Purpose**: Remote development PostgreSQL server
- **Features**:
  - Smaller connection pool (1-5 connections)
  - SSL support with custom certificates
  - Extended timeouts for remote connections
  - Retry logic for unstable connections
  - Advanced pool configuration

### 3. Production Environment (`src/config/production/database.ts`)

- **Purpose**: Production PostgreSQL server
- **Features**:
  - Large connection pool (2-20 connections, configurable)
  - Enterprise SSL configuration
  - Performance optimizations
  - Comprehensive logging
  - Advanced timeout settings
  - Connection keep-alive
  - Production-specific error handling

## Key Benefits

### 🏗️ **Organization**

- Each environment has its own dedicated file
- Clear separation of concerns
- Easy to locate and modify specific configurations

### 🔧 **Maintainability**

- No more large, complex configuration objects
- Environment-specific comments and documentation
- Easier code reviews and debugging

### ⚡ **Performance**

- Environment-optimized connection pools
- Tailored timeout settings
- Production-specific optimizations

### 🔒 **Security**

- Environment-specific SSL configurations
- Separate certificate handling
- Production hardening options

## Environment-Specific Features

### Local Development

```typescript
// Optimized for quick local development
{
  pool: { min: 2, max: 10 },
  debug: true,
  ssl: false,
  acquireConnectionTimeout: 60000
}
```

### Development Server

```typescript
// Optimized for shared remote server
{
  pool: { min: 1, max: 5 },
  ssl: { rejectUnauthorized: false },
  acquireTimeoutMillis: 30000,
  asyncStackTraces: true
}
```

### Production

```typescript
// Optimized for high performance and reliability
{
  pool: { min: 2, max: 20 },
  ssl: { rejectUnauthorized: true },
  keepAlive: true,
  statement_timeout: 30000,
  query_timeout: 60000
}
```

## How It Works

1. **Main Config Loader** (`database.config.ts`):
   - Reads `NODE_ENV` to determine environment
   - Imports the appropriate configuration file
   - Provides fallback to local config if needed

2. **Environment Detection**:

   ```bash
   NODE_ENV=local      → loads local/database.ts
   NODE_ENV=development → loads development/database.ts
   NODE_ENV=production  → loads production/database.ts
   ```

3. **Knex Integration**:
   - `knexfile.js` imports from the same configuration files
   - Ensures consistency between NestJS and Knex CLI

## Adding New Environments

To add a new environment (e.g., `staging`):

1. Create directory: `src/config/staging/`
2. Create file: `src/config/staging/database.ts`
3. Add import and configuration in `database.config.ts`
4. Update `knexfile.js` to include the new environment

## Usage Examples

```bash
# Local development
NODE_ENV=local npm run start:dev

# Development server
NODE_ENV=development npm run start:dev

# Production
NODE_ENV=production npm run start:prod

# Database migrations for specific environment
NODE_ENV=development npm run db:migrate
```

This structure provides maximum flexibility while keeping configurations organized and maintainable!
