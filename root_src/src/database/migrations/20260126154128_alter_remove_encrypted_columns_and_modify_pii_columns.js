/**
 * Migration: Remove Encrypted Columns and Modify PII Columns for In-Place Encryption
 *
 * This migration:
 * 1. Removes the separate encrypted_* columns (encrypted_name, encrypted_email, encrypted_phone)
 * 2. Alters PII columns (name, email, phone, provider, provider_id) from varchar to text
 *    to accommodate encrypted JSON data
 * 3. Keeps is_encrypted flag for tracking encryption status
 *
 * The encrypted data will be stored directly in the original columns as JSON format:
 * { ciphertext, iv, tag, encryptedKey }
 *
 * @version 1.0.0
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .withSchema('core')
    .alterTable('users', function (table) {
      // Step 1: Drop the separate encrypted columns (no longer needed)
      table.dropColumn('encrypted_name');
      table.dropColumn('encrypted_email');
      table.dropColumn('encrypted_phone');

      // Step 2: Alter PII columns from varchar to text to accommodate encrypted JSON data
      // Note: We need to use raw SQL for altering column types in PostgreSQL
    })
    .then(function () {
      // Use raw SQL to alter column types (Knex doesn't support altering column types directly)
      return knex.raw(`
      -- Alter name column from varchar(255) to text
      ALTER TABLE core.users ALTER COLUMN name TYPE text;
      
      -- Alter email column from varchar(255) to text
      ALTER TABLE core.users ALTER COLUMN email TYPE text;
      
      -- Alter phone column from varchar(50) to text
      ALTER TABLE core.users ALTER COLUMN phone TYPE text;
      
      -- Alter provider column from varchar(100) to text
      ALTER TABLE core.users ALTER COLUMN provider TYPE text;
      
      -- Alter provider_id column from varchar(255) to text
      ALTER TABLE core.users ALTER COLUMN provider_id TYPE text;
    `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // First, revert column types back to varchar
  // WARNING: This will fail if there are encrypted values that exceed varchar limits
  return knex
    .raw(
      `
    -- Revert name column to varchar(255)
    ALTER TABLE core.users ALTER COLUMN name TYPE varchar(255);
    
    -- Revert email column to varchar(255)
    ALTER TABLE core.users ALTER COLUMN email TYPE varchar(255);
    
    -- Revert phone column to varchar(50)
    ALTER TABLE core.users ALTER COLUMN phone TYPE varchar(50);
    
    -- Revert provider column to varchar(100)
    ALTER TABLE core.users ALTER COLUMN provider TYPE varchar(100);
    
    -- Revert provider_id column to varchar(255)
    ALTER TABLE core.users ALTER COLUMN provider_id TYPE varchar(255);
  `,
    )
    .then(function () {
      // Re-add the encrypted columns
      return knex.schema
        .withSchema('core')
        .alterTable('users', function (table) {
          table
            .text('encrypted_name')
            .nullable()
            .comment('Encrypted user name in JSON format');
          table
            .text('encrypted_email')
            .nullable()
            .comment('Encrypted user email in JSON format');
          table
            .text('encrypted_phone')
            .nullable()
            .comment('Encrypted user phone in JSON format');
        });
    });
};
