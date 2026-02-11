/**
 * Migration: Add last_login column to core.users table
 *
 * @description
 * Adds a last_login timestamp column to track when a user last logged in.
 * This column is used to determine if it's a user's first time logging in.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('core').alterTable('users', function (table) {
    table
      .timestamp('last_login', { useTz: true })
      .nullable()
      .comment('Timestamp of the last successful login');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('core').alterTable('users', function (table) {
    table.dropColumn('last_login');
  });
};
