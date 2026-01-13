/**
 * Database connection utilities for migration generator
 */

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const SYSTEM_SCHEMAS = [
  'pg_catalog',
  'pg_toast',
  'pg_temp_1',
  'pg_toast_temp_1',
  'information_schema',
];

function loadEnvConfig() {
  const config = {
    host: process.env.DEV_DB_HOST,
    port: Number.parseInt(process.env.DEV_DB_PORT || '5432', 10),
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    ssl: process.env.DEV_DB_SSL === 'true',
  };

  const fieldToEnvVar = {
    host: 'DEV_DB_HOST',
    user: 'DEV_DB_USER',
    password: 'DEV_DB_PASSWORD',
    database: 'DEV_DB_NAME',
  };
  const requiredFields = ['host', 'user', 'password', 'database'];
  const missingFields = requiredFields.filter((field) => !config[field]);

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingFields.map((f) => fieldToEnvVar[f]).join(', ')}`,
    );
  }
  return config;
}

async function createDbConnection(config) {
  const { Client } = require('pg');
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
  });
  await client.connect();
  return client;
}

async function fetchSchemas(client) {
  const excludedSchemas = SYSTEM_SCHEMAS.map((s) => "'" + s + "'").join(', ');
  const query = `SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN (${excludedSchemas}) ORDER BY schema_name`;
  const result = await client.query(query);
  return result.rows.map((row) => row.schema_name);
}

module.exports = {
  loadEnvConfig,
  createDbConnection,
  fetchSchemas,
  SYSTEM_SCHEMAS,
};
