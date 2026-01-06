import { cleanEnv, str, port } from 'envalid';

/**
 * Local Database Configuration
 * Connects to LOCAL PostgreSQL in Docker container
 *
 * NOTE: This is for local development with PostgreSQL running in Docker.
 * Use NODE_ENV=local to activate this configuration.
 */

export interface LocalDatabaseConfig {
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

export default (): LocalDatabaseConfig => {
  const env = cleanEnv(process.env, {
    LOCAL_DB_HOST: str({ default: 'postgresql' }), // Docker service name
    LOCAL_DB_PORT: port({ default: 5432 }),
    LOCAL_DB_USER: str({ default: 'nest_user' }),
    LOCAL_DB_PASSWORD: str({ default: 'nest_password' }),
    LOCAL_DB_NAME: str({ default: 'nest_app' }),
  });

  const config: LocalDatabaseConfig = {
    client: 'pg',
    connection: {
      host: env.LOCAL_DB_HOST,
      port: env.LOCAL_DB_PORT,
      user: env.LOCAL_DB_USER,
      password: env.LOCAL_DB_PASSWORD,
      database: env.LOCAL_DB_NAME,
      // No SSL for local Docker connection
      ssl: false,
    },
    pool: {
      min: 2,
      max: 10,
      // Local connection timeout settings (faster for local)
      acquireTimeoutMillis: 10000,
      createTimeoutMillis: 10000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './src/database/migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    // Debug mode (useful for development)
    debug: process.env.DB_DEBUG === 'true',
    acquireConnectionTimeout: 60000,
    // Enable async stack traces for better debugging
    asyncStackTraces: true,
  };

  return config;
};

// Previous hardcoded export, now replaced with validated config above
// export default {
//   client: 'pg',
//   connection: {
//     host: process.env.LOCAL_DB_HOST || 'postgresql', // Docker service name
//     port: parseInt(process.env.LOCAL_DB_PORT || '5432', 10),
//     user: process.env.LOCAL_DB_USER || 'nest_user',
//     password: process.env.LOCAL_DB_PASSWORD || 'nest_password',
//     database: process.env.LOCAL_DB_NAME || 'nest_app',
//     // No SSL for local Docker connection
//     ssl: false,
//   },
//   pool: {
//     min: 2,
//     max: 10,
//     // Local connection timeout settings (faster for local)
//     acquireTimeoutMillis: 10000,
//     createTimeoutMillis: 10000,
//     destroyTimeoutMillis: 5000,
//     idleTimeoutMillis: 30000,
//     reapIntervalMillis: 1000,
//     createRetryIntervalMillis: 100,
//   },
//   migrations: {
//     tableName: 'knex_migrations',
//     directory: './src/database/migrations',
//   },
//   seeds: {
//     directory: './src/database/seeds',
//   },
//   // Debug mode (useful for development)
//   debug: process.env.DB_DEBUG === 'true',
//   acquireConnectionTimeout: 60000,
//   // Enable async stack traces for better debugging
//   asyncStackTraces: true,
// };
