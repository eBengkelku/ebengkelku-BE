import { registerAs } from '@nestjs/config';
import { cleanEnv, str } from 'envalid';
import localConfig from './local/database';
import developmentConfig from './development/database';
import productionConfig from './production/database';

export interface DatabaseConfig {
  client: 'pg';
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl: boolean | { rejectUnauthorized: boolean };
  };
  pool: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
  };
  migrations: {
    tableName: string;
    directory: string;
  };
  seeds: {
    directory: string;
  };
  debug: boolean;
  acquireConnectionTimeout: number;
  asyncStackTraces: boolean;
}

const getDatabaseConfig = (): DatabaseConfig => {
  // Validate NODE_ENV
  const env = cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ['local', 'development', 'production'],
      default: 'local',
    }),
  });

  const environment = env.NODE_ENV;

  const configurations: Record<string, DatabaseConfig> = {
    local: localConfig(),
    development: developmentConfig(),
    production: productionConfig(),
  };

  const config = configurations[environment] || configurations.local;

  console.log(`Loading database configuration for environment: ${environment}`);

  return config;
};
export default registerAs('database', getDatabaseConfig);

// const getConnectionConfig = () => {
//   const environment = process.env.NODE_ENV || 'local';

//   const configurations: Record<string, any> = {
//     local: localConfig,
//     development: developmentConfig,
//     production: productionConfig,
//   };

//   const config = configurations[environment] || configurations.local;

//   console.log(`Loading database configuration for environment: ${environment}`);

//   return config;
// };

// export default registerAs('database', getConnectionConfig);
