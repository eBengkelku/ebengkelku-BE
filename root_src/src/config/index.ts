// Main App Configuration - Combines all validated sub-configurations
import { cleanEnv, str, port } from 'envalid';

// Import individual validated configurations
import databaseConfigFactory, { DatabaseConfig } from './database.config';
import redisConfigFactory, { RedisConfig } from './redis.config';
import loggerConfigFactory, {
  LoggerConfig,
  LoggerFormat,
} from './logger.config';
import serviceConfigFactory, { ServiceConfig } from './service.config';

export {
  LoggerFormat,
  DatabaseConfig,
  RedisConfig,
  LoggerConfig,
  ServiceConfig,
};

export enum NodeEnv {
  Local = 'local',
  Development = 'development',
  Production = 'production',
}

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  database: DatabaseConfig;
  redis: RedisConfig;
  logger: LoggerConfig;
  service: ServiceConfig;
  isLocalEnv: boolean;
  isDevelopmentEnv: boolean;
  isProductionEnv: boolean;
}

export default (): AppConfig => {
  // Validate core application environment variables
  const env = cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ['local', 'development', 'production'],
      default: 'local',
    }),
    PORT: port({ default: 3004 }),
  });

  const nodeEnv = env.NODE_ENV as NodeEnv;

  // Get validated configurations from individual config modules
  const database = databaseConfigFactory();
  const redis = redisConfigFactory();
  const logger = loggerConfigFactory();
  const service = serviceConfigFactory();

  const config: AppConfig = {
    nodeEnv,
    port: env.PORT,
    database,
    redis,
    logger,
    service,
    isLocalEnv: nodeEnv === NodeEnv.Local,
    isDevelopmentEnv: nodeEnv === NodeEnv.Development,
    isProductionEnv: nodeEnv === NodeEnv.Production,
  };

  console.log(
    `✅ Application configuration loaded successfully for environment: ${nodeEnv}`,
  );

  return config;
};
