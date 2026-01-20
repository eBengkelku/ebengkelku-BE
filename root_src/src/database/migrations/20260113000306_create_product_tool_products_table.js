/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('product').createTable('tool_products', function (table) {
    table
      .integer('product_id')
      .primary()
      .unsigned()
      .references('id')
      .inTable('product.products')
      .onDelete('CASCADE');
    table.integer('warranty_months').defaultTo(0);

    table.index(['product_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('product').dropTable('tool_products');
};
