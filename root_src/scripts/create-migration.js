/**
 * Migration file generator script
 * Creates Knex migration files with standardized naming and template
 *
 * Usage: pnpm run db:migrate:create:table
 */

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const MIGRATIONS_DIR = path.join(
  __dirname,
  '..',
  'src',
  'database',
  'migrations',
);

/**
 * Creates readline interface and prompts user for table name
 * @returns {Promise<string>} User input
 */
function promptForTableName() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter table name: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
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
 * Generates migration file content from template
 * @param {string} tableName - Table name for the migration
 * @returns {string} Migration file content
 */
function generateMigrationTemplate(tableName) {
  return `/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable(
    "${tableName}",
    function (table) {}
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("${tableName}");
};
`;
}

/**
 * Creates migration file in the migrations directory
 * @param {string} tableName - Validated table name
 */
function createMigrationFile(tableName) {
  const timestamp = generateTimestamp();
  const filename = `${timestamp}_create_${tableName}_table.js`;
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const content = generateMigrationTemplate(tableName);

  // Ensure migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  fs.writeFileSync(filepath, content, 'utf8');

  console.log(`\n✅ Migration file created successfully!`);
  console.log(`📁 Path: ${filepath}`);
  console.log(`📝 Table: ${tableName}`);
}

/**
 * Main entry point
 */
async function main() {
  console.log('🔧 Knex Migration File Generator\n');

  let normalizedName;
  let isValid = false;

  while (!isValid) {
    const rawInput = await promptForTableName();
    normalizedName = normalizeTableName(rawInput);
    const validation = validateTableName(normalizedName);

    if (!validation.valid) {
      console.error(`\n❌ Error: ${validation.error}`);
      console.log(
        'Valid table name examples: users, user_profiles, order_items\n',
      );
    } else {
      isValid = true;
    }
  }

  createMigrationFile(normalizedName);
}
// Export functions for testing
module.exports = {
  normalizeTableName,
  validateTableName,
  generateTimestamp,
  generateMigrationTemplate,
  createMigrationFile,
  promptForTableName,
  MIGRATIONS_DIR,
};

// Only run main when executed directly (not when required as module)
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}
