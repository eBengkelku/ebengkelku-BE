/**
 * Alter core.permissions table to use UUID primary key
 * Converts integer id to UUID with proper extension setup
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop foreign key constraints referencing core.permissions.id
  // 1. core.role_permissions
  await knex.schema
    .withSchema('core')
    .alterTable('role_permissions', function (table) {
      table.dropForeign(['permission_id']);
    });

  // Drop and recreate id column as UUID
  await knex.schema
    .withSchema('core')
    .alterTable('permissions', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('core')
    .alterTable('permissions', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .notNullable()
        .first();
    });

  // Recreate foreign key columns and constraints with UUID type
  // 1. core.role_permissions
  await knex.schema
    .withSchema('core')
    .alterTable('role_permissions', function (table) {
      table.dropColumn('permission_id');
    });
  await knex.schema
    .withSchema('core')
    .alterTable('role_permissions', function (table) {
      table
        .uuid('permission_id')
        .notNullable()
        .references('id')
        .inTable('core.permissions')
        .onDelete('CASCADE');
      table.index(['permission_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop foreign key constraints and columns
  // 1. core.role_permissions
  await knex.schema
    .withSchema('core')
    .alterTable('role_permissions', function (table) {
      table.dropForeign(['permission_id']);
      table.dropColumn('permission_id');
    });

  // Revert to integer
  await knex.schema
    .withSchema('core')
    .alterTable('permissions', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('core')
    .alterTable('permissions', function (table) {
      table.increments('id').primary().first();
    });

  // Recreate foreign keys with integer type
  // 1. core.role_permissions
  await knex.schema
    .withSchema('core')
    .alterTable('role_permissions', function (table) {
      table
        .integer('permission_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.permissions')
        .onDelete('CASCADE');
      table.index(['permission_id']);
    });
};
