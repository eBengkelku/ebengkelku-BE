# Environment Configuration Guide

This project supports multiple database environments. Use the `NODE_ENV` variable to switch between them.

## Available Environments

### 1. Local Development (`NODE_ENV=local`)

- Uses local PostgreSQL database (Docker container or localhost)
- Default configuration for local development
- Environment file: `.env` (copy from `.env.local.example`)

### 2. Development Server (`NODE_ENV=development`)

- Connects to remote development PostgreSQL server
- Supports SSL connections
- Environment file: `.env.development` (copy from `.env.development.example`)

### 3. Production (`NODE_ENV=production`)

- Production database configuration
- Requires all environment variables to be set
- SSL enabled by default

## How to Switch Environments

### Option 1: Using Environment Files

```bash
# For local development (Docker or localhost)
cp .env.local.example .env
npm run dev:local

# For development server
cp .env.development.example .env.development
NODE_ENV=development npm run start:dev
```

### Option 2: Using Environment Variables

```bash
# Local development (default)
NODE_ENV=local npm run start:dev

# Development server
NODE_ENV=development npm run start:dev

# Production
NODE_ENV=production npm run start:prod
```

## Database Commands with Different Environments

```bash
# Local development
npm run db:migrate
npm run db:seed

# Development server
NODE_ENV=development npm run db:migrate
NODE_ENV=development npm run db:seed

# Or set the environment first
export NODE_ENV=development
npm run db:migrate
npm run db:seed
```

## Environment Variables Reference

### Local Development

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database username (default: nest_user)
- `DB_PASSWORD` - Database password (default: nest_password)
- `DB_NAME` - Database name (default: nest_app)

### Development Server

- `DEV_DB_HOST` - Development server host
- `DEV_DB_PORT` - Development server port (default: 5432)
- `DEV_DB_USER` - Development server username
- `DEV_DB_PASSWORD` - Development server password
- `DEV_DB_NAME` - Development server database name
- `DEV_DB_SSL` - Enable SSL (true/false)

### Production

- `PROD_DB_HOST` - Production database host
- `PROD_DB_PORT` - Production database port
- `PROD_DB_USER` - Production database username
- `PROD_DB_PASSWORD` - Production database password
- `PROD_DB_NAME` - Production database name
- `PROD_DB_SSL` - Enable SSL (true/false)

## Connection Pooling

Each environment has optimized connection pool settings:

- **Local**: min: 2, max: 10 connections
- **Development**: min: 1, max: 5 connections (smaller pool for shared server)
- **Production**: min: 2, max: 20 connections (larger pool for production load)

## Docker Usage

When running in Docker containers, the `local` environment works seamlessly with docker-compose configurations. The container can connect to other containers (like PostgreSQL) using service names as hostnames.
