import { cleanEnv, str, port, num } from 'envalid';

/**
 * Local Redis Configuration
 * Connects to LOCAL Redis in Docker container
 *
 * NOTE: This is for local development with Redis running in Docker.
 * Use NODE_ENV=local to activate this configuration.
 */

export interface LocalRedisConfig {
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
  tls?: undefined;
}

export default (): LocalRedisConfig => {
  const env = cleanEnv(process.env, {
    LOCAL_REDIS_HOST: str({ default: 'redis' }), // Docker service name
    LOCAL_REDIS_PORT: port({ default: 6379 }),
    LOCAL_REDIS_PASSWORD: str({ default: 'local_redis_password' }),
    LOCAL_REDIS_DB: num({ default: 0 }),
  });

  const config: LocalRedisConfig = {
    host: env.LOCAL_REDIS_HOST,
    port: env.LOCAL_REDIS_PORT,
    password: env.LOCAL_REDIS_PASSWORD,
    db: env.LOCAL_REDIS_DB,

    // Connection options for local Docker Redis
    connectTimeout: 5000, // 5 seconds for local connection
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxMemoryPolicy: 'noeviction',
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
    family: 4, // IPv4
    keepAlive: true,
  };

  return config;
};
