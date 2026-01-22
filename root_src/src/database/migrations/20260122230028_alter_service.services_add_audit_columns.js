/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .withSchema('service')
    .alterTable('services', function (table) {
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
    .withSchema('service')
    .alterTable('services', function (table) {
      table.dropColumn('id_updater');
      table.dropColumn('id_creator');
    });
};
