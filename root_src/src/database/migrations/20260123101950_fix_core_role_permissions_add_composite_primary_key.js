/**
 * Fix core.role_permissions table: Add composite primary key
 *
 * The composite primary key (role_id, permission_id) was lost during UUID migrations.
 * This migration restores it to enable ON CONFLICT clause in seed files.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Add composite primary key to role_permissions table
  await knex.schema
    .withSchema('core')
    .alterTable('role_permissions', function (table) {
      table.primary(['role_id', 'permission_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop the composite primary key
  await knex.schema
    .withSchema('core')
    .alterTable('role_permissions', function (table) {
      table.dropPrimary();
    });
};
