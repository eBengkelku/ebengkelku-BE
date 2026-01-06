import { registerAs } from '@nestjs/config';
import { cleanEnv, str } from 'envalid';

// Import environment-specific redis configurations
import localConfig from './local/redis';
import developmentConfig from './development/redis';
import productionConfig from './production/redis';

export interface RedisConfig {
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
  connectionName?: string;
  enableAutoPipelining?: boolean;
  autoResendUnfulfilledCommands?: boolean;
  commandTimeout?: number;
  sentinels?: any;
  name?: string;
  enableOfflineQueue?: boolean;
}

const getRedisConfig = (): RedisConfig => {
  // Validate NODE_ENV
  const env = cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ['local', 'development', 'production'],
      default: 'local',
    }),
  });

  const environment = env.NODE_ENV;

  const configurations: Record<string, RedisConfig> = {
    local: localConfig(),
    development: developmentConfig(),
    production: productionConfig(),
  };

  const config = configurations[environment] || configurations.local;

  console.log(`Loading Redis configuration for environment: ${environment}`);

  return config;
};

export default registerAs('redis', getRedisConfig);
