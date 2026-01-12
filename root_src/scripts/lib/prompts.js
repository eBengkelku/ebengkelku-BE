/**
 * User prompt utilities for migration generator
 */

const readline = require('node:readline');
const {
  normalizeSchemaName,
  normalizeTableName,
  validateSchemaName,
  validateTableName,
} = require('./validators');

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function promptForSchemaSelection(schemas) {
  const rl = createReadlineInterface();
  return new Promise((resolve) => {
    console.log('\nChoose the schema you want to use:\n');
    schemas.forEach((schema, index) =>
      console.log(`  ${index + 1}. ${schema}`),
    );
    console.log(`  ${schemas.length + 1}. Create new schema\n`);

    const askQuestion = () => {
      rl.question('Enter your choice (number): ', (answer) => {
        const choice = Number.parseInt(answer.trim(), 10);
        if (Number.isNaN(choice) || choice < 1 || choice > schemas.length + 1) {
          console.log(
            `\n❌ Invalid choice. Please enter a number between 1 and ${schemas.length + 1}\n`,
          );
          askQuestion();
          return;
        }
        rl.close();
        resolve(
          choice === schemas.length + 1
            ? { isNew: true, name: '' }
            : { isNew: false, name: schemas[choice - 1] },
        );
      });
    };
    askQuestion();
  });
}

function promptForInput(message) {
  const rl = createReadlineInterface();
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function promptAndValidateNewSchemaName() {
  let normalizedName,
    isValid = false;
  while (!isValid) {
    const rawInput = await promptForInput('Enter new schema name: ');
    normalizedName = normalizeSchemaName(rawInput);
    const validation = validateSchemaName(normalizedName);
    if (validation.valid) {
      isValid = true;
    } else {
      console.error(`\n❌ Error: ${validation.error}`);
      console.log(
        'Valid schema name examples: inventory, user_data, sales_reports\n',
      );
    }
  }
  return normalizedName;
}

async function promptAndValidateTableName() {
  let tableName,
    isValid = false;
  while (!isValid) {
    const rawInput = await promptForInput('Enter table name: ');
    tableName = normalizeTableName(rawInput);
    const validation = validateTableName(tableName);
    if (validation.valid) {
      isValid = true;
    } else {
      console.error(`\n❌ Error: ${validation.error}`);
      console.log(
        'Valid table name examples: users, user_profiles, order_items\n',
      );
    }
  }
  return tableName;
}

async function handleSchemaSelection(schemas) {
  if (schemas.length === 0) {
    console.log('⚠️  No schemas found. Will create new schema.\n');
    return {
      schemaName: await promptAndValidateNewSchemaName(),
      isNewSchema: true,
    };
  }
  const selection = await promptForSchemaSelection(schemas);
  if (selection.isNew) {
    return {
      schemaName: await promptAndValidateNewSchemaName(),
      isNewSchema: true,
    };
  }
  return { schemaName: selection.name, isNewSchema: false };
}

module.exports = {
  promptForSchemaSelection,
  promptForInput,
  promptAndValidateNewSchemaName,
  promptAndValidateTableName,
  handleSchemaSelection,
};
