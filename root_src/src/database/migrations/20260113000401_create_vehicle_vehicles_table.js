/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('vehicle').createTable('vehicles', function (table) {
    table.increments('id').primary();
    table.string('vin', 100).unique().comment('Vehicle Identification Number');
    table.string('make', 100).notNullable().comment('Toyota, Honda');
    table.string('model', 100).notNullable().comment('Avanza, Jazz');
    table.integer('year');
    table.string('color', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['vin']);
    table.index(['make', 'model']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('vehicle').dropTable('vehicles');
};
