/**
 * Migration template utilities for migration generator
 */

const fs = require('node:fs');
const path = require('node:path');

const MIGRATIONS_DIR = path.join(
  __dirname,
  '..',
  '..',
  'src',
  'database',
  'migrations',
);

function generateTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function generateMigrationTemplate(schemaName, tableName) {
  return `/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema("${schemaName}").createTable("${tableName}", function (table) {});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema("${schemaName}").dropTableIfExists("${tableName}");
};
`;
}

function generateNewSchemaMigrationTemplate(schemaName, tableName) {
  return `/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createSchemaIfNotExists("${schemaName}");
  return knex.schema.withSchema("${schemaName}").createTable("${tableName}", function (table) {});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema("${schemaName}").dropTableIfExists("${tableName}");
};
`;
}

function createMigrationFile(schemaName, tableName, isNewSchema = false) {
  const timestamp = generateTimestamp();
  const filename = `${timestamp}_create_${schemaName}_${tableName}_table.js`;
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const content = isNewSchema
    ? generateNewSchemaMigrationTemplate(schemaName, tableName)
    : generateMigrationTemplate(schemaName, tableName);

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }
  fs.writeFileSync(filepath, content, 'utf8');

  console.log(`\n✅ Migration file created successfully!`);
  console.log(`📁 Path: ${filepath}`);
  console.log(`📂 Schema: ${schemaName}`);
  console.log(`📝 Table: ${tableName}`);
  if (isNewSchema)
    console.log(`🆕 New schema will be created when migration runs`);
}

module.exports = {
  generateTimestamp,
  generateMigrationTemplate,
  generateNewSchemaMigrationTemplate,
  createMigrationFile,
  MIGRATIONS_DIR,
};
