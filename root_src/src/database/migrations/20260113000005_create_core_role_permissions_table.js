/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .withSchema('core')
    .createTable('role_permissions', function (table) {
      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.roles')
        .onDelete('CASCADE');
      table
        .integer('permission_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.permissions')
        .onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.primary(['role_id', 'permission_id']);
      table.index(['role_id']);
      table.index(['permission_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('core').dropTable('role_permissions');
};
