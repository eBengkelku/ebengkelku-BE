/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .withSchema('core')
    .createTable('permissions', function (table) {
      table.increments('id').primary();
      table
        .string('key', 100)
        .unique()
        .notNullable()
        .comment('business.create, product.edit');
      table.string('name', 255).notNullable();
      table.text('description');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['key']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('core').dropTable('permissions');
};
