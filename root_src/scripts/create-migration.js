/**
 * Migration file generator script with schema support
 * Usage: pnpm run db:migrate:create:table
 */

const {
  loadEnvConfig,
  createDbConnection,
  fetchSchemas,
  SYSTEM_SCHEMAS,
} = require('./lib/db');
const {
  normalizeSchemaName,
  normalizeTableName,
  validateSchemaName,
  validateTableName,
} = require('./lib/validators');
const {
  promptForSchemaSelection,
  promptAndValidateNewSchemaName,
  promptAndValidateTableName,
  handleSchemaSelection,
} = require('./lib/prompts');
const {
  generateTimestamp,
  generateMigrationTemplate,
  generateNewSchemaMigrationTemplate,
  createMigrationFile,
  MIGRATIONS_DIR,
} = require('./lib/templates');

async function main() {
  console.log('🔧 Knex Migration File Generator\n');
  let client = null;

  try {
    const config = loadEnvConfig();
    console.log('📡 Connecting to database...');
    client = await createDbConnection(config);
    console.log('✅ Connected to database\n');

    const schemas = await fetchSchemas(client);
    const { schemaName, isNewSchema } = await handleSchemaSelection(schemas);
    console.log(`\n✅ Selected schema: ${schemaName}\n`);

    const tableName = await promptAndValidateTableName();
    createMigrationFile(schemaName, tableName, isNewSchema);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    if (client) await client.end();
  }
}

// Re-export all functions for testing
module.exports = {
  loadEnvConfig,
  createDbConnection,
  fetchSchemas,
  SYSTEM_SCHEMAS,
  normalizeSchemaName,
  normalizeTableName,
  validateSchemaName,
  validateTableName,
  promptForSchemaSelection,
  promptAndValidateNewSchemaName,
  promptAndValidateTableName,
  handleSchemaSelection,
  generateTimestamp,
  generateMigrationTemplate,
  generateNewSchemaMigrationTemplate,
  createMigrationFile,
  MIGRATIONS_DIR,
};

if (require.main === module) {
  // NOSONAR: Top-level await not supported in CommonJS modules
  main().catch((error) => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}
