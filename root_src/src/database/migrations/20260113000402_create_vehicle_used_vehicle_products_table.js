/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('vehicle').createTable('used_vehicle_products', function (table) {
    table
      .integer('product_id')
      .primary()
      .unsigned()
      .references('id')
      .inTable('product.products')
      .onDelete('CASCADE');
    table
      .integer('vehicle_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('vehicle.vehicles')
      .onDelete('CASCADE');
    table.integer('mileage').comment('in KM');
    table.string('plate_number', 50);

    table.index(['product_id']);
    table.index(['vehicle_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('vehicle').dropTable('used_vehicle_products');
};
