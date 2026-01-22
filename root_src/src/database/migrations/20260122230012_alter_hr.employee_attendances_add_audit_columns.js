/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .withSchema('hr')
    .alterTable('employee_attendances', function (table) {
      table.timestamp('updated_at').nullable();
      table.timestamp('deleted_at').nullable();
      table
        .uuid('id_creator')
        .nullable()
        .references('public_id')
        .inTable('core.users');
      table
        .uuid('id_updater')
        .nullable()
        .references('public_id')
        .inTable('core.users');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .withSchema('hr')
    .alterTable('employee_attendances', function (table) {
      table.dropColumn('id_updater');
      table.dropColumn('id_creator');
      table.dropColumn('deleted_at');
      table.dropColumn('updated_at');
    });
};
