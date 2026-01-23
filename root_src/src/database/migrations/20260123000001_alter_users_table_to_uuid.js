/**
 * Alter users table to use UUID primary key
 * Converts integer id to UUID with proper extension setup
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Enable UUID extension if not exists
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop the old primary key and recreate with UUID
  await knex.schema.alterTable('users', function (table) {
    // Drop the old id column
    table.dropColumn('id');
  });

  await knex.schema.alterTable('users', function (table) {
    // Add new UUID id column at the beginning
    table
      .uuid('id')
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .notNullable()
      .first();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('users', function (table) {
    table.dropColumn('id');
  });

  await knex.schema.alterTable('users', function (table) {
    table.increments('id').primary().first();
  });
};
