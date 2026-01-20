/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.withSchema('vehicle').createTable('customer_garage', function (table) {
    table.increments('id').primary();
    table
      .integer('customer_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('core.users')
      .onDelete('CASCADE');
    table
      .integer('vehicle_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('vehicle.vehicles')
      .onDelete('CASCADE')
      .comment('Links to master vehicle data');
    table.string('license_plate', 50).unique().notNullable().comment('Plat Nomor');
    table.string('color_override', 50).nullable().comment('In case the car was repainted');
    table.integer('year_override').nullable();
    table.integer('current_mileage');
    table.timestamp('last_service_date').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();

    table.index(['customer_id']);
    table.index(['vehicle_id']);
    table.index(['license_plate']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.withSchema('vehicle').dropTable('customer_garage');
};
