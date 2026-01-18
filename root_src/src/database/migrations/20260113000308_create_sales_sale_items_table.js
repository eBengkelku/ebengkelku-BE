/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('sales').createTable('sale_items', function (table) {
    table.increments('id').primary();
    table
      .integer('sale_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('sales.sales')
      .onDelete('CASCADE');
    table
      .integer('product_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('product.products')
      .onDelete('CASCADE');
    table.integer('quantity').notNullable();
    table.integer('unit_price').notNullable().comment('Price at time of sale');
    table.integer('subtotal').notNullable().comment('quantity × unit_price');

    table.index(['sale_id']);
    table.index(['product_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('sales').dropTable('sale_items');
};
