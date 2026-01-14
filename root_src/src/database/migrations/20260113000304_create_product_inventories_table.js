/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('product').createTable('inventories', function (table) {
    table.increments('id').primary();
    table
      .integer('product_id')
      .unsigned()
      .unique()
      .notNullable()
      .references('id')
      .inTable('product.products')
      .onDelete('CASCADE')
      .comment('1:1 relationship');
    table.integer('quantity').defaultTo(0);
    table.integer('min_stock').defaultTo(0);
    table.timestamp('updated_at').nullable();

    table.index(['product_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('product').dropTable('inventories');
};
