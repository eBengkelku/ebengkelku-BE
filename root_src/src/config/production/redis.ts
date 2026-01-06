import { cleanEnv, str, port, num } from 'envalid';

/**
 * Production Redis Configuration
 * For production Redis server with enhanced security and performance
 *
 * NOTE: This connects to PRODUCTION Redis server with security features.
 * Use NODE_ENV=production to activate this configuration.
 */

export interface ProductionRedisConfig {
  host: string;
  port: number;
  password: string;
  db: number;
  connectTimeout: number;
  lazyConnect: boolean;
  maxRetriesPerRequest: number;
  retryDelayOnFailover: number;
  enableReadyCheck: boolean;
  maxMemoryPolicy: string;
  retryStrategy: (times: number) => number | null;
  family: number;
  keepAlive: boolean;
  tls?: {
    rejectUnauthorized: boolean;
    ca?: string;
    key?: string;
    cert?: string;
    servername?: string;
  };
  connectionName: string;
  enableAutoPipelining: boolean;
  autoResendUnfulfilledCommands: boolean;
  commandTimeout: number;
  sentinels?: any;
  name: string;
  enableOfflineQueue: boolean;
}

export default (): ProductionRedisConfig => {
  const env = cleanEnv(process.env, {
    PROD_REDIS_HOST: str({ default: 'your-production-redis.example.com' }),
    PROD_REDIS_PORT: port({ default: 6379 }),
    PROD_REDIS_PASSWORD: str({ default: 'prod_redis_password' }),
    PROD_REDIS_DB: num({ default: 0 }),
    PROD_REDIS_TLS: str({ choices: ['true', 'false'], default: 'true' }),
    PROD_REDIS_TLS_REJECT_UNAUTHORIZED: str({
      choices: ['true', 'false'],
      default: 'true',
    }),
    PROD_REDIS_TLS_CA: str({
      default: '',
      desc: 'CA certificate for TLS connection',
    }),
    PROD_REDIS_TLS_KEY: str({
      default: '',
      desc: 'Client key for TLS connection',
    }),
    PROD_REDIS_TLS_CERT: str({
      default: '',
      desc: 'Client cert for TLS connection',
    }),
    PROD_REDIS_TLS_SERVERNAME: str({
      default: '',
      desc: 'Server name for TLS connection',
    }),
    PROD_REDIS_CONNECTION_NAME: str({
      default: 'nest-redis-prod',
      desc: 'Connection name for Redis client',
    }),
    PROD_REDIS_COMMAND_TIMEOUT: num({
      default: 5000,
      desc: 'Command timeout for Redis client',
    }), // 5 seconds
    PROD_REDIS_NAME: str({
      default: 'nest-redis-client',
      desc: 'Name of the Redis client',
    }),
  });

  const config: ProductionRedisConfig = {
    host: env.PROD_REDIS_HOST,
    port: env.PROD_REDIS_PORT,
    password: env.PROD_REDIS_PASSWORD,
    db: env.PROD_REDIS_DB,

    // Connection options for production Redis
    connectTimeout: 5000, // 5 seconds for production connection
    lazyConnect: false,
    maxRetriesPerRequest: 5,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxMemoryPolicy: 'allkeys-lru',
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
    family: 4, // IPv4
    keepAlive: true,

    // TLS configuration for secure connection
    tls:
      env.PROD_REDIS_TLS === 'true'
        ? {
            rejectUnauthorized:
              env.PROD_REDIS_TLS_REJECT_UNAUTHORIZED === 'true',
            ca: env.PROD_REDIS_TLS_CA || undefined,
            key: env.PROD_REDIS_TLS_KEY || undefined,
            cert: env.PROD_REDIS_TLS_CERT || undefined,
            servername: env.PROD_REDIS_TLS_SERVERNAME || undefined,
          }
        : undefined,

    connectionName: env.PROD_REDIS_CONNECTION_NAME,
    enableAutoPipelining: true,
    autoResendUnfulfilledCommands: true,
    commandTimeout: env.PROD_REDIS_COMMAND_TIMEOUT,
    name: env.PROD_REDIS_NAME,
    enableOfflineQueue: true,
  };

  return config;
};
