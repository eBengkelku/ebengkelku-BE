import { cleanEnv, str, port } from 'envalid';

/**
 * Development Server Database Configuration
 * For remote development PostgreSQL server
 *
 * NOTE: This connects to REMOTE dev server database.
 * Use NODE_ENV=development to activate this configuration.
 */

export interface DevelopmentDatabaseConfig {
  client: 'pg';
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl:
      | boolean
      | {
          rejectUnauthorized: boolean;
          ca?: string;
          key?: string;
          cert?: string;
        };
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

export default (): DevelopmentDatabaseConfig => {
  const env = cleanEnv(process.env, {
    DEV_DB_HOST: str({ default: 'your-dev-server.example.com' }),
    DEV_DB_PORT: port({ default: 5432 }),
    DEV_DB_USER: str({ default: 'dev_user' }),
    DEV_DB_PASSWORD: str({ default: 'dev_password' }),
    DEV_DB_NAME: str({ default: 'nest_app_dev' }),
    DEV_DB_SSL: str({ choices: ['true', 'false'], default: 'true' }),
    DEV_DB_SSL_REJECT_UNAUTHORIZED: str({
      choices: ['true', 'false'],
      default: 'true',
    }),
    DEV_DB_SSL_CA: str({ default: '' }),
    DEV_DB_SSL_KEY: str({ default: '' }),
    DEV_DB_SSL_CERT: str({ default: '' }),
  });

  const config: DevelopmentDatabaseConfig = {
    client: 'pg',
    connection: {
      host: env.DEV_DB_HOST,
      port: env.DEV_DB_PORT,
      user: env.DEV_DB_USER,
      password: env.DEV_DB_PASSWORD,
      database: env.DEV_DB_NAME,
      // SSL configuration for remote server
      ssl:
        env.DEV_DB_SSL === 'true'
          ? {
              rejectUnauthorized:
                env.DEV_DB_SSL_REJECT_UNAUTHORIZED !== 'false',
              ca: env.DEV_DB_SSL_CA || undefined,
              key: env.DEV_DB_SSL_KEY || undefined,
              cert: env.DEV_DB_SSL_CERT || undefined,
            }
          : false,
    },
    pool: {
      min: 1,
      max: 5, // Smaller pool for shared dev server
      // Connection timeout for remote server
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
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
    // Development-specific configurations
    debug: process.env.DB_DEBUG === 'true',
    acquireConnectionTimeout: 30000,
    // Retry logic for unstable connections
    asyncStackTraces: true,
  };

  return config;
};
// Example of hardcoded configuration (not recommended for production)
// Replace with actual values or environment variables as needed
// export default {
//   client: 'pg',
//   connection: {
//     host: process.env.DEV_DB_HOST || 'your-dev-server.example.com',
//     port: parseInt(process.env.DEV_DB_PORT || '5432', 10),
//     user: process.env.DEV_DB_USER || 'dev_user',
//     password: process.env.DEV_DB_PASSWORD || 'dev_password',
//     database: process.env.DEV_DB_NAME || 'nest_app_dev',
//     // SSL configuration for remote server
//     ssl:
//       process.env.DEV_DB_SSL === 'true'
//         ? {
//             rejectUnauthorized:
//               process.env.DEV_DB_SSL_REJECT_UNAUTHORIZED !== 'false',
//             ca: process.env.DEV_DB_SSL_CA,
//             key: process.env.DEV_DB_SSL_KEY,
//             cert: process.env.DEV_DB_SSL_CERT,
//           }
//         : false,
//   },
//   pool: {
//     min: 1,
//     max: 5, // Smaller pool for shared dev server
//     // Connection timeout for remote server
//     acquireTimeoutMillis: 30000,
//     createTimeoutMillis: 30000,
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
//   // Development-specific configurations
//   debug: process.env.DB_DEBUG === 'true',
//   acquireConnectionTimeout: 30000,
//   // Retry logic for unstable connections
//   asyncStackTraces: true,
// };
