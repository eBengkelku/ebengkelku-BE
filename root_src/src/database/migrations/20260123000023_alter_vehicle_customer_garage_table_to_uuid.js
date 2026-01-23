/**
 * Alter vehicle.customer_garage table to use UUID primary key
 * Dependencies: service_bookings (garage_vehicle_id)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Drop FK from service_bookings
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropForeign(['garage_vehicle_id']);
    });

  // Drop and recreate id as UUID
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .notNullable()
        .first();
    });

  // Recreate FK column as UUID
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropColumn('garage_vehicle_id');
    });
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table
        .uuid('garage_vehicle_id')
        .notNullable()
        .references('id')
        .inTable('vehicle.customer_garage')
        .onDelete('CASCADE');
      table.index(['garage_vehicle_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop FK
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table.dropForeign(['garage_vehicle_id']);
      table.dropColumn('garage_vehicle_id');
    });

  // Revert to integer
  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table.dropColumn('id');
    });

  await knex.schema
    .withSchema('vehicle')
    .alterTable('customer_garage', function (table) {
      table.increments('id').primary().first();
    });

  // Recreate FK with integer
  await knex.schema
    .withSchema('service')
    .alterTable('service_bookings', function (table) {
      table
        .integer('garage_vehicle_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('vehicle.customer_garage')
        .onDelete('CASCADE');
      table.index(['garage_vehicle_id']);
    });
};
