/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .withSchema('core')
    .createTable('user_roles', function (table) {
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.roles')
        .onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.primary(['user_id', 'role_id']);
      table.index(['user_id']);
      table.index(['role_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('core').dropTable('user_roles');
};
