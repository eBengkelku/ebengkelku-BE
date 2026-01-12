/**
 * Migration file generator script with schema support
 * Creates Knex migration files with standardized naming and template
 * Supports PostgreSQL schema-based database architecture
 *
 * Usage: pnpm run db:migrate:create:table
 */

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MIGRATIONS_DIR = path.join(
  __dirname,
  '..',
  'src',
  'database',
  'migrations',
);

// PostgreSQL system schemas to exclude from selection
const SYSTEM_SCHEMAS = [
  'pg_catalog',
  'pg_toast',
  'pg_temp_1',
  'pg_toast_temp_1',
  'information_schema',
];

/**
 * Loads database configuration from environment variables
 * @returns {{ host: string, port: number, user: string, password: string, database: string, ssl: boolean }} Database config
 */
function loadEnvConfig() {
  const config = {
    host: process.env.DEV_DB_HOST,
    port: parseInt(process.env.DEV_DB_PORT || '5432', 10),
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    ssl: process.env.DEV_DB_SSL === 'true',
  };

  // Map config fields to actual env var names
  const fieldToEnvVar = {
    host: 'DEV_DB_HOST',
    user: 'DEV_DB_USER',
    password: 'DEV_DB_PASSWORD',
    database: 'DEV_DB_NAME',
  };

  // Validate required fields
  const requiredFields = ['host', 'user', 'password', 'database'];
  const missingFields = requiredFields.filter((field) => !config[field]);

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingFields.map((f) => fieldToEnvVar[f]).join(', ')}`,
    );
  }

  return config;
}

/**
 * Creates a PostgreSQL client connection
 * @param {object} config - Database configuration
 * @returns {Promise<import('pg').Client>} Connected PostgreSQL client
 */
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

/**
 * Fetches all available schemas from the database
 * @param {import('pg').Client} client - PostgreSQL client
 * @returns {Promise<string[]>} List of schema names
 */
async function fetchSchemas(client) {
  const query = `
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN (${SYSTEM_SCHEMAS.map((s) => `'${s}'`).join(', ')})
    ORDER BY schema_name
  `;

  const result = await client.query(query);
  return result.rows.map((row) => row.schema_name);
}

/**
 * Creates readline interface for user input
 * @returns {readline.Interface} Readline interface
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompts user for schema selection
 * @param {string[]} schemas - Available schemas
 * @returns {Promise<{ isNew: boolean, name: string }>} Selected schema or new schema indicator
 */
function promptForSchemaSelection(schemas) {
  const rl = createReadlineInterface();

  return new Promise((resolve) => {
    console.log('\nChoose the schema you want to use:\n');

    schemas.forEach((schema, index) => {
      console.log(`  ${index + 1}. ${schema}`);
    });
    console.log(`  ${schemas.length + 1}. Create new schema\n`);

    const askQuestion = () => {
      rl.question('Enter your choice (number): ', (answer) => {
        const choice = parseInt(answer.trim(), 10);

        if (isNaN(choice) || choice < 1 || choice > schemas.length + 1) {
          console.log(
            `\n❌ Invalid choice. Please enter a number between 1 and ${schemas.length + 1}\n`,
          );
          askQuestion();
          return;
        }

        rl.close();

        if (choice === schemas.length + 1) {
          resolve({ isNew: true, name: '' });
        } else {
          resolve({ isNew: false, name: schemas[choice - 1] });
        }
      });
    };

    askQuestion();
  });
}

/**
 * Prompts user for new schema name
 * @returns {Promise<string>} User input for schema name
 */
function promptForNewSchemaName() {
  const rl = createReadlineInterface();

  return new Promise((resolve) => {
    rl.question('Enter new schema name: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Prompts user for table name
 * @returns {Promise<string>} User input
 */
function promptForTableName() {
  const rl = createReadlineInterface();

  return new Promise((resolve) => {
    rl.question('Enter table name: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Normalizes schema name to lowercase
 * @param {string} name - Raw schema name input
 * @returns {string} Normalized schema name
 */
function normalizeSchemaName(name) {
  return name.toLowerCase();
}

/**
 * Normalizes table name to lowercase
 * @param {string} name - Raw table name input
 * @returns {string} Normalized table name
 */
function normalizeTableName(name) {
  return name.toLowerCase();
}

/**
 * Validates schema name format
 * Rules:
 * - Only lowercase letters and underscores allowed
 * - Cannot be empty
 * - Cannot start or end with underscore
 * - Cannot have consecutive underscores
 *
 * @param {string} name - Schema name to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
function validateSchemaName(name) {
  if (!name || name.length === 0) {
    return { valid: false, error: 'Schema name cannot be empty' };
  }

  if (!/^[a-z_]+$/.test(name)) {
    return {
      valid: false,
      error:
        'Schema name can only contain lowercase letters (a-z) and underscores (_)',
    };
  }

  if (name.startsWith('_')) {
    return { valid: false, error: 'Schema name cannot start with underscore' };
  }

  if (name.endsWith('_')) {
    return { valid: false, error: 'Schema name cannot end with underscore' };
  }

  if (name.includes('__')) {
    return {
      valid: false,
      error: 'Schema name cannot contain consecutive underscores',
    };
  }

  return { valid: true };
}

/**
 * Validates table name format
 * Rules:
 * - Only lowercase letters and underscores allowed
 * - Cannot be empty
 * - Cannot start or end with underscore
 * - Cannot have consecutive underscores
 *
 * @param {string} name - Table name to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
function validateTableName(name) {
  if (!name || name.length === 0) {
    return { valid: false, error: 'Table name cannot be empty' };
  }

  if (!/^[a-z_]+$/.test(name)) {
    return {
      valid: false,
      error:
        'Table name can only contain lowercase letters (a-z) and underscores (_)',
    };
  }

  if (name.startsWith('_')) {
    return { valid: false, error: 'Table name cannot start with underscore' };
  }

  if (name.endsWith('_')) {
    return { valid: false, error: 'Table name cannot end with underscore' };
  }

  if (name.includes('__')) {
    return {
      valid: false,
      error: 'Table name cannot contain consecutive underscores',
    };
  }

  return { valid: true };
}

/**
 * Generates timestamp in YYYYMMDDHHmmss format
 * @returns {string} Formatted timestamp
 */
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generates migration file content from template (for existing schema)
 * @param {string} schemaName - Schema name for the migration
 * @param {string} tableName - Table name for the migration
 * @returns {string} Migration file content
 */
function generateMigrationTemplate(schemaName, tableName) {
  return `/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .withSchema("${schemaName}")
    .createTable("${tableName}", function (table) {});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .withSchema("${schemaName}")
    .dropTableIfExists("${tableName}");
};
`;
}

/**
 * Generates migration file content for new schema (includes createSchemaIfNotExists)
 * @param {string} schemaName - New schema name for the migration
 * @param {string} tableName - Table name for the migration
 * @returns {string} Migration file content
 */
function generateNewSchemaMigrationTemplate(schemaName, tableName) {
  return `/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Create schema if it doesn't exist
  await knex.schema.createSchemaIfNotExists("${schemaName}");

  // Create table in the new schema
  return knex.schema
    .withSchema("${schemaName}")
    .createTable("${tableName}", function (table) {});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .withSchema("${schemaName}")
    .dropTableIfExists("${tableName}");
};
`;
}

/**
 * Creates migration file in the migrations directory
 * @param {string} schemaName - Validated schema name
 * @param {string} tableName - Validated table name
 * @param {boolean} isNewSchema - Whether this is a new schema
 */
function createMigrationFile(schemaName, tableName, isNewSchema = false) {
  const timestamp = generateTimestamp();
  const filename = `${timestamp}_create_${schemaName}_${tableName}_table.js`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

  const content = isNewSchema
    ? generateNewSchemaMigrationTemplate(schemaName, tableName)
    : generateMigrationTemplate(schemaName, tableName);

  // Ensure migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  fs.writeFileSync(filepath, content, 'utf8');

  console.log(`\n✅ Migration file created successfully!`);
  console.log(`📁 Path: ${filepath}`);
  console.log(`📂 Schema: ${schemaName}`);
  console.log(`📝 Table: ${tableName}`);
  if (isNewSchema) {
    console.log(`🆕 New schema will be created when migration runs`);
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log('🔧 Knex Migration File Generator\n');

  let client = null;

  try {
    // Load environment configuration
    const config = loadEnvConfig();

    // Connect to database
    console.log('📡 Connecting to database...');
    client = await createDbConnection(config);
    console.log('✅ Connected to database\n');

    // Fetch available schemas
    const schemas = await fetchSchemas(client);

    if (schemas.length === 0) {
      console.log('⚠️  No schemas found. Will create new schema.\n');
    }

    // Schema selection
    let schemaName;
    let isNewSchema = false;

    if (schemas.length > 0) {
      const schemaSelection = await promptForSchemaSelection(schemas);

      if (schemaSelection.isNew) {
        isNewSchema = true;
        let normalizedSchemaName;
        let isSchemaValid = false;

        while (!isSchemaValid) {
          const rawSchemaInput = await promptForNewSchemaName();
          normalizedSchemaName = normalizeSchemaName(rawSchemaInput);
          const schemaValidation = validateSchemaName(normalizedSchemaName);

          if (!schemaValidation.valid) {
            console.error(`\n❌ Error: ${schemaValidation.error}`);
            console.log(
              'Valid schema name examples: inventory, user_data, sales_reports\n',
            );
          } else {
            isSchemaValid = true;
          }
        }

        schemaName = normalizedSchemaName;
      } else {
        schemaName = schemaSelection.name;
      }
    } else {
      // No schemas found, must create new
      isNewSchema = true;
      let normalizedSchemaName;
      let isSchemaValid = false;

      while (!isSchemaValid) {
        const rawSchemaInput = await promptForNewSchemaName();
        normalizedSchemaName = normalizeSchemaName(rawSchemaInput);
        const schemaValidation = validateSchemaName(normalizedSchemaName);

        if (!schemaValidation.valid) {
          console.error(`\n❌ Error: ${schemaValidation.error}`);
          console.log(
            'Valid schema name examples: inventory, user_data, sales_reports\n',
          );
        } else {
          isSchemaValid = true;
        }
      }

      schemaName = normalizedSchemaName;
    }

    console.log(`\n✅ Selected schema: ${schemaName}\n`);

    // Table name input
    let tableName;
    let isTableValid = false;

    while (!isTableValid) {
      const rawTableInput = await promptForTableName();
      tableName = normalizeTableName(rawTableInput);
      const tableValidation = validateTableName(tableName);

      if (!tableValidation.valid) {
        console.error(`\n❌ Error: ${tableValidation.error}`);
        console.log(
          'Valid table name examples: users, user_profiles, order_items\n',
        );
      } else {
        isTableValid = true;
      }
    }

    // Create migration file
    createMigrationFile(schemaName, tableName, isNewSchema);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Close database connection
    if (client) {
      await client.end();
    }
  }
}

// Export functions for testing
module.exports = {
  loadEnvConfig,
  createDbConnection,
  fetchSchemas,
  normalizeSchemaName,
  normalizeTableName,
  validateSchemaName,
  validateTableName,
  generateTimestamp,
  generateMigrationTemplate,
  generateNewSchemaMigrationTemplate,
  createMigrationFile,
  promptForTableName,
  promptForSchemaSelection,
  promptForNewSchemaName,
  MIGRATIONS_DIR,
  SYSTEM_SCHEMAS,
};

// Only run main when executed directly (not when required as module)
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}
