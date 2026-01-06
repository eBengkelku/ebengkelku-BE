import { cleanEnv, str, port, num } from 'envalid';

/**
 * Development Server Redis Configuration
 * For remote development Redis server
 *
 * NOTE: This connects to REMOTE dev server Redis.
 * Use NODE_ENV=development to activate this configuration.
 */

export interface DevelopmentRedisConfig {
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
  retryStrategy: (times: number) => number;
  family: number;
  keepAlive: boolean;
  tls?: {
    rejectUnauthorized: boolean;
    ca?: string;
    key?: string;
    cert?: string;
  };
  connectionName: string;
  enableAutoPipelining: boolean;
  autoResendUnfulfilledCommands: boolean;
}

export default (): DevelopmentRedisConfig => {
  const env = cleanEnv(process.env, {
    DEV_REDIS_HOST: str({ default: 'your-dev-redis.example.com' }),
    DEV_REDIS_PORT: port({ default: 6379 }),
    DEV_REDIS_PASSWORD: str({ default: 'dev_redis_password' }),
    DEV_REDIS_DB: num({ default: 0 }),
    DEV_REDIS_TLS: str({ choices: ['true', 'false'], default: 'false' }),
    DEV_REDIS_TLS_REJECT_UNAUTHORIZED: str({
      choices: ['true', 'false'],
      default: 'true',
      desc: 'Whether to reject unauthorized TLS connections',
    }),
    DEV_REDIS_TLS_CA: str({
      default: '',
      desc: 'CA certificate for TLS connection',
    }),
    DEV_REDIS_TLS_KEY: str({
      default: '',
      desc: 'Client key for TLS connection',
    }),
    DEV_REDIS_TLS_CERT: str({
      default: '',
      desc: 'Client cert for TLS connection',
    }),
    DEV_REDIS_CONNECTION_NAME: str({
      default: 'nest-redis-dev',
      desc: 'Connection name for Redis client',
    }),
  });

  const config: DevelopmentRedisConfig = {
    host: env.DEV_REDIS_HOST,
    port: env.DEV_REDIS_PORT,
    password: env.DEV_REDIS_PASSWORD,
    db: env.DEV_REDIS_DB,

    // Connection options for remote development Redis
    connectTimeout: 10000, // 10 seconds for remote connection
    lazyConnect: false,
    maxRetriesPerRequest: 5,
    retryDelayOnFailover: 200,
    enableReadyCheck: true,
    maxMemoryPolicy: 'allkeys-lru',
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
    family: 4, // IPv4
    keepAlive: true,

    // TLS configuration for secure connection
    tls:
      env.DEV_REDIS_TLS === 'true'
        ? {
            rejectUnauthorized:
              env.DEV_REDIS_TLS_REJECT_UNAUTHORIZED === 'true',
            ca: env.DEV_REDIS_TLS_CA || undefined,
            key: env.DEV_REDIS_TLS_KEY || undefined,
            cert: env.DEV_REDIS_TLS_CERT || undefined,
          }
        : undefined,

    connectionName: env.DEV_REDIS_CONNECTION_NAME,
    enableAutoPipelining: true,
    autoResendUnfulfilledCommands: true,
  };

  return config;
};
