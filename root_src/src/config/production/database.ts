import { cleanEnv, port, str } from 'envalid';
/**
 * Production Database Configuration
 * For production PostgreSQL server with enterprise features
 */

export interface ProductionDatabaseConfig {
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
    // Additional production-specific connection options
    keepAlive: boolean;
    statement_timeout: number;
    query_timeout: number;
    connectionTimeoutMillis: number;
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
    propagateCreateError: boolean;
  };
  migrations: {
    tableName: string;
    directory: string;
    disableTransactions: boolean;
    loadExtensions: string[];
  };
  seeds: {
    directory: string;
    loadExtensions: string[];
  };
  debug: boolean;
  acquireConnectionTimeout: number;
  asyncStackTraces: boolean;
  wrapIdentifier: (value: any, origImpl: any) => string;
  postProcessResponse: (result: any) => any;
  log: {
    warn: (message: any) => void;
    error: (message: any) => void;
    deprecate: (message: any) => void;
    debug: (message: any) => void;
  };
}

export default (): ProductionDatabaseConfig => {
  const env = cleanEnv(process.env, {
    PROD_DB_HOST: str({ default: 'prod-db.example.com' }),
    PROD_DB_PORT: port({ default: 5432 }),
    PROD_DB_USER: str({ default: 'prod_user' }),
    PROD_DB_PASSWORD: str({ default: 'prod_password' }),
    PROD_DB_NAME: str({ default: 'nest_app_prod' }),
    PROD_DB_SSL: str({ choices: ['true', 'false'], default: 'true' }),
    PROD_DB_SSL_REJECT_UNAUTHORIZED: str({
      choices: ['true', 'false'],
      default: 'true',
    }),
    PROD_DB_SSL_CA: str({ default: '' }),
    PROD_DB_SSL_KEY: str({ default: '' }),
    PROD_DB_SSL_CERT: str({ default: '' }),
    PROD_DB_STATEMENT_TIMEOUT: str({ default: '30000' }), // in ms
    PROD_DB_QUERY_TIMEOUT: str({ default: '60000' }), // in ms
    PROD_DB_CONNECTION_TIMEOUT: str({ default: '5000' }), // in ms
    PROD_DB_POOL_MIN: str({ default: '2' }),
    PROD_DB_POOL_MAX: str({ default: '20' }),
  });

  const config: ProductionDatabaseConfig = {
    client: 'pg',
    connection: {
      host: env.PROD_DB_HOST,
      port: env.PROD_DB_PORT,
      user: env.PROD_DB_USER,
      password: env.PROD_DB_PASSWORD,
      database: env.PROD_DB_NAME,
      // Production SSL configuration (required)
      ssl:
        env.PROD_DB_SSL === 'false'
          ? false
          : {
              rejectUnauthorized:
                env.PROD_DB_SSL_REJECT_UNAUTHORIZED !== 'false',
              ca: env.PROD_DB_SSL_CA || undefined,
              key: env.PROD_DB_SSL_KEY || undefined,
              cert: env.PROD_DB_SSL_CERT || undefined,
            },
      // Production-specific connection options
      keepAlive: true,
      statement_timeout: parseInt(env.PROD_DB_STATEMENT_TIMEOUT, 10),
      query_timeout: parseInt(env.PROD_DB_QUERY_TIMEOUT, 10),
      connectionTimeoutMillis: parseInt(env.PROD_DB_CONNECTION_TIMEOUT, 10),
    },
    pool: {
      min: parseInt(env.PROD_DB_POOL_MIN, 10),
      max: parseInt(env.PROD_DB_POOL_MAX, 10),
      // Production pool timeouts
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
      // Production-specific pool options
      propagateCreateError: false,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './src/database/migrations',
      // Production migration settings
      disableTransactions: false,
      loadExtensions: ['.js'],
    },
    seeds: {
      directory: './src/database/seeds',
      // Production seed settings (usually disabled)
      loadExtensions: ['.js'],
    },
    // Production-specific configurations
    debug: false, // Always false in production
    acquireConnectionTimeout: 60000,
    asyncStackTraces: false, // Disabled for performance
    // Error handling
    wrapIdentifier: (value: any, origImpl: any) => origImpl(value),
    // Performance optimizations
    postProcessResponse: (result: any) => result,
    // Logging for production monitoring
    log: {
      warn(message: any) {
        console.warn('[DB WARNING]:', message);
      },
      error(message: any) {
        console.error('[DB ERROR]:', message);
      },
      deprecate(message: any) {
        console.warn('[DB DEPRECATED]:', message);
      },
      debug(message: any) {
        // Only log debug in development
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[DB DEBUG]:', message);
        }
      },
    },
  };

  return config;
};
// Previous hardcoded export, now replaced with validated config above
// export default {
//   client: 'pg',
//   connection: {
//     host: process.env.PROD_DB_HOST,
//     port: parseInt(process.env.PROD_DB_PORT || '5432', 10),
//     user: process.env.PROD_DB_USER,
//     password: process.env.PROD_DB_PASSWORD,
//     database: process.env.PROD_DB_NAME,
//     // Production SSL configuration (required)
//     ssl:
//       process.env.PROD_DB_SSL === 'false'
//         ? false
//         : {
//             rejectUnauthorized:
//               process.env.PROD_DB_SSL_REJECT_UNAUTHORIZED !== 'false',
//             ca: process.env.PROD_DB_SSL_CA,
//             key: process.env.PROD_DB_SSL_KEY,
//             cert: process.env.PROD_DB_SSL_CERT,
//           },
//     // Production-specific connection options
//     keepAlive: true,
//     statement_timeout: parseInt(
//       process.env.PROD_DB_STATEMENT_TIMEOUT || '30000',
//       10,
//     ),
//     query_timeout: parseInt(process.env.PROD_DB_QUERY_TIMEOUT || '60000', 10),
//     connectionTimeoutMillis: parseInt(
//       process.env.PROD_DB_CONNECTION_TIMEOUT || '5000',
//       10,
//     ),
//   },
//   pool: {
//     min: parseInt(process.env.PROD_DB_POOL_MIN || '2', 10),
//     max: parseInt(process.env.PROD_DB_POOL_MAX || '20', 10),
//     // Production pool timeouts
//     acquireTimeoutMillis: 60000,
//     createTimeoutMillis: 30000,
//     destroyTimeoutMillis: 5000,
//     idleTimeoutMillis: 30000,
//     reapIntervalMillis: 1000,
//     createRetryIntervalMillis: 200,
//     // Production-specific pool options
//     propagateCreateError: false,
//   },
//   migrations: {
//     tableName: 'knex_migrations',
//     directory: './src/database/migrations',
//     // Production migration settings
//     disableTransactions: false,
//     loadExtensions: ['.js'],
//   },
//   seeds: {
//     directory: './src/database/seeds',
//     // Production seed settings (usually disabled)
//     loadExtensions: ['.js'],
//   },
//   // Production-specific configurations
//   debug: false, // Always false in production
//   acquireConnectionTimeout: 60000,
//   asyncStackTraces: false, // Disabled for performance
//   // Error handling
//   wrapIdentifier: (value: any, origImpl: any) => origImpl(value),
//   // Performance optimizations
//   postProcessResponse: (result: any) => result,
//   // Logging for production monitoring
//   log: {
//     warn(message: any) {
//       console.warn('[DB WARNING]:', message);
//     },
//     error(message: any) {
//       console.error('[DB ERROR]:', message);
//     },
//     deprecate(message: any) {
//       console.warn('[DB DEPRECATED]:', message);
//     },
//     debug(message: any) {
//       // Only log debug in development
//       if (process.env.NODE_ENV !== 'production') {
//         console.debug('[DB DEBUG]:', message);
//       }
//     },
//   },
// };
