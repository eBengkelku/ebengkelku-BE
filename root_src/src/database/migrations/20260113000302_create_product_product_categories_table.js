/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('product').createTable('product_categories', function (table) {
    table.increments('id').primary();
    table
      .integer('product_type_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('product.product_types')
      .onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['product_type_id', 'name']);
    table.index(['product_type_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('product').dropTable('product_categories');
};
