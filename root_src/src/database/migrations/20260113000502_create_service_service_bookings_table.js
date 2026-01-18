/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .withSchema('service')
    .createTable('service_bookings', function (table) {
      table.increments('id').primary();
      table
        .integer('service_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('service.services')
        .onDelete('CASCADE');
      table
        .integer('customer_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('core.users')
        .onDelete('CASCADE');
      table
        .integer('garage_vehicle_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('vehicle.customer_garage')
        .onDelete('CASCADE');
      table
        .integer('assigned_employment_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('hr.employments')
        .onDelete('SET NULL')
        .comment('Mechanic');
      table
        .foreign('sale_id')
        .references('id')
        .inTable('sales.sales')
        .onDelete('SET NULL');
      table.timestamp('scheduled_at').notNullable();
      table
        .integer('mileage_at_service')
        .nullable()
        .comment('Tracked at check-in');
      table
        .enum('status', ['booked', 'in_progress', 'completed', 'cancelled'])
        .defaultTo('booked');
      table
        .integer('sale_id')
        .unsigned()
        .nullable()
        .comment('Generated after completion');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').nullable();

      table.index(['service_id', 'scheduled_at']);
      table.index(['customer_id']);
      table.index(['status']);
      table.index(['garage_vehicle_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropForeign('sale_id');
    });

  return knex.schema.withSchema('service').dropTable('service_bookings');
};
