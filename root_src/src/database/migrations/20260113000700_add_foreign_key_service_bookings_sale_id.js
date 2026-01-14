/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table
        .foreign('sale_id')
        .references('id')
        .inTable('sales.sales')
        .onDelete('SET NULL');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropForeign('sale_id');
    });
};
