/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('product').createTable('spare_part_products', function (table) {
    table
      .integer('product_id')
      .primary()
      .unsigned()
      .references('id')
      .inTable('product.products')
      .onDelete('CASCADE');
    table.string('brand', 255);
    table.enum('grade', ['genuine', 'aftermarket']);

    table.index(['product_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('product').dropTable('spare_part_products');
};
