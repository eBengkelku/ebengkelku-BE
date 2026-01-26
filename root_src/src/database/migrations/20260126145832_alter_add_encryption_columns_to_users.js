/**
 * Migration: Add Encryption Columns to Core Users Table
 *
 * Adds columns for storing encrypted PII data and encryption status flag.
 * Supports hybrid RSA+AES encryption for Indonesia PDP compliance.
 *
 * @version 1.0.0
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('core').alterTable('users', function (table) {
    // Encrypted PII columns (JSON format with ciphertext, iv, tag, encryptedKey)
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

    // Encryption status flag
    table
      .boolean('is_encrypted')
      .notNullable()
      .defaultTo(false)
      .comment('Flag indicating if user PII is encrypted');

    // Index for efficient batch processing of unencrypted records
    table.index(['is_encrypted'], 'idx_users_is_encrypted');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('core').alterTable('users', function (table) {
    // Remove index first
    table.dropIndex(['is_encrypted'], 'idx_users_is_encrypted');

    // Remove columns
    table.dropColumn('encrypted_name');
    table.dropColumn('encrypted_email');
    table.dropColumn('encrypted_phone');
    table.dropColumn('is_encrypted');
  });
};
